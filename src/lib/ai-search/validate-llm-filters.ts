import type { VillaFilterFacets } from "@/db/queries/filter-facets.queries";
import type { VillaFilters } from "@/lib/search-params";
import type { LlmFilterExtract } from "./llm-extract-schema";

const AMENITY_KEY = /^[a-z0-9_]+$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function pickSlug(
  value: string | null | undefined,
  allowed: ReadonlySet<string>,
): string | undefined {
  if (value === null || value === undefined) return undefined;
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0 || !SLUG.test(trimmed)) return undefined;
  return allowed.has(trimmed) ? trimmed : undefined;
}

function pickAmenities(
  values: string[] | null | undefined,
  allowed: ReadonlySet<string>,
): string[] | undefined {
  if (values === null || values === undefined || values.length === 0) {
    return undefined;
  }

  const picked = [
    ...new Set(
      values
        .map((value) => value.trim().toLowerCase())
        .filter((value) => AMENITY_KEY.test(value) && allowed.has(value)),
    ),
  ];

  return picked.length > 0 ? picked : undefined;
}

function pickGuestCount(value: number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 1 || value > 100) return undefined;
  return value;
}

function pickRoomCount(
  value: number | null | undefined,
): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 0 || value > 50) return undefined;
  return value;
}

/**
 * Drops hallucinated slugs/keys by intersecting with live taxonomy facets.
 */
export function validateLlmFilters(
  raw: LlmFilterExtract,
  facets: VillaFilterFacets,
): VillaFilters {
  const locationSlugs = new Set(facets.locations.map((row) => row.value));
  const categorySlugs = new Set(facets.categories.map((row) => row.value));
  const amenityKeys = new Set(facets.amenities.map((row) => row.value));

  return {
    location: pickSlug(raw.location, locationSlugs),
    category: pickSlug(raw.category, categorySlugs),
    amenities: pickAmenities(raw.amenities, amenityKeys),
    guests: pickGuestCount(raw.guests),
    bedrooms: pickRoomCount(raw.bedrooms),
    bathrooms: pickRoomCount(raw.bathrooms),
  };
}

export function hasStructuredFilters(filters: VillaFilters): boolean {
  return (
    filters.location !== undefined ||
    filters.category !== undefined ||
    (filters.amenities !== undefined && filters.amenities.length > 0) ||
    filters.guests !== undefined ||
    filters.bedrooms !== undefined ||
    filters.bathrooms !== undefined
  );
}