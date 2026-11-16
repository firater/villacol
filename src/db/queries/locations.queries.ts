/**
 * Public location landing reads (cached).
 */
import { and, asc, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import {
  locationTranslations,
  locations,
  villaImages,
  villas,
} from "@/db/schema";
import type { Locale } from "@/lib/locales";

export type LocationDetailRow = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  latitude: number | null;
  longitude: number | null;
  heroImageUrl: string | null;
};

export type LocationNavLink = {
  slug: string;
  name: string;
};

export async function getLocationBySlug(
  slug: string,
  locale: Locale,
): Promise<LocationDetailRow | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("villas", `location-${slug}`);

  const [row] = await db
    .select({
      id: locations.id,
      slug: locationTranslations.slug,
      name: locationTranslations.name,
      description: locationTranslations.description,
      metaTitle: locationTranslations.metaTitle,
      metaDescription: locationTranslations.metaDescription,
      latitude: locations.latitude,
      longitude: locations.longitude,
    })
    .from(locations)
    .innerJoin(
      locationTranslations,
      and(
        eq(locationTranslations.locationId, locations.id),
        eq(locationTranslations.locale, locale),
        eq(locationTranslations.slug, slug),
      ),
    )
    .limit(1);

  if (row === undefined) return null;

  const [hero] = await db
    .select({ url: villaImages.url })
    .from(villas)
    .innerJoin(
      villaImages,
      and(eq(villaImages.villaId, villas.id), eq(villaImages.isMain, true)),
    )
    .where(and(eq(villas.locationId, row.id), eq(villas.isActive, true)))
    .orderBy(desc(villas.isFeatured), asc(villas.orderValue), asc(villas.id))
    .limit(1);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    latitude: row.latitude,
    longitude: row.longitude,
    heroImageUrl: hero?.url ?? null,
  };
}

/** Localized slugs for `alternates.languages` metadata. */
export async function getLocationSlugAlternates(
  locationId: number,
): Promise<Partial<Record<Locale, string>>> {
  "use cache";
  cacheLife("hours");
  cacheTag("villas", `location-id-${locationId}`);

  const rows = await db
    .select({
      locale: locationTranslations.locale,
      slug: locationTranslations.slug,
    })
    .from(locationTranslations)
    .where(eq(locationTranslations.locationId, locationId));

  return Object.fromEntries(
    rows.map((row) => [row.locale as Locale, row.slug]),
  ) as Partial<Record<Locale, string>>;
}

export async function listLocationNavLinks(
  locale: Locale,
): Promise<LocationNavLink[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("villas");

  return db
    .select({
      slug: locationTranslations.slug,
      name: locationTranslations.name,
    })
    .from(locations)
    .innerJoin(
      locationTranslations,
      and(
        eq(locationTranslations.locationId, locations.id),
        eq(locationTranslations.locale, locale),
      ),
    )
    .where(eq(locations.isFeatured, true))
    .orderBy(asc(locations.orderValue), asc(locations.id));
}