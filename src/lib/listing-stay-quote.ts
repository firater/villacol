import { connection } from "next/server";

import { loadVillaPricingContext } from "@/db/queries/pricing.queries";
import type { VillaCardRow } from "@/db/queries/villas.queries";
import type { AppliedPromotionSnapshot } from "@/db/tables/caches";
import { diffInNights, getBusinessToday, type DateString } from "@/lib/dates";
import type { Locale, LocalizedText } from "@/lib/locales";
import {
  calculateQuote,
  resolveEffectiveMinStay,
  validateStay,
} from "@/lib/pricing.engine";

export type ListingStayCardMeta =
  | { mode: "quoted" }
  | { mode: "min_stay"; requiredNights: number };

export async function applyListingStayQuotes(
  rows: VillaCardRow[],
  options: {
    checkIn: DateString;
    checkOut: DateString;
    guestCount: number;
    locale: Locale;
  },
): Promise<{
  rows: VillaCardRow[];
  metaByVillaId: Map<number, ListingStayCardMeta>;
}> {
  await connection();
  const today = getBusinessToday();
  const metaByVillaId = new Map<number, ListingStayCardMeta>();

  const quoted = await Promise.all(
    rows.map(async (row) => {
      try {
        const pricingInput = await loadVillaPricingContext(
          row.id,
          options.checkIn,
          options.checkOut,
          {
            guestCount: options.guestCount,
            couponCode: null,
            locale: options.locale,
            today,
            bookedAt: today,
          },
        );

        const validation = validateStay(pricingInput);
        if (!validation.valid) {
          const blocking = validation.errors.filter(
            (error) => error.code !== "min_stay_not_met",
          );
          if (blocking.length > 0) {
            return row;
          }

          const requiredNights = resolveEffectiveMinStay(pricingInput);
          metaByVillaId.set(row.id, { mode: "min_stay", requiredNights });
          return row;
        }

        const quote = calculateQuote(pricingInput);
        metaByVillaId.set(row.id, { mode: "quoted" });

        const appliedPromotions = toPromotionSnapshots(quote);

        return {
          ...row,
          baseTotalCents: quote.baseTotalCents,
          priceFromCents: quote.nightlyTotalCents,
          discountedTotalCents: quote.nightlyTotalCents,
          avgNightlyCents: quote.avgNightlyCents,
          hasActiveDiscount: quote.totalDiscountCents > 0,
          cacheNightCount: quote.nightCount,
          cacheCheckIn: options.checkIn,
          cacheCheckOut: options.checkOut,
          appliedPromotions,
        };
      } catch {
        return row;
      }
    }),
  );

  return { rows: quoted, metaByVillaId };
}

export function selectedStayNightCount(
  checkIn: DateString,
  checkOut: DateString,
): number {
  return diffInNights(checkIn, checkOut);
}

function toPromotionSnapshots(
  quote: ReturnType<typeof calculateQuote>,
): AppliedPromotionSnapshot[] {
  return quote.appliedPromotions.map((applied) => {
    const displayNameI18n = { en: applied.displayName } as LocalizedText;

    return {
      promotionId: applied.promotionId,
      name: applied.displayName,
      displayNameI18n,
      discountType: applied.discountType,
      discountCents: applied.discountCents,
    };
  });
}