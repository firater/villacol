import { describe, expect, it } from "vitest";

import type { VillaFilterFacets } from "@/db/queries/filter-facets.queries";

import {
  hasStructuredFilters,
  validateLlmFilters,
} from "./validate-llm-filters";

const facets: VillaFilterFacets = {
  locations: [{ value: "kalkan", label: "Kalkan" }],
  categories: [{ value: "honeymoon", label: "Honeymoon" }],
  amenities: [
    { value: "private_pool", label: "Private pool" },
    { value: "wifi", label: "Wi-Fi" },
  ],
};

describe("validateLlmFilters", () => {
  it("keeps only database-backed slugs", () => {
    const filters = validateLlmFilters(
      {
        location: "kalkan",
        category: "fake-category",
        amenities: ["private_pool", "helicopter_pad"],
        guests: 6,
      },
      facets,
    );

    expect(filters.location).toBe("kalkan");
    expect(filters.category).toBeUndefined();
    expect(filters.amenities).toEqual(["private_pool"]);
    expect(filters.guests).toBe(6);
  });

  it("detects when nothing usable remains", () => {
    expect(
      hasStructuredFilters(
        validateLlmFilters(
          { location: "antalya", amenities: ["helicopter_pad"] },
          facets,
        ),
      ),
    ).toBe(false);
  });
});