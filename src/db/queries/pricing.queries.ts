/**
 * The only module that may join `villa_calendar`, `villas`, and `promotions`.
 * Builds a fully materialized `PricingInput` for `calculateQuote` (Phase 3).
 *
 * Stay and date inputs are inherently request-specific, so this function uses
 * `use cache: private` (see plan Phase 4) instead of shared tagged cache.
 */
import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import { cacheLife } from "next/cache";

import { db } from "@/db";
import { promotions, villaCalendar, villaPromotions, villas } from "@/db/schema";
import {
  addDays,
  enumerateNights,
  getBusinessToday,
  type DateString,
} from "@/lib/dates";
import {
  localize,
  DEFAULT_LOCALE,
  type Locale,
  type LocalizedText,
} from "@/lib/locales";
import type { Cents } from "@/lib/money";
import type {
  NightRate,
  PricingContext,
  PricingInput,
  PromotionRule,
} from "@/lib/pricing.types";

export type LoadVillaPricingOptions = {
  guestCount?: number;
  couponCode?: string | null;
  locale?: Locale;
  /** When the booking is made; defaults to business today. */
  bookedAt?: DateString;
  /** "Today" for trigger math; defaults to `getBusinessToday()`. */
  today?: DateString;
};

function mapPromotionRow(
  row: typeof promotions.$inferSelect,
  effectivePriorityOrder: number,
  locale: Locale,
): PromotionRule {
  const displayName = localize(row.displayNameI18n, locale);

  return {
    id: row.id,
    name: row.name,
    displayName,

    discountType: row.discountType,
    triggerType: row.triggerType,

    percentBp: row.percentBp,
    fixedAmountCents: row.fixedAmountCents as Cents | null,
    freeNights: row.freeNights,
    freeNightsThreshold: row.freeNightsThreshold,

    minNights: row.minNights,
    maxNights: row.maxNights,
    overrideMinNights: row.overrideMinNights,
    lastMinuteWithinDays: row.lastMinuteWithinDays,
    earlyBirdMinDays: row.earlyBirdMinDays,
    code: row.code,

    bookingWindowStart: row.bookingWindowStart as DateString | null,
    bookingWindowEnd: row.bookingWindowEnd as DateString | null,
    travelWindowStart: row.travelWindowStart as DateString | null,
    travelWindowEnd: row.travelWindowEnd as DateString | null,

    priorityOrder: effectivePriorityOrder,
    isStackable: row.isStackable,

    isActive: row.isActive,
    maxRedemptions: row.maxRedemptions,
    redemptionCount: row.redemptionCount,
  };
}

function buildNightRates(args: {
  checkIn: DateString;
  checkOut: DateString;
  defaultNightlyPriceCents: number | null;
  defaultMinStay: number;
  calendarRows: (typeof villaCalendar.$inferSelect)[];
}): NightRate[] {
  const { checkIn, checkOut, defaultNightlyPriceCents, calendarRows } = args;
  const nightDates = enumerateNights(checkIn, checkOut);

  const byDate = new Map<string, typeof villaCalendar.$inferSelect>();
  for (const row of calendarRows) {
    byDate.set(String(row.date), row);
  }

  return nightDates.map((date): NightRate => {
    const row = byDate.get(date);
    if (row !== undefined) {
      const priceCents = row.priceCents ?? defaultNightlyPriceCents;
      const isBlocked =
        row.isBlocked || priceCents === null || priceCents === undefined;
      return {
        date,
        priceCents: (priceCents ?? 0) as Cents,
        minStay: row.minStay,
        isBlocked,
      };
    }

    if (defaultNightlyPriceCents !== null) {
      return {
        date,
        priceCents: defaultNightlyPriceCents as Cents,
        minStay: null,
        isBlocked: false,
      };
    }

    return {
      date,
      priceCents: 0 as Cents,
      minStay: null,
      isBlocked: true,
    };
  });
}

/**
 * Loads villa defaults, every night in `[checkIn, checkOut)`, and every villa-linked
 * promotion. The caller passes guest-level fields (`guestCount`, `couponCode`) that
 * belong in `PricingContext`, not in the cache key of a shared tag.
 */
export async function loadVillaPricingContext(
  villaId: number,
  checkIn: DateString,
  checkOut: DateString,
  options: LoadVillaPricingOptions = {},
): Promise<PricingInput> {
  "use cache: private";
  cacheLife("hours");

  const locale = options.locale ?? DEFAULT_LOCALE;
  const today = options.today ?? getBusinessToday();
  const bookedAt = options.bookedAt ?? today;
  const guestCount = options.guestCount ?? 2;
  const couponCode = options.couponCode ?? null;

  const context: PricingContext = {
    today,
    bookedAt,
    guestCount,
    couponCode,
    locale,
  };

  const [villaRow] = await db
    .select()
    .from(villas)
    .where(and(eq(villas.id, villaId), eq(villas.isActive, true)))
    .limit(1);

  if (villaRow === undefined) {
    throw new Error(`Villa ${villaId} not found or inactive`);
  }

  const calendarRows = await db
    .select()
    .from(villaCalendar)
    .where(
      and(
        eq(villaCalendar.villaId, villaId),
        gte(villaCalendar.date, checkIn),
        lt(villaCalendar.date, checkOut),
      ),
    );

  const promotionRows = await db
    .select({
      promotion: promotions,
      priorityOverride: villaPromotions.priorityOverride,
    })
    .from(villaPromotions)
    .innerJoin(promotions, eq(promotions.id, villaPromotions.promotionId))
    .where(eq(villaPromotions.villaId, villaId))
    .orderBy(
      asc(
        sql<number>`coalesce(${villaPromotions.priorityOverride}, ${promotions.priorityOrder})`,
      ),
      asc(promotions.priorityOrder),
      asc(promotions.id),
    );

  const promotionRules: PromotionRule[] = promotionRows.map(
    ({ promotion, priorityOverride }) =>
      mapPromotionRow(
        promotion,
        priorityOverride ?? promotion.priorityOrder,
        locale,
      ),
  );

  const nights = buildNightRates({
    checkIn,
    checkOut,
    defaultNightlyPriceCents: villaRow.defaultNightlyPriceCents,
    defaultMinStay: villaRow.defaultMinStay,
    calendarRows,
  });

  return {
    villaId,
    checkIn,
    checkOut,
    nights,
    cleaningFeeCents: villaRow.cleaningFeeCents as Cents,
    depositCents: villaRow.depositCents as Cents,
    defaultMinStay: villaRow.defaultMinStay,
    capacity: villaRow.capacity,
    promotions: promotionRules,
    context,
  };
}

/* -------------------------------------------------------------------------- */
/* Cron horizon loading                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Everything the nightly rebuild needs for one villa, read once.
 *
 * `promotionDisplayNames` carries the raw `display_name_i18n` jsonb rather than a
 * localized string: `villa_price_cache.applied_promotions` is rendered in every
 * locale from a single cached row, so the cron must not collapse it to one
 * language the way a request-time quote does.
 */
export type VillaPricingSources = {
  villa: typeof villas.$inferSelect;
  nights: NightRate[];
  promotions: PromotionRule[];
  promotionDisplayNames: Map<number, LocalizedText>;
  /** `free_nights_threshold` of each attached `free_days` promotion. */
  freeDaysThresholds: number[];
  /** Active `override_min_nights` values for availability scanning. */
  promotionMinStayOverrides: number[];
};

/**
 * Deliberately **not** cached. The cron is the writer of the cache that pages
 * read; caching its own inputs would let it recompute tomorrow's prices from
 * yesterday's calendar.
 */
export async function loadVillaCalendarHorizon(
  villaId: number,
  from: DateString,
  horizonDays: number,
): Promise<VillaPricingSources | null> {
  const until = addDays(from, horizonDays);

  const [villaRow] = await db
    .select()
    .from(villas)
    .where(and(eq(villas.id, villaId), eq(villas.isActive, true)))
    .limit(1);

  if (villaRow === undefined) return null;

  const [calendarRows, promotionRows] = await Promise.all([
    db
      .select()
      .from(villaCalendar)
      .where(
        and(
          eq(villaCalendar.villaId, villaId),
          gte(villaCalendar.date, from),
          lt(villaCalendar.date, until),
        ),
      ),

    db
      .select({
        promotion: promotions,
        priorityOverride: villaPromotions.priorityOverride,
      })
      .from(villaPromotions)
      .innerJoin(promotions, eq(promotions.id, villaPromotions.promotionId))
      .where(eq(villaPromotions.villaId, villaId))
      .orderBy(
        asc(
          sql<number>`coalesce(${villaPromotions.priorityOverride}, ${promotions.priorityOrder})`,
        ),
        asc(promotions.priorityOrder),
        asc(promotions.id),
      ),
  ]);

  const promotionDisplayNames = new Map<number, LocalizedText>();
  const freeDaysThresholds: number[] = [];
  const promotionMinStayOverrides: number[] = [];

  for (const { promotion } of promotionRows) {
    promotionDisplayNames.set(promotion.id, promotion.displayNameI18n);
    if (
      promotion.isActive &&
      promotion.discountType === "free_days" &&
      promotion.freeNightsThreshold !== null
    ) {
      freeDaysThresholds.push(promotion.freeNightsThreshold);
    }
    if (
      promotion.isActive &&
      promotion.overrideMinNights !== null &&
      promotion.overrideMinNights > 0
    ) {
      promotionMinStayOverrides.push(promotion.overrideMinNights);
    }
  }

  return {
    villa: villaRow,
    nights: buildNightRates({
      checkIn: from,
      checkOut: until,
      defaultNightlyPriceCents: villaRow.defaultNightlyPriceCents,
      defaultMinStay: villaRow.defaultMinStay,
      calendarRows,
    }),
    promotions: promotionRows.map(({ promotion, priorityOverride }) =>
      mapPromotionRow(
        promotion,
        priorityOverride ?? promotion.priorityOrder,
        DEFAULT_LOCALE,
      ),
    ),
    promotionDisplayNames,
    freeDaysThresholds,
    promotionMinStayOverrides,
  };
}

/**
 * Pure composition: turns an already-loaded horizon into the `PricingInput` for
 * one window. Keeping this here rather than in the cron job means every
 * `PricingInput` in the codebase is built by this one module.
 */
export function buildPricingInputFromSources(
  sources: VillaPricingSources,
  window: { checkIn: DateString; checkOut: DateString; startIndex: number; nightCount: number },
  context: PricingContext,
): PricingInput {
  return {
    villaId: sources.villa.id,
    checkIn: window.checkIn,
    checkOut: window.checkOut,
    nights: sources.nights.slice(
      window.startIndex,
      window.startIndex + window.nightCount,
    ),
    cleaningFeeCents: sources.villa.cleaningFeeCents as Cents,
    depositCents: sources.villa.depositCents as Cents,
    defaultMinStay: sources.villa.defaultMinStay,
    capacity: sources.villa.capacity,
    promotions: sources.promotions,
    context,
  };
}
