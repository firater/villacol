/**
 * The villa filter contract.
 *
 * Filters are **query parameters, never path segments**, and their keys are
 * universal English in every locale: a German visitor browsing `/de/villen`
 * still gets `?bedrooms=3&guests=6`. Only the *labels* are translated, from
 * `messages/*.json`. That keeps a pasted link portable across languages and
 * keeps one cache key shape per filter combination instead of three.
 *
 * This module is the only place in the codebase that spells the key names.
 * Everything else goes through `parseVillaFilters` / `buildVillaFilterQuery`,
 * so renaming a parameter is a one-file change.
 */
import { z } from "zod";

import type { VillaListingFilters, VillaListingSort } from "@/db/queries/villas.queries";
import { isValidDateString, type DateString } from "@/lib/dates";
import type { Locale } from "@/lib/locales";
import { toCents } from "@/lib/money";

/** Frozen so a typo like `FILTER_KEYS.push("rooms")` fails loudly. */
export const FILTER_KEYS = Object.freeze([
  "bedrooms",
  "bathrooms",
  "guests",
  "min_price",
  "max_price",
  "location",
  "category",
  "amenities",
  "features",
  "check_in",
  "check_out",
  "offers_only",
  "sort",
  "page",
] as const);

export type FilterKey = (typeof FILTER_KEYS)[number];

/** URL values for `?sort=`. `relevance` is excluded: it needs a text query. */
export const SORT_VALUES = Object.freeze([
  "default",
  "price_asc",
  "price_desc",
  "bedrooms_desc",
] as const);

export type SortValue = (typeof SORT_VALUES)[number];

export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 48;

/**
 * What a page receives: either a real `URLSearchParams` or Next's resolved
 * `searchParams` object, where a repeated key arrives as an array.
 */
export type SearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

/**
 * Prices in the URL are whole euros, not cents.
 *
 * `?min_price=500` is what a guest would expect to see for a €500 filter, and
 * it keeps the shareable link readable. The conversion to the cents the query
 * layer wants happens in `toListingFilters`, so cents never leak into a URL.
 */
const euroAmountSchema = z.coerce
  .number()
  .int()
  .min(0)
  .max(1_000_000);

const positiveIntSchema = z.coerce.number().int().min(1);

const dateSchema = z
  .string()
  .refine(isValidDateString, "Expected a YYYY-MM-DD calendar date");

/**
 * A key list such as `?amenities=private_pool,wifi`. Values are the universal
 * English `amenities.key` / `features.key` columns, which is why they are
 * matched with a strict character class rather than being localized.
 */
const keyListSchema = z
  .array(z.string().regex(/^[a-z0-9_]+$/))
  .max(30);

/**
 * Every field is optional, and `.catch()` is used throughout rather than
 * failing the parse. A filter URL is user-editable surface: `?guests=banana`
 * should quietly drop the guest filter and still render the listing, not throw
 * a 500 or show an error page.
 */
export const villaFilterSchema = z.object({
  bedrooms: positiveIntSchema.max(50).optional().catch(undefined),
  bathrooms: positiveIntSchema.max(50).optional().catch(undefined),
  guests: positiveIntSchema.max(100).optional().catch(undefined),
  minPrice: euroAmountSchema.optional().catch(undefined),
  maxPrice: euroAmountSchema.optional().catch(undefined),
  location: z.string().trim().min(1).max(160).optional().catch(undefined),
  category: z.string().trim().min(1).max(160).optional().catch(undefined),
  amenities: keyListSchema.optional().catch(undefined),
  features: keyListSchema.optional().catch(undefined),
  checkIn: dateSchema.optional().catch(undefined),
  checkOut: dateSchema.optional().catch(undefined),
  offersOnly: z.boolean().optional().catch(undefined),
  sort: z.enum(SORT_VALUES).optional().catch(undefined),
  page: positiveIntSchema.max(500).optional().catch(undefined),
});

export type VillaFilters = z.infer<typeof villaFilterSchema>;

/** Reads one value, taking the first when a key was repeated. */
function readParam(
  input: SearchParamsInput,
  key: FilterKey,
): string | undefined {
  if (input instanceof URLSearchParams) {
    return input.get(key) ?? undefined;
  }

  const value = input[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Reads a list, accepting both `?a=x&a=y` and `?a=x,y`. */
function readListParam(
  input: SearchParamsInput,
  key: FilterKey,
): string[] | undefined {
  const raw =
    input instanceof URLSearchParams ? input.getAll(key) : input[key];

  if (raw === undefined) return undefined;

  const values = Array.isArray(raw) ? raw : [raw];
  const split = values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return split.length > 0 ? [...new Set(split)] : undefined;
}

/** `?offers_only=true` / `1` / bare `?offers_only`. Anything else is false. */
function readBooleanParam(
  input: SearchParamsInput,
  key: FilterKey,
): boolean | undefined {
  const value = readParam(input, key);
  if (value === undefined) return undefined;
  if (value === "" || value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return undefined;
}

/**
 * The only reader of the key names. Returns a normalized, camelCase object; the
 * snake_case URL keys stop existing past this boundary.
 */
export function parseVillaFilters(input: SearchParamsInput): VillaFilters {
  const parsed = villaFilterSchema.parse({
    bedrooms: readParam(input, "bedrooms"),
    bathrooms: readParam(input, "bathrooms"),
    guests: readParam(input, "guests"),
    minPrice: readParam(input, "min_price"),
    maxPrice: readParam(input, "max_price"),
    location: readParam(input, "location"),
    category: readParam(input, "category"),
    amenities: readListParam(input, "amenities"),
    features: readListParam(input, "features"),
    checkIn: readParam(input, "check_in"),
    checkOut: readParam(input, "check_out"),
    offersOnly: readBooleanParam(input, "offers_only"),
    sort: readParam(input, "sort"),
    page: readParam(input, "page"),
  });

  return normalizeVillaFilters(parsed);
}

/**
 * Resolves contradictions that are individually valid but nonsense together.
 * Done once here so no downstream caller has to wonder whether a reversed price
 * band or a check-out before check-in can reach it.
 */
export function normalizeVillaFilters(filters: VillaFilters): VillaFilters {
  const normalized: VillaFilters = { ...filters };

  if (
    normalized.minPrice !== undefined &&
    normalized.maxPrice !== undefined &&
    normalized.minPrice > normalized.maxPrice
  ) {
    // Swapped rather than dropped: a reversed band is almost always a dragged
    // slider, and the guest's intent is the range between the two numbers.
    const { minPrice, maxPrice } = normalized;
    normalized.minPrice = maxPrice;
    normalized.maxPrice = minPrice;
  }

  // A stay needs both ends; one alone cannot be checked against the calendar.
  if (normalized.checkIn !== undefined && normalized.checkOut !== undefined) {
    if (normalized.checkIn >= normalized.checkOut) {
      normalized.checkIn = undefined;
      normalized.checkOut = undefined;
    }
  } else {
    normalized.checkIn = undefined;
    normalized.checkOut = undefined;
  }

  // `offers_only=false` is the default, so it does not belong in a URL.
  if (normalized.offersOnly === false) normalized.offersOnly = undefined;

  if (normalized.sort === "default") normalized.sort = undefined;
  if (normalized.page === 1) normalized.page = undefined;

  return normalized;
}

/**
 * The inverse of `parseVillaFilters`. Produces a stable, canonical query string
 * so the same filter state always yields the same URL — which is what lets the
 * cache, the browser history, and a shared link agree.
 *
 * Default values are omitted, so a cleared filter leaves no `?sort=default`
 * residue behind.
 */
export function buildVillaFilterQuery(filters: VillaFilters): URLSearchParams {
  const normalized = normalizeVillaFilters(filters);
  const params = new URLSearchParams();

  const setNumber = (key: FilterKey, value: number | undefined): void => {
    if (value !== undefined) params.set(key, String(value));
  };

  // Written in `FILTER_KEYS` order so the query string is deterministic.
  setNumber("bedrooms", normalized.bedrooms);
  setNumber("bathrooms", normalized.bathrooms);
  setNumber("guests", normalized.guests);
  setNumber("min_price", normalized.minPrice);
  setNumber("max_price", normalized.maxPrice);

  if (normalized.location !== undefined) {
    params.set("location", normalized.location);
  }
  if (normalized.category !== undefined) {
    params.set("category", normalized.category);
  }
  if (normalized.amenities !== undefined && normalized.amenities.length > 0) {
    params.set("amenities", [...normalized.amenities].sort().join(","));
  }
  if (normalized.features !== undefined && normalized.features.length > 0) {
    params.set("features", [...normalized.features].sort().join(","));
  }
  if (normalized.checkIn !== undefined) {
    params.set("check_in", normalized.checkIn);
  }
  if (normalized.checkOut !== undefined) {
    params.set("check_out", normalized.checkOut);
  }
  if (normalized.offersOnly === true) params.set("offers_only", "true");
  if (normalized.sort !== undefined) params.set("sort", normalized.sort);

  setNumber("page", normalized.page);

  return params;
}

/** `?bedrooms=3&guests=6`, or `""` when nothing is filtered. */
export function buildVillaFilterQueryString(filters: VillaFilters): string {
  const query = buildVillaFilterQuery(filters).toString();
  return query.length > 0 ? `?${query}` : "";
}

/**
 * Hands the URL state to the Phase 4 query layer.
 *
 * `lockOffersOnly` is how `/villa-offers` works: it forces the offers filter on
 * while every other filter still applies, rather than being a separate loader
 * that could drift from the main listing.
 */
export function toListingFilters(
  filters: VillaFilters,
  locale: Locale,
  options: { lockOffersOnly?: boolean; pageSize?: number } = {},
): VillaListingFilters {
  const normalized = normalizeVillaFilters(filters);

  return {
    locale,
    offersOnly: options.lockOffersOnly === true ? true : normalized.offersOnly,
    locationSlug: normalized.location,
    categorySlug: normalized.category,
    amenityKeys: normalized.amenities,
    featureKeys: normalized.features,
    guests: normalized.guests,
    bedrooms: normalized.bedrooms,
    bathrooms: normalized.bathrooms,
    minPriceCents:
      normalized.minPrice !== undefined
        ? toCents(normalized.minPrice)
        : undefined,
    maxPriceCents:
      normalized.maxPrice !== undefined
        ? toCents(normalized.maxPrice)
        : undefined,
    sort: (normalized.sort ?? "default") satisfies VillaListingSort,
    page: normalized.page ?? 1,
    pageSize: Math.min(MAX_PAGE_SIZE, options.pageSize ?? DEFAULT_PAGE_SIZE),
  };
}

/** The stay a guest picked in the filter bar, when they picked a complete one. */
export function getFilterStay(
  filters: VillaFilters,
): { checkIn: DateString; checkOut: DateString } | null {
  const normalized = normalizeVillaFilters(filters);

  if (normalized.checkIn === undefined || normalized.checkOut === undefined) {
    return null;
  }

  return {
    checkIn: normalized.checkIn as DateString,
    checkOut: normalized.checkOut as DateString,
  };
}

/** True when any filter is set, for rendering a "clear all" affordance. */
export function hasActiveFilters(filters: VillaFilters): boolean {
  return buildVillaFilterQuery(filters).toString().length > 0;
}
