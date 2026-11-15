/** Admin category reads (uncached). */
import { and, asc, count, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  categories,
  categoryTranslations,
  villaCategories,
} from "@/db/schema";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locales";

const LABEL_LOCALE = DEFAULT_LOCALE;

export type AdminCategoryListRow = {
  id: number;
  nameEn: string;
  slugEn: string;
  orderValue: number;
  villaCount: number;
};

export async function listAdminCategories(): Promise<AdminCategoryListRow[]> {
  const rows = await db
    .select({
      id: categories.id,
      nameEn: categoryTranslations.name,
      slugEn: categoryTranslations.slug,
      orderValue: categories.orderValue,
      villaCount: count(villaCategories.villaId),
    })
    .from(categories)
    .innerJoin(
      categoryTranslations,
      and(
        eq(categoryTranslations.categoryId, categories.id),
        eq(categoryTranslations.locale, LABEL_LOCALE),
      ),
    )
    .leftJoin(villaCategories, eq(villaCategories.categoryId, categories.id))
    .groupBy(
      categories.id,
      categoryTranslations.name,
      categoryTranslations.slug,
      categories.orderValue,
    )
    .orderBy(asc(categories.orderValue), asc(categories.id));

  return rows.map((row) => ({
    id: row.id,
    nameEn: row.nameEn,
    slugEn: row.slugEn,
    orderValue: row.orderValue,
    villaCount: Number(row.villaCount),
  }));
}

export type CategoryTranslationRow = {
  locale: Locale;
  slug: string;
  name: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

export type AdminCategoryEditRow = {
  id: number;
  isFeatured: boolean;
  orderValue: number;
  translations: CategoryTranslationRow[];
};

export async function getAdminCategoryForEdit(
  categoryId: number,
): Promise<AdminCategoryEditRow | null> {
  const [category] = await db
    .select({
      id: categories.id,
      isFeatured: categories.isFeatured,
      orderValue: categories.orderValue,
    })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  if (category === undefined) return null;

  const translations = await db
    .select({
      locale: categoryTranslations.locale,
      slug: categoryTranslations.slug,
      name: categoryTranslations.name,
      description: categoryTranslations.description,
      metaTitle: categoryTranslations.metaTitle,
      metaDescription: categoryTranslations.metaDescription,
    })
    .from(categoryTranslations)
    .where(eq(categoryTranslations.categoryId, categoryId))
    .orderBy(asc(categoryTranslations.locale));

  return {
    id: category.id,
    isFeatured: category.isFeatured,
    orderValue: category.orderValue,
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