/**
 * Daily category rotation and the exclusive 20% commission waiver promotion.
 */
import { and, asc, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { db } from "@/db";
import { dbPool } from "@/db/pool";
import {
  categories,
  categoryTranslations,
  promotions,
  villaCategories,
  villaPromotions,
  villas,
} from "@/db/schema";
import { getBusinessToday, type DateString } from "@/lib/dates";
import {
  dayOfYearFromDateString,
  pickCategoryOfTheDayIndex,
} from "@/lib/category-of-the-day-rotation";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locales";

import type { CronJobResult } from "@/lib/cron/types";

export const CATEGORY_OF_THE_DAY_PROMOTION_NAME =
  "Category of the Day · always · 20%";

/** Legacy seed name; migration script renames the live row. */
export const LEGACY_COTD_PROMOTION_NAME = "Commission waiver · coupon · DIRECT20";

export type CategoryOfTheDayCore = {
  id: number;
  orderValue: number;
};

export type CategoryOfTheDayLocalized = CategoryOfTheDayCore & {
  slug: string;
  label: string;
};

export { dayOfYearFromDateString, pickCategoryOfTheDayIndex } from "@/lib/category-of-the-day-rotation";

export async function listCategoriesForRotation(): Promise<CategoryOfTheDayCore[]> {
  return db
    .select({
      id: categories.id,
      orderValue: categories.orderValue,
    })
    .from(categories)
    .orderBy(asc(categories.orderValue), asc(categories.id));
}

export async function getCategoryOfTheDay(
  date: DateString = getBusinessToday(),
): Promise<CategoryOfTheDayCore> {
  const rows = await listCategoriesForRotation();
  const index = pickCategoryOfTheDayIndex(rows.length, date);
  const picked = rows[index];
  if (picked === undefined) {
    throw new Error("Cannot resolve category of the day");
  }
  return picked;
}

export async function getCategoryOfTheDayLocalized(
  locale: Locale,
  date: DateString = getBusinessToday(),
): Promise<CategoryOfTheDayLocalized> {
  const core = await getCategoryOfTheDay(date);
  const [translation] = await db
    .select({
      slug: categoryTranslations.slug,
      name: categoryTranslations.name,
    })
    .from(categoryTranslations)
    .where(
      and(
        eq(categoryTranslations.categoryId, core.id),
        eq(categoryTranslations.locale, locale),
      ),
    )
    .limit(1);

  if (translation === undefined) {
    const [fallback] = await db
      .select({
        slug: categoryTranslations.slug,
        name: categoryTranslations.name,
      })
      .from(categoryTranslations)
      .where(
        and(
          eq(categoryTranslations.categoryId, core.id),
          eq(categoryTranslations.locale, DEFAULT_LOCALE),
        ),
      )
      .limit(1);
    if (fallback === undefined) {
      throw new Error(`Category ${core.id} has no translations`);
    }
    return { ...core, slug: fallback.slug, label: fallback.name };
  }

  return { ...core, slug: translation.slug, label: translation.name };
}

let cachedPromotionId: number | null = null;

export async function resolveCotdListingContext(
  date: DateString = getBusinessToday(),
): Promise<{ categoryId: number; promotionId: number } | null> {
  try {
    const [category, promotionId] = await Promise.all([
      getCategoryOfTheDay(date),
      getCategoryOfTheDayPromotionId(),
    ]);
    return { categoryId: category.id, promotionId };
  } catch {
    return null;
  }
}

export async function getCategoryOfTheDayPromotionId(): Promise<number> {
  if (cachedPromotionId !== null) return cachedPromotionId;

  const [row] = await db
    .select({ id: promotions.id })
    .from(promotions)
    .where(eq(promotions.name, CATEGORY_OF_THE_DAY_PROMOTION_NAME))
    .limit(1);

  if (row === undefined) {
    throw new Error(
      `Promotion "${CATEGORY_OF_THE_DAY_PROMOTION_NAME}" is missing; run seed or migration`,
    );
  }

  cachedPromotionId = row.id;
  return row.id;
}

export type ApplyCategoryOfTheDayResult = {
  categoryId: number;
  categoryOrderValue: number;
  promotionId: number;
  linkedVillaCount: number;
  date: DateString;
};

/**
 * Rotates villa_promotions links for the COTD waiver, then callers rebuild cache.
 * Idempotent for a fixed calendar day.
 */
export async function applyCategoryOfTheDay(
  today: DateString = getBusinessToday(),
): Promise<CronJobResult> {
  const category = await getCategoryOfTheDay(today);
  const promotionId = await getCategoryOfTheDayPromotionId();

  await dbPool.delete(villaPromotions).where(eq(villaPromotions.promotionId, promotionId));

  const villaRows = await db
    .select({ villaId: villaCategories.villaId })
    .from(villaCategories)
    .innerJoin(
      villas,
      and(eq(villas.id, villaCategories.villaId), eq(villas.isActive, true)),
    )
    .where(eq(villaCategories.categoryId, category.id));

  if (villaRows.length > 0) {
    await db
      .insert(villaPromotions)
      .values(
        villaRows.map((row) => ({
          villaId: row.villaId,
          promotionId,
        })),
      )
      .onConflictDoNothing();
  }

  revalidateTag("category-of-the-day", "max");

  const summary: ApplyCategoryOfTheDayResult = {
    categoryId: category.id,
    categoryOrderValue: category.orderValue,
    promotionId,
    linkedVillaCount: villaRows.length,
    date: today,
  };

  return {
    processedCount: villaRows.length,
    failedCount: 0,
    payload: summary,
  };
}
