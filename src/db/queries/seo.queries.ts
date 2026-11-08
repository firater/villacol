/**
 * Read models for sitemap.xml and other SEO surfaces (cached).
 */
import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import {
  categories,
  categoryTranslations,
  locationTranslations,
  locations,
  villas,
  villaTranslations,
} from "@/db/schema";
import type { Locale } from "@/lib/locales";

export type SitemapEntryRow = {
  locale: Locale;
  slug: string;
  updatedAt: Date;
};

export async function listSitemapVillas(): Promise<SitemapEntryRow[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("villas", "sitemap");

  return db
    .select({
      locale: villaTranslations.locale,
      slug: villaTranslations.slug,
      updatedAt: villas.updatedAt,
    })
    .from(villas)
    .innerJoin(villaTranslations, eq(villaTranslations.villaId, villas.id))
    .where(eq(villas.isActive, true));
}

export async function listSitemapLocations(): Promise<SitemapEntryRow[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("locations", "sitemap");

  return db
    .select({
      locale: locationTranslations.locale,
      slug: locationTranslations.slug,
      updatedAt: locations.updatedAt,
    })
    .from(locations)
    .innerJoin(
      locationTranslations,
      eq(locationTranslations.locationId, locations.id),
    );
}

export async function listSitemapCategories(): Promise<SitemapEntryRow[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories", "sitemap");

  return db
    .select({
      locale: categoryTranslations.locale,
      slug: categoryTranslations.slug,
      updatedAt: categories.updatedAt,
    })
    .from(categories)
    .innerJoin(
      categoryTranslations,
      eq(categoryTranslations.categoryId, categories.id),
    );
}
