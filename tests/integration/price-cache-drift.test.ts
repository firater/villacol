/**
 * The cache-vs-live drift check from Phase 9.
 *
 * A listing card reads `villa_price_cache`; a villa detail page prices the same
 * stay live through `loadVillaPricingContext` + `calculateQuote`. Those are two
 * code paths producing one number, and when they disagree the symptom is a card
 * advertising €4,200 that becomes €4,480 on the next click — a silent bug no
 * unit test on the engine can catch, because both sides call the same engine
 * and still disagree about what they fed it.
 *
 * So this seeds the database, runs the real cron, and re-prices every row it
 * wrote through the live path. Any divergence in the inputs — a different guest
 * count, a dropped promotion join, a horizon off by a night — fails here.
 *
 * Requires a real database. Run with `npm run test:integration`.
 */
import { asc, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/db";
import { getPool } from "@/db/pool";
import { loadVillaPricingContext } from "@/db/queries/pricing.queries";
import { seed, type SeedResult } from "@/db/seed";
import { villaPriceCache } from "@/db/schema";
import {
  CACHE_GUEST_COUNT,
  rebuildVillaPriceCache,
} from "@/lib/cron/jobs/rebuild-villa-price-cache";
import { diffInNights, getBusinessToday, type DateString } from "@/lib/dates";
import { DEFAULT_LOCALE } from "@/lib/locales";
import { assertQuoteInvariants, calculateQuote } from "@/lib/pricing.engine";
import { PRICING_ENGINE_VERSION_ID } from "@/lib/pricing.types";

/** Pinned once: a midnight rollover mid-test would reprice against a new horizon. */
const today: DateString = getBusinessToday();

let seedResult: SeedResult;
let villaIds: number[];
let cachedRows: (typeof villaPriceCache.$inferSelect)[];

beforeAll(async () => {
  // The admin user is skipped: it is the slowest step in the seed and nothing
  // about pricing depends on it.
  seedResult = await seed({ today, withAdmin: false });
  villaIds = Object.values(seedResult.villaIdsByRefCode);

  const jobResult = await rebuildVillaPriceCache(villaIds, { today });
  expect(jobResult.failedCount).toBe(0);
  expect(jobResult.processedCount).toBe(villaIds.length);

  cachedRows = await db
    .select()
    .from(villaPriceCache)
    .where(inArray(villaPriceCache.villaId, villaIds))
    .orderBy(asc(villaPriceCache.villaId), asc(villaPriceCache.windowKind));
});

afterAll(async () => {
  await getPool().end();
});

describe("villa_price_cache vs a direct calculateQuote", () => {
  it("cached every seeded villa", () => {
    const villasWithRows = new Set(cachedRows.map((row) => row.villaId));
    expect([...villasWithRows].sort()).toEqual([...villaIds].sort());
  });

  it("matches the live pricing path on every cached row", async () => {
    expect(cachedRows.length).toBeGreaterThan(0);

    for (const row of cachedRows) {
      const label = `villa ${row.villaId} / ${row.windowKind} / ${row.checkIn}..${row.checkOut}`;

      // Deliberately the request-time loader, not the cron's own
      // `loadVillaCalendarHorizon`. Comparing the cron against itself would
      // prove nothing; the point is that the detail page's inputs agree.
      const input = await loadVillaPricingContext(
        row.villaId,
        row.checkIn,
        row.checkOut,
        {
          guestCount: CACHE_GUEST_COUNT,
          couponCode: null,
          locale: DEFAULT_LOCALE,
          bookedAt: today,
          today,
        },
      );

      const quote = calculateQuote(input);
      assertQuoteInvariants(quote);

      expect(row.nightCount, `${label}: nightCount`).toBe(quote.nightCount);
      expect(row.baseTotalCents, `${label}: baseTotalCents`).toBe(
        quote.baseTotalCents,
      );
      expect(row.totalDiscountCents, `${label}: totalDiscountCents`).toBe(
        quote.totalDiscountCents,
      );
      // The cleaning fee is carried on the row but never folded into a total,
      // so the cached "discounted total" is the engine's nightly total exactly.
      expect(row.discountedTotalCents, `${label}: discountedTotalCents`).toBe(
        quote.nightlyTotalCents,
      );
      expect(row.avgNightlyCents, `${label}: avgNightlyCents`).toBe(
        quote.avgNightlyCents,
      );
      expect(row.cleaningFeeCents, `${label}: cleaningFeeCents`).toBe(
        quote.cleaningFeeCents,
      );
      expect(row.hasActiveDiscount, `${label}: hasActiveDiscount`).toBe(
        quote.totalDiscountCents > 0,
      );
      expect(row.engineVersion, `${label}: engineVersion`).toBe(
        PRICING_ENGINE_VERSION_ID,
      );

      // Which promotions applied, and for how much each. Comparing only the
      // totals would let two different promotion sets that happen to sum alike
      // pass, and the card and the detail page would name different offers.
      expect(
        row.appliedPromotions.map((applied) => ({
          promotionId: applied.promotionId,
          discountType: applied.discountType,
          discountCents: applied.discountCents,
        })),
        `${label}: appliedPromotions`,
      ).toEqual(
        quote.appliedPromotions.map((applied) => ({
          promotionId: applied.promotionId,
          discountType: applied.discountType,
          discountCents: applied.discountCents,
        })),
      );
    }
  });

  it("keeps every cached row internally consistent", () => {
    for (const row of cachedRows) {
      const label = `villa ${row.villaId} / ${row.windowKind}`;

      expect(row.nightCount, `${label}: nightCount vs dates`).toBe(
        diffInNights(row.checkIn, row.checkOut),
      );
      expect(row.discountedTotalCents, `${label}: total identity`).toBe(
        row.baseTotalCents - row.totalDiscountCents,
      );
      expect(row.minNightlyCents, `${label}: min <= max`).toBeLessThanOrEqual(
        row.maxNightlyCents,
      );
      expect(row.checkIn >= today, `${label}: window starts today or later`).toBe(
        true,
      );
    }
  });
});

/**
 * Guards against the drift check passing for the wrong reason. Every assertion
 * above holds trivially on a villa with no promotions and no blocked nights, so
 * these pin the seed to data that actually drives the engine: a discount has to
 * land somewhere, both window kinds have to appear, and the availability scan
 * has to be made to step over a blocker.
 */
describe("the seed exercises the paths the drift check is meant to cover", () => {
  it("discounts at least one cached window", () => {
    expect(cachedRows.some((row) => row.hasActiveDiscount)).toBe(true);
    expect(
      cachedRows.some((row) => row.appliedPromotions.length > 1),
      "expected at least one window with two promotions compounded",
    ).toBe(true);
  });

  it("writes both window kinds", () => {
    const kinds = new Set(cachedRows.map((row) => row.windowKind));
    expect([...kinds].sort()).toEqual(["min_stay", "promo_free_days"]);
  });

  it("leaves one villa undiscounted, as the control case", () => {
    expect(cachedRows.some((row) => !row.hasActiveDiscount)).toBe(true);
  });

  it("starts Villa Sunset's window after its blocked nights", () => {
    const villaId = seedResult.villaIdsByRefCode["VS-001"];
    const rows = cachedRows.filter((row) => row.villaId === villaId);

    expect(rows.length).toBe(2);
    // Nights 2 through 8 are held, so no bookable run of five fits before them.
    for (const row of rows) {
      expect(diffInNights(today, row.checkIn)).toBe(9);
    }
  });
});
