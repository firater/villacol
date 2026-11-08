/**
 * Cached option lists for the public filter sidebar.
 */
import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import {
  amenities,
  categories,
  categoryTranslations,
  locations,
  locationTranslations,
} from "@/db/schema";
import { localize, type Locale } from "@/lib/locales";

export type FilterFacetOption = {
  value: string;
  label: string;
};

export type VillaFilterFacets = {
  locations: FilterFacetOption[];
  categories: FilterFacetOption[];
  amenities: FilterFacetOption[];
};

export async function getVillaFilterFacets(
  locale: Locale,
): Promise<VillaFilterFacets> {
  "use cache";
  cacheTag("taxonomy", `filter-facets-${locale}`);
  cacheLife("hours");

  const [locationRows, categoryRows, amenityRows] = await Promise.all([
    db
      .select({
        slug: locationTranslations.slug,
        name: locationTranslations.name,
      })
      .from(locations)
      .innerJoin(
        locationTranslations,
        eq(locationTranslations.locationId, locations.id),
      )
      .where(eq(locationTranslations.locale, locale))
      .orderBy(asc(locations.orderValue), asc(locations.id)),
    db
      .select({
        slug: categoryTranslations.slug,
        name: categoryTranslations.name,
      })
      .from(categories)
      .innerJoin(
        categoryTranslations,
        eq(categoryTranslations.categoryId, categories.id),
      )
      .where(eq(categoryTranslations.locale, locale))
      .orderBy(asc(categories.orderValue), asc(categories.id)),
    db
      .select({
        key: amenities.key,
        labelI18n: amenities.labelI18n,
      })
      .from(amenities)
      .where(eq(amenities.isFilterable, true))
      .orderBy(asc(amenities.orderValue), asc(amenities.id)),
  ]);

  return {
    locations: locationRows.map((row) => ({
      value: row.slug,
      label: row.name,
    })),
    categories: categoryRows.map((row) => ({
      value: row.slug,
      label: row.name,
    })),
    amenities: amenityRows.map((row) => ({
      value: row.key,
      label: localize(row.labelI18n, locale),
    })),
  };
}
