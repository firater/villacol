/**
 * Editor's Choice villa picks for the curated concierge (rules-based for now).
 */
import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import {
  features,
  locations,
  locationTranslations,
  villaFeatures,
  villaImages,
  villaPriceCache,
  villas,
  villaTranslations,
} from "@/db/schema";
import { localize, type Locale } from "@/lib/locales";
import type { VillaCardRow } from "@/db/queries/villas.queries";

export type ConciergeGroupType = "couple" | "family" | "friends";
export type ConciergeVibe = "secluded_luxury" | "close_to_town" | "beachfront";
/** Nightly bands in EUR major units, applied to `villa_price_cache.avg_nightly_cents`. */
export type ConciergeBudget =
  | "up_to_200"
  | "nightly_200_500"
  | "above_500";

export type ConciergeAnswers = {
  groupType: ConciergeGroupType;
  vibe: ConciergeVibe;
  budget: ConciergeBudget;
};

const VIBE_FEATURE_KEYS: Record<
  Exclude<ConciergeVibe, "close_to_town">,
  readonly string[]
> = {
  secluded_luxury: ["secluded"],
  beachfront: ["walk_to_beach", "sea_view"],
};

const NIGHTLY_BUDGET_CENTS: Record<
  ConciergeBudget,
  { min?: number; max?: number }
> = {
  up_to_200: { max: 20_000 },
  nightly_200_500: { min: 20_001, max: 50_000 },
  above_500: { min: 50_001 },
};

function groupPredicates(groupType: ConciergeGroupType) {
  switch (groupType) {
    case "couple":
      return [gte(villas.capacity, 2), gte(villas.bedrooms, 1)];
    case "family":
      return [gte(villas.capacity, 4), gte(villas.bedrooms, 2)];
    case "friends":
      return [gte(villas.capacity, 6), gte(villas.bedrooms, 3)];
  }
}

export async function findCuratedEditorVillas(
  locale: Locale,
  answers: ConciergeAnswers,
): Promise<VillaCardRow[]> {
  "use cache";
  cacheTag("villas", "concierge", `concierge-${locale}`);
  cacheLife("hours");

  const budget = NIGHTLY_BUDGET_CENTS[answers.budget];

  const pricePredicates = [
    eq(villaPriceCache.windowKind, "min_stay"),
    sql`${villaPriceCache.avgNightlyCents} IS NOT NULL`,
    budget.min !== undefined
      ? gte(villaPriceCache.avgNightlyCents, budget.min)
      : undefined,
    budget.max !== undefined
      ? lte(villaPriceCache.avgNightlyCents, budget.max)
      : undefined,
  ].filter(Boolean);

  let vibePredicate: ReturnType<typeof sql> | undefined;

  if (answers.vibe === "close_to_town") {
    vibePredicate = sql`NOT EXISTS (
      SELECT 1 FROM ${villaFeatures}
      INNER JOIN ${features} ON ${features.id} = ${villaFeatures.featureId}
      WHERE ${villaFeatures.villaId} = ${villas.id}
        AND ${features.key} = 'secluded'
    )`;
  } else {
    const vibeKeys = [...VIBE_FEATURE_KEYS[answers.vibe]];
    const featureIds = await db
      .select({ id: features.id })
      .from(features)
      .where(inArray(features.key, vibeKeys));

    if (featureIds.length > 0) {
      vibePredicate = sql`EXISTS (
        SELECT 1 FROM ${villaFeatures}
        WHERE ${villaFeatures.villaId} = ${villas.id}
          AND ${villaFeatures.featureId} IN (${sql.join(
            featureIds.map((row) => sql`${row.id}`),
            sql`, `,
          )})
      )`;
    }
  }

  const vibePredicates = vibePredicate !== undefined ? [vibePredicate] : [];

  const predicates = [
    eq(villas.isActive, true),
    eq(villas.isEditorsChoice, true),
    ...groupPredicates(answers.groupType),
    ...pricePredicates,
    ...vibePredicates,
  ].filter(Boolean);

  const rows = await db
    .select({
      id: villas.id,
      slug: villaTranslations.slug,
      refCode: villas.refCode,
      title: villaTranslations.title,
      summary: villaTranslations.summary,
      bedrooms: villas.bedrooms,
      bathrooms: villas.bathrooms,
      capacity: villas.capacity,
      mainImageUrl: villaImages.url,
      mainImageAlt: villaImages.altI18n,
      locationName: locationTranslations.name,
      baseTotalCents: villaPriceCache.baseTotalCents,
      priceFromCents: villaPriceCache.discountedTotalCents,
      avgNightlyCents: villaPriceCache.avgNightlyCents,
      hasActiveDiscount: villaPriceCache.hasActiveDiscount,
      cacheNightCount: villaPriceCache.nightCount,
      isEditorsChoice: villas.isEditorsChoice,
      isBestValue: villas.isBestValue,
      cacheCheckIn: villaPriceCache.checkIn,
      cacheCheckOut: villaPriceCache.checkOut,
      discountedTotalCents: villaPriceCache.discountedTotalCents,
      appliedPromotions: villaPriceCache.appliedPromotions,
    })
    .from(villas)
    .innerJoin(
      villaTranslations,
      and(
        eq(villaTranslations.villaId, villas.id),
        eq(villaTranslations.locale, locale),
      ),
    )
    .innerJoin(villaPriceCache, eq(villaPriceCache.villaId, villas.id))
    .leftJoin(locations, eq(locations.id, villas.locationId))
    .leftJoin(
      locationTranslations,
      and(
        eq(locationTranslations.locationId, locations.id),
        eq(locationTranslations.locale, locale),
      ),
    )
    .leftJoin(
      villaImages,
      and(eq(villaImages.villaId, villas.id), eq(villaImages.isMain, true)),
    )
    .where(and(...predicates))
    .orderBy(asc(villas.orderValue), asc(villas.id))
    .limit(3);

  return rows.map((row) => ({
    ...row,
    mainImageAlt:
      row.mainImageAlt !== null && row.mainImageAlt !== undefined
        ? localize(row.mainImageAlt, locale)
        : null,
    cacheCheckIn: row.cacheCheckIn != null ? String(row.cacheCheckIn) : null,
    cacheCheckOut: row.cacheCheckOut != null ? String(row.cacheCheckOut) : null,
    appliedPromotions: row.appliedPromotions ?? [],
  }));
}
