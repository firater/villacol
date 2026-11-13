"use server";

import { connection } from "next/server";
import { z } from "zod";

import { loadVillaPricingContext } from "@/db/queries/pricing.queries";
import { getExchangeRates } from "@/db/queries/rates.queries";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { parseRate, toDisplayAmount, type ExchangeRateMap } from "@/lib/currency";
import { diffInNights, getBusinessToday, type DateString } from "@/lib/dates";
import type { Currency, Locale } from "@/lib/locales";
import type { Cents } from "@/lib/money";
import { resolvePreferences } from "@/lib/preferences";
import {
  assertQuoteInvariants,
  calculateQuote,
  PricingError,
  validateStay,
} from "@/lib/pricing.engine";
import type { AppliedPromotion, PriceQuote } from "@/lib/pricing.types";
import { dateStringSchema } from "@/lib/validation";

/** A stay longer than this is a data-entry mistake, not a booking. */
const MAX_STAY_NIGHTS = 90;

const quoteSchema = z
  .object({
    villaId: z.number().int().positive(),
    checkIn: dateStringSchema,
    checkOut: dateStringSchema,
    guestCount: z.number().int().min(1).max(100),
    couponCode: z.string().trim().min(1).max(60).nullish(),
  })
  .refine((value) => value.checkIn < value.checkOut, {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  })
  .refine(
    (value) => diffInNights(value.checkIn, value.checkOut) <= MAX_STAY_NIGHTS,
    {
      message: `A stay may not exceed ${MAX_STAY_NIGHTS} nights`,
      path: ["checkOut"],
    },
  );

/**
 * What the detail page renders. Both representations travel together: the
 * converted figures for display and the EUR-cents `quote` for anything that
 * needs exact arithmetic.
 */
export type QuoteDisplay = {
  nightCount: number;
  currency: Currency;
  locale: Locale;
  /** Pre-discount accommodation total (sum of nights). */
  baseTotal: ReturnType<typeof toDisplayAmount>;
  nightlyTotal: ReturnType<typeof toDisplayAmount>;
  cleaningFee: ReturnType<typeof toDisplayAmount>;
  totalDiscount: ReturnType<typeof toDisplayAmount>;
  grandTotal: ReturnType<typeof toDisplayAmount>;
  avgNightly: ReturnType<typeof toDisplayAmount>;
  deposit: ReturnType<typeof toDisplayAmount>;
  appliedPromotions: (AppliedPromotion & {
    discount: ReturnType<typeof toDisplayAmount>;
  })[];
  quote: PriceQuote;
};

/** Flattens the FX rows into the map `convertCents` expects. */
async function loadRateMap(): Promise<ExchangeRateMap> {
  const rows = await getExchangeRates();
  const rates: ExchangeRateMap = {};

  for (const row of rows) {
    const rate = parseRate(row.rate);
    if (Number.isFinite(rate)) rates[row.quoteCurrency] = rate;
  }

  return rates;
}

/**
 * Prices a stay for display. Shared by the detail page and the booking form,
 * and intentionally the same code path `createBookingInquiry` uses, so the
 * number the guest sees and the number that is stored cannot drift.
 */
export async function getVillaQuote(
  input: z.input<typeof quoteSchema>,
): Promise<ActionResult<QuoteDisplay>> {
  try {
    await connection();

    const parsed = quoteSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { villaId, checkIn, checkOut, guestCount, couponCode } = parsed.data;
    const { locale, currency } = await resolvePreferences();

    const [pricingInput, rates] = await Promise.all([
      loadVillaPricingContext(villaId, checkIn as DateString, checkOut as DateString, {
        guestCount,
        couponCode: couponCode ?? null,
        locale,
        today: getBusinessToday(),
      }),
      loadRateMap(),
    ]);

    const validation = validateStay(pricingInput);
    if (!validation.valid) {
      // A declined stay is an expected outcome (blocked night, min stay), not a
      // fault, so it comes back as a field error rather than a thrown error.
      return {
        ok: false,
        error: validation.errors[0].message,
        fieldErrors: {
          checkIn: validation.errors.map((entry) => entry.message),
        },
      };
    }

    const quote = calculateQuote(pricingInput);
    assertQuoteInvariants(quote);

    const display = (cents: Cents) =>
      toDisplayAmount(cents, currency, locale, rates);

    return ok({
      nightCount: quote.nightCount,
      currency,
      locale,
      baseTotal: display(quote.baseTotalCents),
      nightlyTotal: display(quote.nightlyTotalCents),
      cleaningFee: display(quote.cleaningFeeCents),
      totalDiscount: display(quote.totalDiscountCents),
      grandTotal: display(quote.grandTotalCents),
      avgNightly: display(quote.avgNightlyCents),
      deposit: display(quote.depositCents),
      appliedPromotions: quote.appliedPromotions.map((promotion) => ({
        ...promotion,
        discount: display(promotion.discountCents),
      })),
      quote,
    });
  } catch (error) {
    if (error instanceof PricingError && error.code === "invalid_stay") {
      return { ok: false, error: error.message };
    }
    return toActionError(error);
  }
}
