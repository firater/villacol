/**
 * Landing pages: location, category, and offers filters over the shared listing query.
 */
import { cacheLife, cacheTag } from "next/cache";

import type { Locale } from "@/lib/locales";

import {
  getVillaListing,
  type VillaListingFilters,
  type VillaListingSort,
} from "@/db/queries/villas.queries";

export type LandingVillasResult = Awaited<ReturnType<typeof getVillaListing>>;

export async function getLocationLandingVillas(
  locationSlug: string,
  locale: Locale,
  options: {
    page?: number;
    pageSize?: number;
    sort?: VillaListingSort;
  } = {},
): Promise<LandingVillasResult> {
  "use cache";
  cacheLife("hours");
  cacheTag("villas", `location-${locationSlug}`);

  const filters: VillaListingFilters = {
    locale,
    locationSlug,
    page: options.page,
    pageSize: options.pageSize,
    sort: options.sort,
  };

  return getVillaListing(filters);
}

export async function getCategoryLandingVillas(
  categorySlug: string,
  locale: Locale,
  options: {
    page?: number;
    pageSize?: number;
    sort?: VillaListingSort;
  } = {},
): Promise<LandingVillasResult> {
  "use cache";
  cacheLife("hours");
  cacheTag("villas", `category-${categorySlug}`);

  const filters: VillaListingFilters = {
    locale,
    categorySlug,
    page: options.page,
    pageSize: options.pageSize,
    sort: options.sort,
  };

  return getVillaListing(filters);
}

/**
 * Landing rails. Each one is a thin, separately tagged wrapper so a featured
 * flag flip invalidates only the rail it belongs to.
 */
export async function getFeaturedLandingVillas(
  locale: Locale,
  pageSize: number,
): Promise<LandingVillasResult> {
  "use cache";
  cacheLife("hours");
  cacheTag("villas", "home-featured");

  return getVillaListing({
    locale,
    featuredOnly: true,
    pageSize,
    page: 1,
    sort: "default",
  });
}

export async function getBestValueLandingVillas(
  locale: Locale,
  pageSize: number,
): Promise<LandingVillasResult> {
  "use cache";
  cacheLife("hours");
  cacheTag("villas", "home-best-value");

  return getVillaListing({
    locale,
    bestValueOnly: true,
    pageSize,
    page: 1,
    sort: "price_asc",
  });
}

export async function getOfferLandingVillas(
  locale: Locale,
  pageSize: number,
): Promise<LandingVillasResult> {
  "use cache";
  cacheLife("hours");
  cacheTag("villas", "home-offers");

  return getVillaListing({
    locale,
    offersOnly: true,
    pageSize,
    page: 1,
    sort: "default",
  });
}

/**
 * Same loader as `/villas`, with `offers_only` forced on (plan: locked filter on `/villa-offers`).
 */
export async function getOfferVillas(
  filters: Omit<VillaListingFilters, "offersOnly"> & {
    offersOnly?: boolean;
  },
): Promise<LandingVillasResult> {
  "use cache";
  cacheLife("hours");
  cacheTag("villas", "offers");

  return getVillaListing({ ...filters, offersOnly: true });
}
