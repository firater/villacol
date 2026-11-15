/** Admin location reads (uncached). */
import { and, asc, count, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  locationTranslations,
  locations,
  villas,
} from "@/db/schema";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locales";

const LABEL_LOCALE = DEFAULT_LOCALE;

export type AdminLocationListRow = {
  id: number;
  nameEn: string;
  slugEn: string;
  orderValue: number;
  villaCount: number;
};

export async function listAdminLocations(): Promise<AdminLocationListRow[]> {
  const rows = await db
    .select({
      id: locations.id,
      nameEn: locationTranslations.name,
      slugEn: locationTranslations.slug,
      orderValue: locations.orderValue,
      villaCount: count(villas.id),
    })
    .from(locations)
    .innerJoin(
      locationTranslations,
      and(
        eq(locationTranslations.locationId, locations.id),
        eq(locationTranslations.locale, LABEL_LOCALE),
      ),
    )
    .leftJoin(villas, eq(villas.locationId, locations.id))
    .groupBy(
      locations.id,
      locationTranslations.name,
      locationTranslations.slug,
      locations.orderValue,
    )
    .orderBy(asc(locations.orderValue), asc(locations.id));

  return rows.map((row) => ({
    id: row.id,
    nameEn: row.nameEn,
    slugEn: row.slugEn,
    orderValue: row.orderValue,
    villaCount: Number(row.villaCount),
  }));
}

export type LocationTranslationRow = {
  locale: Locale;
  slug: string;
  name: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

export type AdminLocationEditRow = {
  id: number;
  isFeatured: boolean;
  orderValue: number;
  translations: LocationTranslationRow[];
};

export async function getAdminLocationForEdit(
  locationId: number,
): Promise<AdminLocationEditRow | null> {
  const [location] = await db
    .select({
      id: locations.id,
      isFeatured: locations.isFeatured,
      orderValue: locations.orderValue,
    })
    .from(locations)
    .where(eq(locations.id, locationId))
    .limit(1);

  if (location === undefined) return null;

  const translations = await db
    .select({
      locale: locationTranslations.locale,
      slug: locationTranslations.slug,
      name: locationTranslations.name,
      description: locationTranslations.description,
      metaTitle: locationTranslations.metaTitle,
      metaDescription: locationTranslations.metaDescription,
    })
    .from(locationTranslations)
    .where(eq(locationTranslations.locationId, locationId))
    .orderBy(asc(locationTranslations.locale));

  return {
    id: location.id,
    isFeatured: location.isFeatured,
    orderValue: location.orderValue,
    translations: translations.map((row) => ({
      locale: row.locale as Locale,
      slug: row.slug,
      name: row.name,
      description: row.description,
      metaTitle: row.metaTitle,
      metaDescription: row.metaDescription,
    })),
  };
}