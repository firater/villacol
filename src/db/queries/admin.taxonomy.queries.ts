/**
 * Admin taxonomy catalog + villa link state (uncached).
 */
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  amenities,
  categories,
  categoryTranslations,
  features,
  villaAmenities,
  villaCategories,
  villaFeatures,
} from "@/db/schema";
import { DEFAULT_LOCALE } from "@/lib/locales";

const LABEL_LOCALE = DEFAULT_LOCALE;

export type AdminTaxonomyOption = {
  id: number;
  label: string;
};

export async function listAdminAmenityOptions(): Promise<AdminTaxonomyOption[]> {
  const rows = await db
    .select({
      id: amenities.id,
      labelI18n: amenities.labelI18n,
      key: amenities.key,
    })
    .from(amenities)
    .orderBy(asc(amenities.orderValue), asc(amenities.id));

  return rows.map((r) => ({
    id: r.id,
    label: r.labelI18n[LABEL_LOCALE] ?? r.labelI18n.en ?? r.key,
  }));
}

export async function listAdminFeatureOptions(): Promise<AdminTaxonomyOption[]> {
  const rows = await db
    .select({
      id: features.id,
      labelI18n: features.labelI18n,
      key: features.key,
    })
    .from(features)
    .orderBy(asc(features.orderValue), asc(features.id));

  return rows.map((r) => ({
    id: r.id,
    label: r.labelI18n[LABEL_LOCALE] ?? r.labelI18n.en ?? r.key,
  }));
}

export async function listAdminCategoryOptions(): Promise<AdminTaxonomyOption[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categoryTranslations.name,
    })
    .from(categories)
    .innerJoin(
      categoryTranslations,
      and(
        eq(categoryTranslations.categoryId, categories.id),
        eq(categoryTranslations.locale, LABEL_LOCALE),
      ),
    )
    .orderBy(asc(categories.orderValue), asc(categories.id));

  return rows.map((r) => ({ id: r.id, label: r.name }));
}

export async function getVillaAmenityLinks(
  villaId: number,
): Promise<{ id: number; isHighlighted: boolean }[]> {
  const rows = await db
    .select({
      amenityId: villaAmenities.amenityId,
      isHighlighted: villaAmenities.isHighlighted,
    })
    .from(villaAmenities)
    .where(eq(villaAmenities.villaId, villaId));

  return rows.map((r) => ({ id: r.amenityId, isHighlighted: r.isHighlighted }));
}

export async function getVillaFeatureLinks(
  villaId: number,
): Promise<{ id: number; isHighlighted: boolean }[]> {
  const rows = await db
    .select({
      featureId: villaFeatures.featureId,
      isHighlighted: villaFeatures.isHighlighted,
    })
    .from(villaFeatures)
    .where(eq(villaFeatures.villaId, villaId));

  return rows.map((r) => ({ id: r.featureId, isHighlighted: r.isHighlighted }));
}

export async function getVillaCategoryIds(villaId: number): Promise<number[]> {
  const rows = await db
    .select({ categoryId: villaCategories.categoryId })
    .from(villaCategories)
    .where(eq(villaCategories.villaId, villaId));

  return rows.map((r) => r.categoryId);
}
