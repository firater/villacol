import { describe, expect, it } from "vitest";

import {
  buildVillaFilterQuery,
  buildVillaFilterQueryString,
  FILTER_KEYS,
  getFilterStay,
  hasActiveFilters,
  normalizeVillaFilters,
  parseVillaFilters,
  toListingFilters,
} from "./search-params";

const parse = (query: string) =>
  parseVillaFilters(new URLSearchParams(query));

describe("FILTER_KEYS", () => {
  it("is the universal English contract from the plan", () => {
    expect([...FILTER_KEYS]).toEqual([
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
    ]);
  });

  it("is frozen", () => {
    expect(Object.isFrozen(FILTER_KEYS)).toBe(true);
  });
});

describe("parseVillaFilters", () => {
  it("returns an empty object for no params", () => {
    expect(parse("")).toEqual({});
  });

  it("parses numeric filters", () => {
    expect(parse("bedrooms=3&bathrooms=2&guests=6")).toMatchObject({
      bedrooms: 3,
      bathrooms: 2,
      guests: 6,
    });
  });

  it("maps snake_case keys onto camelCase fields", () => {
    expect(parse("min_price=500&max_price=2000")).toMatchObject({
      minPrice: 500,
      maxPrice: 2000,
    });
  });

  it("drops a non-numeric value instead of throwing", () => {
    expect(parse("guests=banana").guests).toBeUndefined();
  });

  it("drops a zero or negative count", () => {
    expect(parse("guests=0&bedrooms=-2")).toEqual({});
  });

  it("accepts a comma-separated key list", () => {
    expect(parse("amenities=private_pool,wifi").amenities).toEqual([
      "private_pool",
      "wifi",
    ]);
  });

  it("accepts a repeated key list", () => {
    expect(parse("features=sea_view&features=jacuzzi").features).toEqual([
      "sea_view",
      "jacuzzi",
    ]);
  });

  it("dedupes a key list", () => {
    expect(parse("amenities=wifi,wifi").amenities).toEqual(["wifi"]);
  });

  it("rejects a key list containing non-key characters", () => {
    // Keys are universal English column values, never localized free text.
    expect(parse("amenities=Privater Pool").amenities).toBeUndefined();
  });

  it("reads offers_only in its three truthy forms", () => {
    expect(parse("offers_only=true").offersOnly).toBe(true);
    expect(parse("offers_only=1").offersOnly).toBe(true);
    expect(parse("offers_only").offersOnly).toBe(true);
  });

  it("treats an explicit false offers_only as unset", () => {
    expect(parse("offers_only=false").offersOnly).toBeUndefined();
  });

  it("parses a valid sort and drops an unknown one", () => {
    expect(parse("sort=price_asc").sort).toBe("price_asc");
    expect(parse("sort=cheapest").sort).toBeUndefined();
  });

  it("does not accept relevance from the URL", () => {
    // Relevance needs a text query, so it is not part of the URL contract.
    expect(parse("sort=relevance").sort).toBeUndefined();
  });

  it("parses a date pair", () => {
    expect(parse("check_in=2026-07-01&check_out=2026-07-08")).toMatchObject({
      checkIn: "2026-07-01",
      checkOut: "2026-07-08",
    });
  });

  it("drops a calendar-invalid date", () => {
    expect(parse("check_in=2026-02-30&check_out=2026-03-05").checkIn).toBeUndefined();
  });

  it("accepts Next's resolved searchParams object", () => {
    expect(
      parseVillaFilters({ guests: "4", amenities: ["wifi", "private_pool"] }),
    ).toMatchObject({ guests: 4, amenities: ["wifi", "private_pool"] });
  });
});

describe("normalizeVillaFilters", () => {
  it("swaps a reversed price band", () => {
    expect(parse("min_price=2000&max_price=500")).toMatchObject({
      minPrice: 500,
      maxPrice: 2000,
    });
  });

  it("drops a half-specified stay", () => {
    expect(parse("check_in=2026-07-01").checkIn).toBeUndefined();
    expect(parse("check_out=2026-07-08").checkOut).toBeUndefined();
  });

  it("drops a stay whose check-out is not after check-in", () => {
    expect(
      parse("check_in=2026-07-08&check_out=2026-07-01").checkIn,
    ).toBeUndefined();
    expect(
      parse("check_in=2026-07-01&check_out=2026-07-01").checkIn,
    ).toBeUndefined();
  });

  it("treats default sort and first page as unset", () => {
    expect(normalizeVillaFilters({ sort: "default", page: 1 })).toEqual({
      sort: undefined,
      page: undefined,
    });
  });

  it("is idempotent", () => {
    const once = normalizeVillaFilters({ minPrice: 2000, maxPrice: 500 });
    expect(normalizeVillaFilters(once)).toEqual(once);
  });
});

describe("buildVillaFilterQuery", () => {
  it("round-trips through parse unchanged", () => {
    const filters = parse(
      "bedrooms=3&guests=6&min_price=500&max_price=2000&location=kalkan&amenities=private_pool,wifi&sort=price_asc&page=2",
    );
    expect(parseVillaFilters(buildVillaFilterQuery(filters))).toEqual(filters);
  });

  it("omits defaults so a cleared filter leaves no residue", () => {
    expect(
      buildVillaFilterQuery({ sort: "default", page: 1, offersOnly: false }).toString(),
    ).toBe("");
  });

  it("emits keys in FILTER_KEYS order, so the same state is the same URL", () => {
    const query = buildVillaFilterQuery({
      page: 2,
      guests: 6,
      bedrooms: 3,
    }).toString();
    expect(query).toBe("bedrooms=3&guests=6&page=2");
  });

  it("sorts list values, so key order cannot change the URL", () => {
    const a = buildVillaFilterQuery({ amenities: ["wifi", "private_pool"] });
    const b = buildVillaFilterQuery({ amenities: ["private_pool", "wifi"] });
    expect(a.toString()).toBe(b.toString());
    expect(a.get("amenities")).toBe("private_pool,wifi");
  });

  it("prefixes with ? only when something is set", () => {
    expect(buildVillaFilterQueryString({})).toBe("");
    expect(buildVillaFilterQueryString({ guests: 4 })).toBe("?guests=4");
  });
});

describe("toListingFilters", () => {
  it("converts euro prices into the cents the query layer uses", () => {
    const listing = toListingFilters(parse("min_price=500&max_price=2000"), "en");
    expect(listing.minPriceCents).toBe(50_000);
    expect(listing.maxPriceCents).toBe(200_000);
  });

  it("passes through universal English keys as amenity and feature keys", () => {
    const listing = toListingFilters(
      parse("amenities=private_pool&features=sea_view"),
      "de",
    );
    expect(listing.amenityKeys).toEqual(["private_pool"]);
    expect(listing.featureKeys).toEqual(["sea_view"]);
    expect(listing.locale).toBe("de");
  });

  it("defaults to order_value sorting and page 1", () => {
    const listing = toListingFilters({}, "en");
    expect(listing.sort).toBe("default");
    expect(listing.page).toBe(1);
    expect(listing.pageSize).toBe(24);
  });

  it("locks offers_only for the offers route while keeping other filters", () => {
    const listing = toListingFilters(parse("bedrooms=4"), "en", {
      lockOffersOnly: true,
    });
    expect(listing.offersOnly).toBe(true);
    expect(listing.bedrooms).toBe(4);
  });

  it("cannot be talked out of the locked offers filter", () => {
    const listing = toListingFilters(parse("offers_only=false"), "en", {
      lockOffersOnly: true,
    });
    expect(listing.offersOnly).toBe(true);
  });

  it("caps the page size", () => {
    expect(toListingFilters({}, "en", { pageSize: 500 }).pageSize).toBe(48);
  });
});

describe("getFilterStay", () => {
  it("returns a complete stay", () => {
    expect(getFilterStay(parse("check_in=2026-07-01&check_out=2026-07-08"))).toEqual({
      checkIn: "2026-07-01",
      checkOut: "2026-07-08",
    });
  });

  it("returns null without both ends", () => {
    expect(getFilterStay(parse("check_in=2026-07-01"))).toBeNull();
    expect(getFilterStay({})).toBeNull();
  });
});

describe("hasActiveFilters", () => {
  it("is false for an empty and for a defaults-only state", () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ sort: "default", page: 1 })).toBe(false);
  });

  it("is true once any filter is set", () => {
    expect(hasActiveFilters({ guests: 2 })).toBe(true);
  });
});
