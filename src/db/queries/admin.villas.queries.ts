/**
 * Admin-only reads (no `use cache` — editors need fresh data after saves).
 */
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  locationTranslations,
  locations,
  villaImages,
  villas,
  villaTranslations,
} from "@/db/schema";
import type { GuestPolicy } from "@/db/tables/enums";
import {
  DEFAULT_LOCALE,
  type Locale,
  type LocalizedText,
} from "@/lib/locales";

const ADMIN_LABEL_LOCALE = DEFAULT_LOCALE;

export type AdminVillaListRow = {
  id: number;
  refCode: string;
  brandSlug: string;
  titleEn: string;
  slugEn: string;
  locationName: string | null;
  isActive: boolean;
  orderValue: number;
  thumbUrl: string | null;
};

/**
 * All villas for the admin table, ordered by `order_value` then id.
 */
export async function listAdminVillas(): Promise<AdminVillaListRow[]> {
  return db
    .select({
      id: villas.id,
      refCode: villas.refCode,
      brandSlug: villas.slug,
      titleEn: villaTranslations.title,
      slugEn: villaTranslations.slug,
      locationName: locationTranslations.name,
      isActive: villas.isActive,
      orderValue: villas.orderValue,
      thumbUrl: villaImages.url,
    })
    .from(villas)
    .innerJoin(
      villaTranslations,
      and(
        eq(villaTranslations.villaId, villas.id),
        eq(villaTranslations.locale, ADMIN_LABEL_LOCALE),
      ),
    )
    .leftJoin(locations, eq(locations.id, villas.locationId))
    .leftJoin(
      locationTranslations,
      and(
        eq(locationTranslations.locationId, locations.id),
        eq(locationTranslations.locale, ADMIN_LABEL_LOCALE),
      ),
    )
    .leftJoin(
      villaImages,
      and(eq(villaImages.villaId, villas.id), eq(villaImages.isMain, true)),
    )
    .orderBy(asc(villas.orderValue), asc(villas.id));
}

export type AdminVillaTranslationRow = {
  locale: Locale;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
};

export type AdminVillaImageRow = {
  id: string;
  url: string;
  orderValue: number;
  isMain: boolean;
};

export type AdminVillaEditRow = {
  id: number;
  refCode: string;
  brandSlug: string;
  locationId: number | null;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  defaultMinStay: number;
  defaultNightlyPriceCents: number | null;
  cleaningFeeCents: number;
  depositCents: number;
  checkInTime: string;
  checkOutTime: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  isFeatured: boolean;
  isEditorsChoice: boolean;
  isBestValue: boolean;
  orderValue: number;
  cancellationPolicyI18n: LocalizedText | null;
  guestPolicy: GuestPolicy;
  editorRating: number | null;
  translations: AdminVillaTranslationRow[];
  images: AdminVillaImageRow[];
};

/**
 * Full villa row + all locale translations for the admin form.
 */
export async function getAdminVillaForEdit(
  villaId: number,
): Promise<AdminVillaEditRow | null> {
  const [villa] = await db
    .select({
      id: villas.id,
      refCode: villas.refCode,
      brandSlug: villas.slug,
      locationId: villas.locationId,
      capacity: villas.capacity,
      bedrooms: villas.bedrooms,
      bathrooms: villas.bathrooms,
      defaultMinStay: villas.defaultMinStay,
      defaultNightlyPriceCents: villas.defaultNightlyPriceCents,
      cleaningFeeCents: villas.cleaningFeeCents,
      depositCents: villas.depositCents,
      checkInTime: villas.checkInTime,
      checkOutTime: villas.checkOutTime,
      latitude: villas.latitude,
      longitude: villas.longitude,
      isActive: villas.isActive,
      isFeatured: villas.isFeatured,
      isEditorsChoice: villas.isEditorsChoice,
      isBestValue: villas.isBestValue,
      orderValue: villas.orderValue,
      cancellationPolicyI18n: villas.cancellationPolicyI18n,
      guestPolicy: villas.guestPolicy,
      editorRating: villas.editorRating,
    })
    .from(villas)
    .where(eq(villas.id, villaId))
    .limit(1);

  if (villa === undefined) return null;

  const transRows = await db
    .select({
      locale: villaTranslations.locale,
      slug: villaTranslations.slug,
      title: villaTranslations.title,
      summary: villaTranslations.summary,
      description: villaTranslations.description,
    })
    .from(villaTranslations)
    .where(eq(villaTranslations.villaId, villaId))
    .orderBy(asc(villaTranslations.locale));

  const imageRows = await db
    .select({
      id: villaImages.id,
      url: villaImages.url,
      orderValue: villaImages.orderValue,
      isMain: villaImages.isMain,
    })
    .from(villaImages)
    .where(eq(villaImages.villaId, villaId))
    .orderBy(asc(villaImages.orderValue), asc(villaImages.id));

  return {
    ...villa,
    translations: transRows as AdminVillaTranslationRow[],
    images: imageRows,
  };
}

export type AdminLocationOption = {
  id: number;
  name: string;
};

export async function listAdminLocationOptions(): Promise<AdminLocationOption[]> {
  return db
    .select({
      id: locations.id,
      name: locationTranslations.name,
    })
    .from(locations)
    .innerJoin(
      locationTranslations,
      and(
        eq(locationTranslations.locationId, locations.id),
        eq(locationTranslations.locale, ADMIN_LABEL_LOCALE),
      ),
    )
    .orderBy(asc(locationTranslations.name));
}
