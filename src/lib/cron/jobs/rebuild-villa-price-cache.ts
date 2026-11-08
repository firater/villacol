/**
 * Nightly rebuild of `villa_price_cache`.
 *
 * This is what lets a listing page render prices with one indexed read instead
 * of running the pricing engine per card. The engine still produces every
 * number here, so the cached total and a live quote come from the same code.
 */
import { and, asc, eq, notInArray } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { db } from "@/db";
import { dbPool } from "@/db/pool";
import {
  buildPricingInputFromSources,
  loadVillaCalendarHorizon,
  type VillaPricingSources,
} from "@/db/queries/pricing.queries";
import { villaPriceCache, villas } from "@/db/schema";
import type { AppliedPromotionSnapshot } from "@/db/tables/caches";
import type { PriceCacheWindow } from "@/db/tables/enums";
import { findNextAvailableWindows } from "@/lib/availability";
import { getBusinessToday, type DateString } from "@/lib/dates";
import { DEFAULT_LOCALE } from "@/lib/locales";
import { calculateQuote } from "@/lib/pricing.engine";
import {
  PRICING_ENGINE_VERSION_ID,
  type PriceQuote,
  type PricingContext,
} from "@/lib/pricing.types";

import type { CronJobResult } from "../types";

/** 18 months: long enough to cover next season's bookings. */
export const PRICE_CACHE_HORIZON_DAYS = 540;

/**
 * Villas priced per batch. Bounded concurrency keeps the Neon pool from being
 * exhausted by a full sweep while still being far faster than one at a time.
 */
export const CRON_BATCH_SIZE = 25;

/**
 * A cache row describes a stay, not a guest, so guest count is pinned to the
 * smallest valid value: it only exists to satisfy `validateStay`.
 *
 * Exported so the drift check can rebuild the identical `PricingContext`: if
 * the two sides disagreed on guest count they would be comparing two different
 * questions and the check would pass while the prices diverged.
 */
export const CACHE_GUEST_COUNT = 1;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function toSnapshot(
  quote: PriceQuote,
  displayNames: Map<number, { en: string }>,
): AppliedPromotionSnapshot[] {
  return quote.appliedPromotions.map((applied) => ({
    promotionId: applied.promotionId,
    name: applied.displayName,
    displayNameI18n:
      displayNames.get(applied.promotionId) ?? { en: applied.displayName },
    discountType: applied.discountType,
    discountCents: applied.discountCents,
  }));
}

type CacheRow = typeof villaPriceCache.$inferInsert;

function buildCacheRows(
  sources: VillaPricingSources,
  today: DateString,
): CacheRow[] {
  const context: PricingContext = {
    today,
    bookedAt: today,
    guestCount: CACHE_GUEST_COUNT,
    couponCode: null,
    locale: DEFAULT_LOCALE,
  };

  const windows = findNextAvailableWindows(sources.nights, {
    defaultMinStay: sources.villa.defaultMinStay,
    promoNightCounts: sources.freeDaysThresholds,
    promotionMinStayOverrides: sources.promotionMinStayOverrides,
  });

  const rows: CacheRow[] = [];

  for (const window of windows) {
    const input = buildPricingInputFromSources(sources, window, context);
    const quote = calculateQuote(input);

    const nightlyRates = input.nights.map((night) => night.priceCents);

    rows.push({
      villaId: sources.villa.id,
      windowKind: window.kind satisfies PriceCacheWindow,
      checkIn: window.checkIn,
      checkOut: window.checkOut,
      nightCount: quote.nightCount,
      baseTotalCents: quote.baseTotalCents,
      totalDiscountCents: quote.totalDiscountCents,
      // The cleaning fee is carried alongside but never folded in, which is why
      // this equals the engine's nightly total exactly.
      discountedTotalCents: quote.nightlyTotalCents,
      avgNightlyCents: quote.avgNightlyCents,
      minNightlyCents: Math.min(...nightlyRates),
      maxNightlyCents: Math.max(...nightlyRates),
      cleaningFeeCents: quote.cleaningFeeCents,
      appliedPromotions: toSnapshot(quote, sources.promotionDisplayNames),
      hasActiveDiscount: quote.totalDiscountCents > 0,
      computedAt: new Date(),
      computedBy: "cron",
      engineVersion: PRICING_ENGINE_VERSION_ID,
    });
  }

  return rows;
}

/**
 * Prices one villa and writes its windows atomically.
 *
 * Both rows land in a single transaction so a listing page can never show the
 * min-stay total from this run next to the promo total from the previous one.
 * Window kinds the villa no longer qualifies for are deleted in the same
 * transaction, otherwise detaching a `free_days` promotion would leave a
 * phantom offer on the card forever.
 */
async function rebuildOneVilla(
  villaId: number,
  today: DateString,
): Promise<"written" | "skipped"> {
  const sources = await loadVillaCalendarHorizon(
    villaId,
    today,
    PRICE_CACHE_HORIZON_DAYS,
  );

  if (sources === null) return "skipped";

  const rows = buildCacheRows(sources, today);

  await dbPool.transaction(async (tx) => {
    if (rows.length === 0) {
      // No bookable window in the whole horizon: the villa should disappear
      // from listings rather than keep advertising a stale price.
      await tx.delete(villaPriceCache).where(eq(villaPriceCache.villaId, villaId));
      return;
    }

    await tx
      .delete(villaPriceCache)
      .where(
        and(
          eq(villaPriceCache.villaId, villaId),
          notInArray(
            villaPriceCache.windowKind,
            rows.map((row) => row.windowKind),
          ),
        ),
      );

    for (const row of rows) {
      await tx
        .insert(villaPriceCache)
        .values(row)
        .onConflictDoUpdate({
          target: [villaPriceCache.villaId, villaPriceCache.windowKind],
          set: {
            checkIn: row.checkIn,
            checkOut: row.checkOut,
            nightCount: row.nightCount,
            baseTotalCents: row.baseTotalCents,
            totalDiscountCents: row.totalDiscountCents,
            discountedTotalCents: row.discountedTotalCents,
            avgNightlyCents: row.avgNightlyCents,
            minNightlyCents: row.minNightlyCents,
            maxNightlyCents: row.maxNightlyCents,
            cleaningFeeCents: row.cleaningFeeCents,
            appliedPromotions: row.appliedPromotions,
            hasActiveDiscount: row.hasActiveDiscount,
            computedAt: row.computedAt,
            computedBy: row.computedBy,
            engineVersion: row.engineVersion,
          },
        });
    }
  });

  return "written";
}

/**
 * Full sweep when called with no argument; targeted when called from an admin
 * edit via `enqueueVillaCacheRebuild`.
 *
 * One villa's failure increments `failed_count` and is logged, never aborting
 * the sweep: a single villa with a broken promotion must not leave every other
 * villa's price stale.
 */
export async function rebuildVillaPriceCache(
  villaIds?: readonly number[],
  options: { today?: DateString } = {},
): Promise<CronJobResult> {
  const today = options.today ?? getBusinessToday();

  const targets =
    villaIds !== undefined
      ? villaIds
      : (
          await db
            .select({ id: villas.id })
            .from(villas)
            .where(eq(villas.isActive, true))
            .orderBy(asc(villas.id))
        ).map((row) => row.id);

  let processedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const failures: { villaId: number; error: string }[] = [];

  for (const batch of chunk(targets, CRON_BATCH_SIZE)) {
    const settled = await Promise.allSettled(
      batch.map((villaId) => rebuildOneVilla(villaId, today)),
    );

    settled.forEach((outcome, index) => {
      const villaId = batch[index];

      if (outcome.status === "fulfilled") {
        if (outcome.value === "written") processedCount += 1;
        else skippedCount += 1;
        return;
      }

      failedCount += 1;
      const message =
        outcome.reason instanceof Error
          ? outcome.reason.message
          : String(outcome.reason);
      failures.push({ villaId, error: message });
      console.error(`[cron] price cache rebuild failed for villa ${villaId}`, outcome.reason);
    });
  }

  // Stale-while-revalidate: pages keep serving the previous price until the
  // next request pulls the row that was just written.
  revalidateTag("villa-price-cache", "max");
  revalidateTag("villas", "max");

  return {
    processedCount,
    failedCount,
    payload: {
      today,
      horizonDays: PRICE_CACHE_HORIZON_DAYS,
      batchSize: CRON_BATCH_SIZE,
      targetCount: targets.length,
      skippedCount,
      // Bounded so one catastrophic run cannot write a megabyte of jsonb.
      failures: failures.slice(0, 25),
    },
  };
}

/** Registry entry: a full nightly sweep. */
export async function dailyRebuildJob(context: {
  today: DateString;
}): Promise<CronJobResult> {
  return rebuildVillaPriceCache(undefined, { today: context.today });
}
