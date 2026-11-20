/**
 * Concierge results: price the guest's chosen stay length when the calendar allows.
 */
import { connection } from "next/server";

import {
  buildPricingInputFromSources,
  loadVillaCalendarHorizon,
} from "@/db/queries/pricing.queries";
import type { VillaCardRow } from "@/db/queries/villas.queries";
import type { AppliedPromotionSnapshot } from "@/db/tables/caches";
import { findEarliestWindowForDesiredNights } from "@/lib/availability";
import { getBusinessToday } from "@/lib/dates";
import { PRICE_CACHE_HORIZON_DAYS } from "@/lib/cron/jobs/rebuild-villa-price-cache";
import type { Locale, LocalizedText } from "@/lib/locales";
import { calculateQuote } from "@/lib/pricing.engine";
import type { PricingContext } from "@/lib/pricing.types";

export async function applyConciergeStayQuotesToRows(
  rows: VillaCardRow[],
  options: {
    desiredNights: number;
    guestCount: number;
    locale: Locale;
  },
): Promise<VillaCardRow[]> {
  await connection();
  const today = getBusinessToday();
  const context: PricingContext = {
    today,
    bookedAt: today,
    guestCount: options.guestCount,
    couponCode: null,
    locale: options.locale,
  };

  const quoted = await Promise.all(
    rows.map(async (row) => {
      try {
        return await quoteRowForDesiredStay(row, context, options.desiredNights);
      } catch {
        return row;
      }
    }),
  );

  return quoted;
}

async function quoteRowForDesiredStay(
  row: VillaCardRow,
  context: PricingContext,
  desiredNights: number,
): Promise<VillaCardRow> {
  const sources = await loadVillaCalendarHorizon(
    row.id,
    context.today,
    PRICE_CACHE_HORIZON_DAYS,
  );

  if (sources === null) return row;

  const window = findEarliestWindowForDesiredNights(sources.nights, desiredNights, {
    defaultMinStay: sources.villa.defaultMinStay,
    promoNightCounts: sources.freeDaysThresholds,
    promotionMinStayOverrides: sources.promotionMinStayOverrides,
  });

  if (window === null) return row;

  const input = buildPricingInputFromSources(sources, window, context);
  const quote = calculateQuote(input);

  const appliedPromotions = toPromotionSnapshots(
    quote,
    sources.promotionDisplayNames,
    context.locale,
  );

  return {
    ...row,
    baseTotalCents: quote.baseTotalCents,
    priceFromCents: quote.nightlyTotalCents,
    discountedTotalCents: quote.nightlyTotalCents,
    avgNightlyCents: quote.avgNightlyCents,
    hasActiveDiscount: quote.totalDiscountCents > 0,
    cacheNightCount: quote.nightCount,
    cacheCheckIn: window.checkIn,
    cacheCheckOut: window.checkOut,
    appliedPromotions,
  };
}

function toPromotionSnapshots(
  quote: ReturnType<typeof calculateQuote>,
  displayNames: Map<number, LocalizedText>,
  locale: Locale,
): AppliedPromotionSnapshot[] {
  return quote.appliedPromotions.map((applied) => {
    const displayNameI18n =
      displayNames.get(applied.promotionId) ?? ({ en: applied.displayName } as LocalizedText);

    return {
      promotionId: applied.promotionId,
      name: applied.displayName,
      displayNameI18n,
      discountType: applied.discountType,
      discountCents: applied.discountCents,
      percentBp: applied.percentBp,
      freeNights: applied.freeNights,
    };
  });
}