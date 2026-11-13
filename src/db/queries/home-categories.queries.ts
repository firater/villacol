/**
 * Homepage category carousel aggregates (read-only).
 */
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import {
  categories,
  categoryTranslations,
  villaCategories,
  villaImages,
  villaPriceCache,
  villas,
} from "@/db/schema";
import type { Locale } from "@/lib/locales";

const PLACEHOLDER_CATEGORY_IMAGE =
  "https://placehold.co/640x800/1c1917/e7e5e4/png?text=Category";

export type HomeCategoryCarouselRow = {
  slug: string;
  label: string;
  image: string;
  villaCount: number;
  startingFromEurCents: number | null;
  isGoodDeal: boolean;
};

export type HomeEditorsChoiceSummary = {
  image: string;
  villaCount: number;
  startingFromEurCents: number | null;
  isGoodDeal: boolean;
};

export type HomeCategoriesCarouselData = {
  categories: HomeCategoryCarouselRow[];
  editorsChoice: HomeEditorsChoiceSummary;
};

export async function getHomeCategoriesCarouselData(
  locale: Locale,
): Promise<HomeCategoriesCarouselData> {
  "use cache";
  cacheLife("hours");
  cacheTag("taxonomy", "villas", "villa-price-cache");

  const categoryMeta = await db
    .select({
      categoryId: categories.id,
      slug: categoryTranslations.slug,
      name: categoryTranslations.name,
    })
    .from(categories)
    .innerJoin(
      categoryTranslations,
      and(
        eq(categoryTranslations.categoryId, categories.id),
        eq(categoryTranslations.locale, locale),
      ),
    )
    .orderBy(asc(categories.orderValue), asc(categories.id));

  if (categoryMeta.length === 0) {
    return {
      categories: [],
      editorsChoice: {
        image: PLACEHOLDER_CATEGORY_IMAGE,
        villaCount: 0,
        startingFromEurCents: null,
        isGoodDeal: false,
      },
    };
  }

  const categoryIds = categoryMeta.map((row) => row.categoryId);

  const statsRows = await db
    .select({
      categoryId: villaCategories.categoryId,
      villaCount: sql<number>`count(distinct ${villas.id})::int`,
      minNightlyCents: sql<number | null>`min(${villaPriceCache.avgNightlyCents})`,
    })
    .from(villaCategories)
    .innerJoin(
      villas,
      and(eq(villas.id, villaCategories.villaId), eq(villas.isActive, true)),
    )
    .innerJoin(
      villaPriceCache,
      and(
        eq(villaPriceCache.villaId, villas.id),
        eq(villaPriceCache.windowKind, "min_stay"),
      ),
    )
    .where(inArray(villaCategories.categoryId, categoryIds))
    .groupBy(villaCategories.categoryId);

  const statsByCategoryId = new Map(
    statsRows.map((row) => [row.categoryId, row]),
  );

  const imageRows = await db.execute<{ category_id: number; url: string | null }>(sql`
    SELECT DISTINCT ON (vc.category_id)
      vc.category_id AS category_id,
      vi.url AS url
    FROM villa_categories vc
    INNER JOIN villas v ON v.id = vc.villa_id AND v.is_active = true
    INNER JOIN villa_price_cache vpc ON vpc.villa_id = v.id AND vpc.window_kind = 'min_stay'
    LEFT JOIN villa_images vi ON vi.villa_id = v.id AND vi.is_main = true
  WHERE vc.category_id IN (${sql.join(
    categoryIds.map((id) => sql`${id}`),
    sql`, `,
  )})
    ORDER BY vc.category_id, vpc.discounted_total_cents ASC NULLS LAST, v.id ASC
  `);

  const dealRows = await db.execute<{ category_id: number; has_discount: boolean }>(sql`
    SELECT DISTINCT ON (vc.category_id)
      vc.category_id AS category_id,
      vpc.has_active_discount AS has_discount
    FROM villa_categories vc
    INNER JOIN villas v ON v.id = vc.villa_id AND v.is_active = true
    INNER JOIN villa_price_cache vpc ON vpc.villa_id = v.id AND vpc.window_kind = 'min_stay'
    WHERE vc.category_id IN (${sql.join(
      categoryIds.map((id) => sql`${id}`),
      sql`, `,
    )})
    ORDER BY vc.category_id, vpc.discounted_total_cents ASC NULLS LAST, v.id ASC
  `);

  const imageByCategoryId = new Map(
    imageRows.rows.map((row) => [row.category_id, row.url]),
  );
  const dealByCategoryId = new Map(
    dealRows.rows.map((row) => [row.category_id, row.has_discount]),
  );

  const categoriesOut: HomeCategoryCarouselRow[] = categoryMeta.map((meta) => {
    const stats = statsByCategoryId.get(meta.categoryId);
    return {
      slug: meta.slug,
      label: meta.name,
      image: imageByCategoryId.get(meta.categoryId) ?? PLACEHOLDER_CATEGORY_IMAGE,
      villaCount: stats?.villaCount ?? 0,
      startingFromEurCents: stats?.minNightlyCents ?? null,
      isGoodDeal: dealByCategoryId.get(meta.categoryId) ?? false,
    };
  });

  const [editorsStats] = await db
    .select({
      villaCount: sql<number>`count(distinct ${villas.id})::int`,
      minNightlyCents: sql<number | null>`min(${villaPriceCache.avgNightlyCents})`,
      hasDeal: sql<boolean>`bool_or(${villaPriceCache.hasActiveDiscount})`,
    })
    .from(villas)
    .innerJoin(
      villaPriceCache,
      and(
        eq(villaPriceCache.villaId, villas.id),
        eq(villaPriceCache.windowKind, "min_stay"),
      ),
    )
    .where(and(eq(villas.isActive, true), eq(villas.isEditorsChoice, true)));

  const editorsImageRows = await db
    .select({ url: villaImages.url })
    .from(villas)
    .innerJoin(
      villaPriceCache,
      and(
        eq(villaPriceCache.villaId, villas.id),
        eq(villaPriceCache.windowKind, "min_stay"),
      ),
    )
    .leftJoin(
      villaImages,
      and(eq(villaImages.villaId, villas.id), eq(villaImages.isMain, true)),
    )
    .where(and(eq(villas.isActive, true), eq(villas.isEditorsChoice, true)))
    .orderBy(asc(villaPriceCache.discountedTotalCents), asc(villas.id))
    .limit(1);

  return {
    categories: categoriesOut,
    editorsChoice: {
      image: editorsImageRows[0]?.url ?? PLACEHOLDER_CATEGORY_IMAGE,
      villaCount: editorsStats?.villaCount ?? 0,
      startingFromEurCents: editorsStats?.minNightlyCents ?? null,
      isGoodDeal: editorsStats?.hasDeal ?? false,
    },
  };
}
