"use server";

import { randomBytes } from "node:crypto";

import { and, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { z } from "zod";

import { resolveCouponCode } from "@/db/queries/coupons.queries";
import {
  buildPricingInputFromSources,
  loadVillaCalendarHorizon,
} from "@/db/queries/pricing.queries";
import { getExchangeRates } from "@/db/queries/rates.queries";
import { dbPool } from "@/db/pool";
import {
  bookingPromotions,
  bookings,
  exitIntentCodes,
  promotions,
  villaCalendar,
  villaTranslations,
} from "@/db/schema";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { convertCents, parseRate, type ExchangeRateMap } from "@/lib/currency";
import {
  diffInNights,
  getBusinessToday,
  type DateString,
} from "@/lib/dates";
import { env } from "@/env";
import { buildBookingStatusUrl } from "@/lib/booking-urls";
import { sendEmail } from "@/lib/email/send";
import { renderBookingInquiryEmail } from "@/lib/email/templates";
import { localize, type Locale } from "@/lib/locales";
import { BASE_CURRENCY } from "@/lib/money";
import { resolvePreferences } from "@/lib/preferences";
import {
  assertQuoteInvariants,
  calculateQuote,
  PricingError,
  validateStay,
} from "@/lib/pricing.engine";
import type { PricingContext } from "@/lib/pricing.types";
import { dateStringSchema, idSchema, localeSchema } from "@/lib/validation";

const MAX_STAY_NIGHTS = 90;

const extraGuestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  age: z.number().int().min(0).max(120).optional(),
});

/**
 * Note what is absent: there is no price field anywhere in this schema. The
 * client cannot propose a total, so there is nothing to tamper with.
 */
const createBookingInquirySchema = z
  .object({
    villaId: idSchema,
    checkIn: dateStringSchema,
    checkOut: dateStringSchema,
    guestCount: z.number().int().min(1).max(100),
    extraGuests: z.array(extraGuestSchema).max(50).optional(),

    guestName: z.string().trim().min(2).max(160),
    guestEmail: z.string().trim().email().max(254),
    guestPhone: z.string().trim().min(5).max(40),
    guestAddress: z.string().trim().max(500).nullish(),
    guestNote: z.string().trim().max(2_000).nullish(),

    couponCode: z.string().trim().min(1).max(60).nullish(),
    locale: localeSchema.optional(),

    acceptTerms: z.literal(true, {
      message: "The terms must be accepted",
    }),
    acceptContract: z.boolean().optional(),
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

/** 32 bytes of entropy: unguessable, and short enough to sit in a URL. */
function generateAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

async function loadVillaTitle(
  villaId: number,
  locale: Locale,
): Promise<string> {
  const [row] = await dbPool
    .select({ title: villaTranslations.title })
    .from(villaTranslations)
    .where(
      and(
        eq(villaTranslations.villaId, villaId),
        eq(villaTranslations.locale, locale),
      ),
    )
    .limit(1);
  return row?.title ?? "Villa";
}

async function loadRateMap(): Promise<ExchangeRateMap> {
  const rows = await getExchangeRates();
  const rates: ExchangeRateMap = {};
  for (const row of rows) {
    const rate = parseRate(row.rate);
    if (Number.isFinite(rate)) rates[row.quoteCurrency] = rate;
  }
  return rates;
}

export type BookingInquiryResult = {
  bookingId: string;
  /** Hand this to the guest's confirmation link; an OTP still gates access. */
  accessToken: string;
  grandTotalCents: number;
  displayCurrency: string;
  displayTotalCents: number;
  /** True when the inquiry redeemed a one-off exit-intent code row. */
  exitIntentRedeemed: boolean;
};

/**
 * Creates an inquiry.
 *
 * The quote is recomputed here from an uncached calendar read
 * (`loadVillaCalendarHorizon`, not the `use cache: private`
 * `loadVillaPricingContext`) so a booking is never priced off a cache page
 * that was filled before the admin changed a rate. Availability is then
 * re-checked inside the transaction with the calendar rows locked, which is
 * what makes two simultaneous inquiries for the last free week safe.
 */
export async function createBookingInquiry(
  input: z.input<typeof createBookingInquirySchema>,
): Promise<ActionResult<BookingInquiryResult>> {
  try {
    const parsed = createBookingInquirySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const data = parsed.data;
    const checkIn = data.checkIn as DateString;
    const checkOut = data.checkOut as DateString;
    const nightCount = diffInNights(checkIn, checkOut);

    const preferences = await resolvePreferences();
    const locale = data.locale ?? preferences.locale;
    const currency = preferences.currency;

    const today = getBusinessToday();
    if (checkIn < today) {
      return {
        ok: false,
        error: "Check-in cannot be in the past.",
        fieldErrors: { checkIn: ["Check-in cannot be in the past."] },
      };
    }

    const coupon = await resolveCouponCode(data.couponCode);

    const sources = await loadVillaCalendarHorizon(
      data.villaId,
      checkIn,
      nightCount,
    );

    if (sources === null) {
      return { ok: false, error: "This villa is not available for booking." };
    }

    const context: PricingContext = {
      today,
      bookedAt: today,
      guestCount: data.guestCount,
      couponCode: coupon.couponCode,
      locale,
    };

    const pricingInput = buildPricingInputFromSources(
      sources,
      { checkIn, checkOut, startIndex: 0, nightCount },
      context,
    );

    const validation = validateStay(pricingInput);
    if (!validation.valid) {
      return {
        ok: false,
        error: validation.errors[0].message,
        fieldErrors: {
          checkIn: validation.errors.map((entry) => entry.message),
        },
      };
    }

    const rawQuote = calculateQuote(pricingInput);
    assertQuoteInvariants(rawQuote);

    // `loadVillaCalendarHorizon` localizes promotion names with the default
    // locale because the cron renders one cached row in every language. A
    // booking is for one guest, so the frozen breakdown gets their language.
    const quote = {
      ...rawQuote,
      appliedPromotions: rawQuote.appliedPromotions.map((promotion) => {
        const names = sources.promotionDisplayNames.get(promotion.promotionId);
        return {
          ...promotion,
          displayName:
            names !== undefined
              ? localize(names, locale)
              : promotion.displayName,
        };
      }),
    };

    const rates = await loadRateMap();
    const fxRate = currency === BASE_CURRENCY ? 1 : (rates[currency] ?? 1);
    const displayTotalCents = convertCents(
      quote.grandTotalCents,
      currency,
      rates,
    );

    const accessToken = generateAccessToken();
    const now = new Date();

    const exitIntentRedeemed = coupon.exitIntentCodeId !== null;

    type TransactionOutcome =
      | { kind: "conflict"; message: string }
      | { kind: "created"; bookingId: string; exitIntentRedeemed: boolean };

    const result = await dbPool.transaction<TransactionOutcome>(async (tx) => {
      // Lock the calendar rows for this stay. Rows that do not exist fall back
      // to the villa default and cannot be blocked, so there is nothing to lock
      // for them; what matters is that an admin block landing concurrently
      // either serializes behind this or is seen by the re-check below.
      const lockedNights = await tx
        .select({
          date: villaCalendar.date,
          isBlocked: villaCalendar.isBlocked,
          priceCents: villaCalendar.priceCents,
        })
        .from(villaCalendar)
        .where(
          and(
            eq(villaCalendar.villaId, data.villaId),
            gte(villaCalendar.date, checkIn),
            lt(villaCalendar.date, checkOut),
          ),
        )
        .for("update");

      const blocked = lockedNights.find((night) => night.isBlocked);
      if (blocked !== undefined) {
        return {
          kind: "conflict",
          message: `Night ${String(blocked.date)} is no longer available.`,
        };
      }

      const [created] = await tx
        .insert(bookings)
        .values({
          villaId: data.villaId,
          guestName: data.guestName,
          guestEmail: data.guestEmail.toLowerCase(),
          guestPhone: data.guestPhone,
          guestAddress: data.guestAddress ?? null,
          guestNote: data.guestNote ?? null,
          guestCount: data.guestCount,
          extraGuests: data.extraGuests ?? null,

          checkIn,
          checkOut,
          nightCount: quote.nightCount,
          status: "inquiry",
          accessToken,

          displayCurrency: currency,
          displayTotalCents,
          fxRateUsed: fxRate.toString(),

          baseTotalCents: quote.baseTotalCents,
          totalDiscountCents: quote.totalDiscountCents,
          nightlyTotalCents: quote.nightlyTotalCents,
          cleaningFeeCents: quote.cleaningFeeCents,
          depositCents: quote.depositCents,
          grandTotalCents: quote.grandTotalCents,

          // Frozen: the exact quote the guest accepted, replayable later even
          // after rates, promotions, and the engine itself have moved on.
          priceBreakdown: {
            ...quote,
            resolvedCouponCode: coupon.couponCode,
            exitIntentCodeId: coupon.exitIntentCodeId,
            quotedAt: now.toISOString(),
            quotedLocale: locale,
            quotedCurrency: currency,
            quotedFxRate: fxRate,
          },

          termsAcceptedAt: now,
          contractAcceptedAt: data.acceptContract === true ? now : null,
        })
        .returning({ id: bookings.id });

      if (quote.appliedPromotions.length > 0) {
        await tx.insert(bookingPromotions).values(
          quote.appliedPromotions.map((promotion) => ({
            bookingId: created.id,
            promotionId: promotion.promotionId,
            discountCents: promotion.discountCents,
            stepIndex: promotion.stepIndex,
          })),
        );

        // `max_redemptions` is only meaningful if the counter actually moves.
        for (const promotion of quote.appliedPromotions) {
          await tx
            .update(promotions)
            .set({ redemptionCount: sql`${promotions.redemptionCount} + 1` })
            .where(eq(promotions.id, promotion.promotionId));
        }
      }

      if (coupon.exitIntentCodeId !== null) {
        // `isNull(redeemedAt)` in the predicate rather than a prior read: two
        // tabs submitting the same code cannot both redeem it.
        await tx
          .update(exitIntentCodes)
          .set({ redeemedAt: now, bookingId: created.id })
          .where(
            and(
              eq(exitIntentCodes.id, coupon.exitIntentCodeId),
              isNull(exitIntentCodes.redeemedAt),
            ),
          );
      }

      return { kind: "created", bookingId: created.id, exitIntentRedeemed };
    });

    if (result.kind === "conflict") {
      return {
        ok: false,
        error: result.message,
        fieldErrors: { checkIn: [result.message] },
      };
    }

    const statusUrl = buildBookingStatusUrl(locale, accessToken);
    const villaTitle = await loadVillaTitle(data.villaId, locale);
    const inquiryEmail = renderBookingInquiryEmail({
      guestName: data.guestName,
      villaTitle,
      locale,
      statusUrl,
    });

    try {
      await sendEmail({
        to: data.guestEmail,
        subject: inquiryEmail.subject,
        html: inquiryEmail.html,
        text: inquiryEmail.text,
      });
      if (env.RESEND_API_KEY === undefined && env.NODE_ENV !== "production") {
        console.log("[booking inquiry] tracking link:", statusUrl);
      }
    } catch (mailError) {
      console.error("Inquiry email failed after booking was saved:", mailError);
    }

    return ok({
      bookingId: result.bookingId,
      accessToken,
      grandTotalCents: quote.grandTotalCents,
      displayCurrency: currency,
      displayTotalCents,
      exitIntentRedeemed: result.exitIntentRedeemed,
    });
  } catch (error) {
    if (error instanceof PricingError && error.code === "invalid_stay") {
      return { ok: false, error: error.message };
    }
    return toActionError(error);
  }
}
