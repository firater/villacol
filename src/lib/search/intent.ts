/**
 * Pure natural-language intent parsing: "6 people in Kalkan with a pool" turns
 * into structured filters plus whatever text is left over.
 *
 * No DB imports. `search_synonyms` rows arrive as an argument, which is what
 * makes the whole thing unit-testable and keeps the one SQL read in the action.
 *
 * Everything it emits uses the universal English filter keys from the Phase 8
 * contract, so an intent-derived filter and a URL-derived one are the same shape.
 */
import type { Locale } from "@/lib/locales";

/** Flattened `search_synonyms` row. */
export type SearchSynonym = {
  term: string;
  canonicalTerm: string;
  kind: "location" | "category" | "amenity" | "misc";
};

export type IntentFilters = {
  guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  category?: string;
  amenities?: string[];
};

export type SearchIntent = {
  filters: IntentFilters;
  /** The query with every matched fragment removed; "" when fully consumed. */
  residualQuery: string;
};

/**
 * Number words per locale, so "six people" works as well as "6 people". Only
 * 1-12 is worth covering: nobody types "twenty-four guests".
 */
const NUMBER_WORDS: Record<Locale, Record<string, number>> = {
  en: {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
    seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  },
  de: {
    ein: 1, eine: 1, eins: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6,
    sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwölf: 12,
  },
  ru: {
    один: 1, одна: 1, два: 2, две: 2, три: 3, четыре: 4, пять: 5, шесть: 6,
    семь: 7, восемь: 8, девять: 9, десять: 10, одиннадцать: 11, двенадцать: 12,
  },
};

/** Unit keywords that attach a number to a filter. */
const UNIT_PATTERNS: Record<
  Locale,
  { guests: string[]; bedrooms: string[]; bathrooms: string[] }
> = {
  en: {
    guests: ["guests", "guest", "people", "persons", "person", "pax", "sleeps", "adults"],
    bedrooms: ["bedrooms", "bedroom", "beds", "bed", "br"],
    bathrooms: ["bathrooms", "bathroom", "baths", "bath"],
  },
  de: {
    guests: ["gäste", "gast", "personen", "person", "erwachsene"],
    bedrooms: ["schlafzimmer", "zimmer", "betten", "bett"],
    bathrooms: ["badezimmer", "bäder", "bad"],
  },
  ru: {
    guests: ["гостей", "гости", "гость", "человек", "человека", "персон"],
    bedrooms: ["спальни", "спальня", "спален", "кровати"],
    bathrooms: ["ванные", "ванная", "ванных"],
  },
};

/** Lowercases, strips diacritics, and collapses whitespace. */
export function normalizeQuery(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The keyword tables have to go through `normalizeQuery` as well, not just the
 * guest's input. Stripping combining marks rewrites Cyrillic "й" as "и", so a
 * literal "гостей" in the table would never equal the normalized token.
 */
function normalizeTable<T>(entries: Record<string, T>): Record<string, T> {
  const normalized: Record<string, T> = {};
  for (const [key, value] of Object.entries(entries)) {
    normalized[normalizeQuery(key)] = value;
  }
  return normalized;
}

const NORMALIZED_NUMBER_WORDS = Object.fromEntries(
  Object.entries(NUMBER_WORDS).map(([locale, words]) => [
    locale,
    normalizeTable(words),
  ]),
) as Record<Locale, Record<string, number>>;

const NORMALIZED_UNITS = Object.fromEntries(
  Object.entries(UNIT_PATTERNS).map(([locale, units]) => [
    locale,
    {
      guests: units.guests.map(normalizeQuery),
      bedrooms: units.bedrooms.map(normalizeQuery),
      bathrooms: units.bathrooms.map(normalizeQuery),
    },
  ]),
) as typeof UNIT_PATTERNS;

function resolveNumber(token: string, locale: Locale): number | null {
  if (/^\d{1,2}$/.test(token)) {
    const parsed = Number.parseInt(token, 10);
    return parsed > 0 ? parsed : null;
  }
  return NORMALIZED_NUMBER_WORDS[locale][token] ?? null;
}

/**
 * Walks the token list looking for `<number> <unit>` and the reversed
 * `<unit> <number>` ("sleeps 6"). Consumed tokens are blanked out so they do
 * not also end up in the residual query or match a synonym.
 */
function extractCounts(
  tokens: (string | null)[],
  locale: Locale,
): Pick<IntentFilters, "guests" | "bedrooms" | "bathrooms"> {
  const units = NORMALIZED_UNITS[locale];
  const found: Pick<IntentFilters, "guests" | "bedrooms" | "bathrooms"> = {};

  const unitKindOf = (token: string): keyof typeof units | null => {
    if (units.guests.includes(token)) return "guests";
    if (units.bedrooms.includes(token)) return "bedrooms";
    if (units.bathrooms.includes(token)) return "bathrooms";
    return null;
  };

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === null) continue;

    const kind = unitKindOf(token);
    if (kind === null) continue;

    // Prefer the number before the unit ("6 guests"), then after ("sleeps 6").
    const before = index > 0 ? tokens[index - 1] : null;
    const after = index + 1 < tokens.length ? tokens[index + 1] : null;

    const beforeValue = before !== null ? resolveNumber(before, locale) : null;
    if (beforeValue !== null) {
      found[kind] ??= beforeValue;
      tokens[index - 1] = null;
      tokens[index] = null;
      continue;
    }

    const afterValue = after !== null ? resolveNumber(after, locale) : null;
    if (afterValue !== null) {
      found[kind] ??= afterValue;
      tokens[index] = null;
      tokens[index + 1] = null;
    }
  }

  return found;
}

/**
 * Matches synonyms longest-first so "old town kalkan" beats "kalkan", and a
 * multi-word term is never shadowed by one of its own words.
 */
function extractSynonyms(
  tokens: (string | null)[],
  synonyms: readonly SearchSynonym[],
): Pick<IntentFilters, "location" | "category" | "amenities"> {
  const prepared = synonyms
    .map((synonym) => ({
      ...synonym,
      words: normalizeQuery(synonym.term).split(" ").filter(Boolean),
    }))
    .filter((synonym) => synonym.words.length > 0)
    .sort((left, right) => right.words.length - left.words.length);

  const result: Pick<IntentFilters, "location" | "category" | "amenities"> = {};
  const amenities: string[] = [];

  for (const synonym of prepared) {
    for (let start = 0; start + synonym.words.length <= tokens.length; start += 1) {
      let matches = true;
      for (let offset = 0; offset < synonym.words.length; offset += 1) {
        if (tokens[start + offset] !== synonym.words[offset]) {
          matches = false;
          break;
        }
      }
      if (!matches) continue;

      if (synonym.kind === "location") result.location ??= synonym.canonicalTerm;
      else if (synonym.kind === "category") {
        result.category ??= synonym.canonicalTerm;
      } else if (synonym.kind === "amenity") {
        if (!amenities.includes(synonym.canonicalTerm)) {
          amenities.push(synonym.canonicalTerm);
        }
      }
      // `misc` synonyms exist for typo correction only; they are consumed from
      // the residual text but contribute no filter.

      for (let offset = 0; offset < synonym.words.length; offset += 1) {
        tokens[start + offset] = null;
      }
      break;
    }
  }

  if (amenities.length > 0) result.amenities = amenities;
  return result;
}

/** Filler words that should never survive into the residual full-text query. */
const STOP_WORDS: Record<Locale, string[]> = {
  en: ["in", "at", "near", "with", "a", "an", "the", "for", "and", "villa", "villas"],
  de: ["in", "bei", "nahe", "mit", "ein", "eine", "der", "die", "das", "und", "villa", "villen"],
  ru: ["в", "на", "у", "с", "и", "для", "вилла", "виллы"],
};

const NORMALIZED_STOP_WORDS = Object.fromEntries(
  Object.entries(STOP_WORDS).map(([locale, words]) => [
    locale,
    words.map(normalizeQuery),
  ]),
) as Record<Locale, string[]>;

export function parseSearchIntent(
  query: string,
  locale: Locale,
  synonyms: readonly SearchSynonym[] = [],
): SearchIntent {
  const normalized = normalizeQuery(query);
  if (normalized.length === 0) {
    return { filters: {}, residualQuery: "" };
  }

  const tokens: (string | null)[] = normalized.split(" ");

  // Counts first: "3 bedroom" must claim the 3 before a synonym pass can.
  const counts = extractCounts(tokens, locale);
  const fromSynonyms = extractSynonyms(tokens, synonyms);

  const stopWords = NORMALIZED_STOP_WORDS[locale];
  const residualQuery = tokens
    .filter(
      (token): token is string => token !== null && !stopWords.includes(token),
    )
    .join(" ")
    .trim();

  return {
    filters: { ...counts, ...fromSynonyms },
    residualQuery,
  };
}
