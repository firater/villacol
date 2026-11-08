import { describe, expect, it } from "vitest";

import {
  normalizeQuery,
  parseSearchIntent,
  type SearchSynonym,
} from "./intent";

const SYNONYMS: SearchSynonym[] = [
  { term: "kalkan", canonicalTerm: "kalkan", kind: "location" },
  { term: "islamlar", canonicalTerm: "islamlar", kind: "location" },
  { term: "old town kalkan", canonicalTerm: "kalkan-old-town", kind: "location" },
  { term: "honeymoon", canonicalTerm: "honeymoon", kind: "category" },
  { term: "pool", canonicalTerm: "private_pool", kind: "amenity" },
  { term: "jacuzzi", canonicalTerm: "jacuzzi", kind: "amenity" },
  { term: "luxury", canonicalTerm: "luxury", kind: "misc" },
];

describe("normalizeQuery", () => {
  it("lowercases, strips punctuation, and collapses whitespace", () => {
    expect(normalizeQuery("  Kalkan,   6   GUESTS!  ")).toBe("kalkan 6 guests");
  });

  it("strips diacritics so 'Kaş' matches 'kas'", () => {
    expect(normalizeQuery("Kaş")).toBe("kas");
  });

  it("keeps hyphens, which slugs rely on", () => {
    expect(normalizeQuery("sea-view")).toBe("sea-view");
  });
});

describe("parseSearchIntent counts", () => {
  it("reads a digit before the unit", () => {
    const result = parseSearchIntent("6 guests", "en");
    expect(result.filters.guests).toBe(6);
    expect(result.residualQuery).toBe("");
  });

  it("reads a digit after the unit", () => {
    expect(parseSearchIntent("sleeps 8", "en").filters.guests).toBe(8);
  });

  it("reads number words", () => {
    expect(parseSearchIntent("four people", "en").filters.guests).toBe(4);
  });

  it("separates bedrooms from guests", () => {
    const result = parseSearchIntent("3 bedrooms for 6 people", "en");
    expect(result.filters.bedrooms).toBe(3);
    expect(result.filters.guests).toBe(6);
    expect(result.residualQuery).toBe("");
  });

  it("reads bathrooms", () => {
    expect(parseSearchIntent("2 bathrooms", "en").filters.bathrooms).toBe(2);
  });

  it("keeps the first count when a unit repeats", () => {
    expect(parseSearchIntent("4 guests 8 guests", "en").filters.guests).toBe(4);
  });

  it("ignores a zero guest count", () => {
    const result = parseSearchIntent("0 guests", "en");
    expect(result.filters.guests).toBeUndefined();
  });

  it("parses German units", () => {
    const result = parseSearchIntent("3 Schlafzimmer für 6 Personen", "de");
    expect(result.filters.bedrooms).toBe(3);
    expect(result.filters.guests).toBe(6);
  });

  it("parses Russian units", () => {
    const result = parseSearchIntent("6 гостей 3 спальни", "ru");
    expect(result.filters.guests).toBe(6);
    expect(result.filters.bedrooms).toBe(3);
  });
});

describe("parseSearchIntent synonyms", () => {
  it("pulls a location out of free text", () => {
    const result = parseSearchIntent("villa in Kalkan", "en", SYNONYMS);
    expect(result.filters.location).toBe("kalkan");
    expect(result.residualQuery).toBe("");
  });

  it("prefers the longest matching term", () => {
    const result = parseSearchIntent("old town kalkan", "en", SYNONYMS);
    expect(result.filters.location).toBe("kalkan-old-town");
  });

  it("collects multiple amenities", () => {
    const result = parseSearchIntent("pool and jacuzzi", "en", SYNONYMS);
    expect(result.filters.amenities).toEqual(["private_pool", "jacuzzi"]);
  });

  it("maps a category synonym", () => {
    expect(parseSearchIntent("honeymoon villa", "en", SYNONYMS).filters.category).toBe(
      "honeymoon",
    );
  });

  it("consumes misc synonyms without emitting a filter", () => {
    const result = parseSearchIntent("luxury", "en", SYNONYMS);
    expect(result.filters).toEqual({});
    expect(result.residualQuery).toBe("");
  });

  it("combines counts and synonyms and leaves nothing behind", () => {
    const result = parseSearchIntent(
      "6 people in Kalkan with a pool",
      "en",
      SYNONYMS,
    );
    expect(result.filters).toEqual({
      guests: 6,
      location: "kalkan",
      amenities: ["private_pool"],
    });
    expect(result.residualQuery).toBe("");
  });

  it("leaves unmatched words as the residual full-text query", () => {
    const result = parseSearchIntent("seafront duplex in Kalkan", "en", SYNONYMS);
    expect(result.filters.location).toBe("kalkan");
    expect(result.residualQuery).toBe("seafront duplex");
  });

  it("keeps the first location when two are named", () => {
    const result = parseSearchIntent("Kalkan Islamlar", "en", SYNONYMS);
    expect(result.filters.location).toBe("kalkan");
    expect(result.residualQuery).toBe("");
  });

  it("does not let a count be eaten by a synonym pass", () => {
    const result = parseSearchIntent("3 bedroom pool villa", "en", SYNONYMS);
    expect(result.filters.bedrooms).toBe(3);
    expect(result.filters.amenities).toEqual(["private_pool"]);
  });
});

describe("parseSearchIntent edge cases", () => {
  it("returns empty for an empty query", () => {
    expect(parseSearchIntent("", "en", SYNONYMS)).toEqual({
      filters: {},
      residualQuery: "",
    });
  });

  it("returns empty for punctuation only", () => {
    expect(parseSearchIntent("!!! ???", "en", SYNONYMS).residualQuery).toBe("");
  });

  it("works with no synonym table at all", () => {
    const result = parseSearchIntent("kalkan 4 guests", "en");
    expect(result.filters.guests).toBe(4);
    expect(result.filters.location).toBeUndefined();
    expect(result.residualQuery).toBe("kalkan");
  });

  it("ignores a synonym whose term is only punctuation", () => {
    const result = parseSearchIntent("kalkan", "en", [
      { term: "  ", canonicalTerm: "noise", kind: "location" },
      ...SYNONYMS,
    ]);
    expect(result.filters.location).toBe("kalkan");
  });

  it("is case and diacritic insensitive on both sides", () => {
    const result = parseSearchIntent("KALKAN", "en", [
      { term: "Kalkan", canonicalTerm: "kalkan", kind: "location" },
    ]);
    expect(result.filters.location).toBe("kalkan");
  });
});
