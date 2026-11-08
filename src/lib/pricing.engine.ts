/**
 * The pricing engine: pure functions only, with **zero imports from `@/db`**.
 *
 * Every input arrives fully materialized as a `PricingInput` (see
 * `src/db/queries/pricing.queries.ts` for the DB-to-engine seam), which is what
 * makes this module exhaustively unit-testable and keeps a cached EUR total
 * reproducible months later.
 *
 * Two rules hold everywhere below:
 *   1. Money is integer eurocents. No floats, ever.
 *   2. Discounts compound against a *running balance*, never the base total.
 *
 * Currency conversion deliberately lives outside this file, in
 * `src/lib/currency.ts`, because it is a display concern.
 */
import {
  addDays,
  diffInNights,
  enumerateNights,
  isAfter,
  isBefore,
  type DateString,
} from "@/lib/dates";
import {
  clampCents,
  percentOfCents,
  scaleCents,
  sumCents,
  type Cents,
} from "@/lib/money";
import {
  PRICING_ENGINE_VERSION,
  type AppliedPromotion,
  type DiscountStep,
  type EligibilityResult,
  type NightRate,
  type PriceQuote,
  type PricingInput,
  type PromotionRule,
  type SequentialDiscountResult,
  type StayValidation,
  type StayValidationError,
} from "@/lib/pricing.types";

export type PricingErrorCode =
  | "invalid_stay"
  | "malformed_promotion"
  | "invariant_violation";

export class PricingError extends Error {
  readonly code: PricingErrorCode;
  readonly errors: readonly StayValidationError[];

  constructor(
    code: PricingErrorCode,
    message: string,
    errors: readonly StayValidationError[] = [],
  ) {
    super(message);
    this.name = "PricingError";
    this.code = code;
    this.errors = errors;
  }
}

const ELIGIBLE: EligibilityResult = { eligible: true, reason: null };

/** Plain sum of the nightly rates. No discounts, no fees. */
export function calculateBaseTotal(nights: readonly NightRate[]): Cents {
  return sumCents(nights.map((night) => night.priceCents));
}

/**
 * One pure predicate per trigger. Returns the reason on failure so the admin
 * UI can explain why a promotion the guest expected did not apply.
 *
 * `min_nights` / `max_nights` are checked for *every* trigger, not just
 * `long_stay`: a coupon restricted to 7+ nights must honour that restriction.
 */
export function isPromotionEligible(
  promotion: PromotionRule,
  input: PricingInput,
): EligibilityResult {
  const { checkIn, checkOut, context } = input;
  const nightCount = input.nights.length;

  if (!promotion.isActive) return { eligible: false, reason: "inactive" };

  // When the booking is made.
  if (
    (promotion.bookingWindowStart !== null &&
      isBefore(context.bookedAt, promotion.bookingWindowStart)) ||
    (promotion.bookingWindowEnd !== null &&
      isAfter(context.bookedAt, promotion.bookingWindowEnd))
  ) {
    return { eligible: false, reason: "booking_window_closed" };
  }

  // When the stay happens. Compared against the last *night*, not the checkout
  // date, so a promotion ending on the 30th still covers a stay whose guests
  // leave on the 31st.
  const lastNight = addDays(checkOut, -1);
  if (
    (promotion.travelWindowStart !== null &&
      isBefore(checkIn, promotion.travelWindowStart)) ||
    (promotion.travelWindowEnd !== null &&
      isAfter(lastNight, promotion.travelWindowEnd))
  ) {
    return { eligible: false, reason: "travel_window_mismatch" };
  }

  if (
    promotion.maxRedemptions !== null &&
    promotion.redemptionCount >= promotion.maxRedemptions
  ) {
    return { eligible: false, reason: "redemptions_exhausted" };
  }

  // Pay-6-stay-7 must not fire on a 2-night stay.
  if (
    promotion.discountType === "free_days" &&
    promotion.freeNightsThreshold !== null &&
    nightCount < promotion.freeNightsThreshold
  ) {
    return { eligible: false, reason: "free_nights_threshold_not_met" };
  }

  if (promotion.minNights !== null && nightCount < promotion.minNights) {
    return { eligible: false, reason: "min_nights_not_met" };
  }
  if (promotion.maxNights !== null && nightCount > promotion.maxNights) {
    return { eligible: false, reason: "max_nights_exceeded" };
  }

  const leadDays = diffInNights(context.today, checkIn);

  switch (promotion.triggerType) {
    case "always":
      return ELIGIBLE;

    case "long_stay":
      // The min/max gate above already did the work; a `long_stay` row without
      // `min_nights` would match every booking, so it is a data error.
      requireCondition(promotion, promotion.minNights, "min_nights");
      return ELIGIBLE;

    case "last_minute": {
      const within = requireCondition(
        promotion,
        promotion.lastMinuteWithinDays,
        "last_minute_within_days",
      );
      return leadDays <= within
        ? ELIGIBLE
        : { eligible: false, reason: "not_last_minute" };
    }

    case "early_bird": {
      const minDays = requireCondition(
        promotion,
        promotion.earlyBirdMinDays,
        "early_bird_min_days",
      );
      return leadDays >= minDays
        ? ELIGIBLE
        : { eligible: false, reason: "not_early_bird" };
    }

    case "coupon":
    case "exit_intent": {
      const code = requireCondition(promotion, promotion.code, "code");
      return normalizeCode(context.couponCode) === normalizeCode(code)
        ? ELIGIBLE
        : { eligible: false, reason: "coupon_mismatch" };
    }
  }
}

function normalizeCode(code: string | null): string | null {
  const normalized = code?.trim().toLowerCase();
  return normalized ? normalized : null;
}

/** A promotion whose trigger column is null would match every booking. */
function requireCondition<T>(
  promotion: PromotionRule,
  value: T | null,
  column: string,
): T {
  if (value === null) {
    throw new PricingError(
      "malformed_promotion",
      `Promotion ${promotion.id} ("${promotion.name}") has trigger_type "${promotion.triggerType}" but no ${column}`,
    );
  }
  return value;
}

/**
 * Filters by eligibility, orders the chain, and resolves exclusivity.
 *
 * Sorting ascending by `priorityOrder` with `id` as the tiebreak makes the
 * chain deterministic, which matters because the order changes the total (a
 * percentage before a fixed amount is not the same as after it).
 *
 * "Exclusive" has exactly one meaning: take the first eligible promotion; if it
 * is non-stackable, it is the only one. Otherwise keep taking the subsequent
 * stackable ones, skipping any later exclusive promotion.
 */
export function selectApplicablePromotions(
  promotions: readonly PromotionRule[],
  input: PricingInput,
): PromotionRule[] {
  const eligible = promotions
    .filter((promotion) => isPromotionEligible(promotion, input).eligible)
    .sort(
      (left, right) =>
        left.priorityOrder - right.priorityOrder || left.id - right.id,
    );

  const [first, ...rest] = eligible;
  if (first === undefined) return [];
  if (!first.isStackable) return [first];

  return [first, ...rest.filter((promotion) => promotion.isStackable)];
}

/** `1000` bp of `90_000` is `9_000`. Rounds half-up, exactly once. */
export function applyPercentageDiscount(
  balanceCents: Cents,
  percentBp: number,
): Cents {
  return clampCents(percentOfCents(balanceCents, percentBp), 0, balanceCents);
}

/** Capped at the balance, so a chain can never drive the total negative. */
export function applyFixedAmountDiscount(
  balanceCents: Cents,
  amountCents: Cents,
): Cents {
  return Math.min(Math.max(balanceCents, 0), Math.max(amountCents, 0));
}

/**
 * Values the `freeNights` **cheapest** nights, then scales that value by
 * `balanceBeforeCents / baseTotalCents`.
 *
 * Both halves are deliberate. Cheapest-first is deterministic, where "the last
 * night" would change with sort order. The scaling factor means a free night
 * granted *after* a percentage discount is worth the already-discounted night
 * rather than the original - which also makes the free-days/percentage pair
 * commutative, so two promotions in either order produce the same total. This
 * interaction is the subtlest bug in the system, which is why the factor is an
 * explicit parameter instead of an implicit assumption.
 */
export function applyFreeDaysDiscount(
  nights: readonly NightRate[],
  freeNights: number,
  balanceBeforeCents: Cents,
  baseTotalCents: Cents,
): Cents {
  if (freeNights <= 0 || baseTotalCents <= 0 || balanceBeforeCents <= 0) {
    return 0;
  }

  const cheapestFirst = nights
    .map((night) => night.priceCents)
    .sort((left, right) => left - right);

  const freeCount = Math.min(freeNights, cheapestFirst.length);
  const freeValueCents = sumCents(cheapestFirst.slice(0, freeCount));

  return clampCents(
    scaleCents(freeValueCents, balanceBeforeCents, baseTotalCents),
    0,
    balanceBeforeCents,
  );
}

function discountFor(
  promotion: PromotionRule,
  nights: readonly NightRate[],
  balanceBeforeCents: Cents,
  baseTotalCents: Cents,
): Cents {
  switch (promotion.discountType) {
    case "percentage":
      return applyPercentageDiscount(
        balanceBeforeCents,
        requireValue(promotion, promotion.percentBp, "percent_bp"),
      );

    case "fixed_amount":
      return applyFixedAmountDiscount(
        balanceBeforeCents,
        requireValue(promotion, promotion.fixedAmountCents, "fixed_amount_cents"),
      );

    case "free_days":
      return applyFreeDaysDiscount(
        nights,
        requireValue(promotion, promotion.freeNights, "free_nights"),
        balanceBeforeCents,
        baseTotalCents,
      );
  }
}

/**
 * A missing discount value is a data error, not a zero discount: silently
 * charging the guest full price for a promotion the site advertised is worse
 * than a loud failure the cron records in `cron_runs`.
 */
function requireValue<T>(
  promotion: PromotionRule,
  value: T | null,
  column: string,
): T {
  if (value === null) {
    throw new PricingError(
      "malformed_promotion",
      `Promotion ${promotion.id} ("${promotion.name}") has discount_type "${promotion.discountType}" but no ${column}`,
    );
  }
  return value;
}

/**
 * The compounding core. Carries a `runningBalanceCents` starting at
 * `baseTotalCents`; each promotion is computed against that balance, never
 * against the original total, so 10% then 10% is 19% rather than 20%.
 *
 * Every selected promotion gets a step, including one worth zero cents: "it
 * applied and was worth nothing" is information, not noise.
 */
export function calculateSequentialDiscounts(
  baseTotalCents: Cents,
  nights: readonly NightRate[],
  selectedPromotions: readonly PromotionRule[],
): SequentialDiscountResult {
  const steps: DiscountStep[] = [];
  let runningBalanceCents = baseTotalCents;

  selectedPromotions.forEach((promotion, stepIndex) => {
    const balanceBeforeCents = runningBalanceCents;
    const discountCents = clampCents(
      discountFor(promotion, nights, balanceBeforeCents, baseTotalCents),
      0,
      balanceBeforeCents,
    );
    runningBalanceCents = balanceBeforeCents - discountCents;

    steps.push({
      stepIndex,
      promotionId: promotion.id,
      promotionName: promotion.name,
      discountType: promotion.discountType,
      balanceBeforeCents,
      discountCents,
      balanceAfterCents: runningBalanceCents,
    });
  });

  return {
    steps,
    totalDiscountCents: baseTotalCents - runningBalanceCents,
    finalTotalCents: runningBalanceCents,
  };
}

/**
 * The minimum stay comes from the **check-in night's** `minStay`, falling back
 * to the villa default. That is the industry standard and it stops one
 * expensive mid-stay night from dictating the length of the whole booking.
 */
export function resolveMinStay(input: PricingInput): number {
  const checkInNight = input.nights.find(
    (night) => night.date === input.checkIn,
  );
  return checkInNight?.minStay ?? input.defaultMinStay;
}

/**
 * When applicable promotions carry `overrideMinNights`, the guest may book
 * fewer nights than the calendar/default minimum.
 */
export function resolveEffectiveMinStay(input: PricingInput): number {
  const base = resolveMinStay(input);
  const applicable = selectApplicablePromotions(input.promotions, input);
  let effective = base;
  for (const promotion of applicable) {
    if (promotion.overrideMinNights !== null) {
      effective = Math.min(effective, promotion.overrideMinNights);
    }
  }
  return effective;
}

export function validateStay(input: PricingInput): StayValidation {
  const { checkIn, checkOut, context } = input;
  const errors: StayValidationError[] = [];

  if (!isBefore(checkIn, checkOut)) {
    // Nothing below this is meaningful without a real interval.
    return {
      valid: false,
      errors: [
        {
          code: "invalid_date_range",
          message: `checkOut (${checkOut}) must be after checkIn (${checkIn})`,
        },
      ],
    };
  }

  const expectedNights = enumerateNights(checkIn, checkOut);
  const byDate = new Map<DateString, NightRate>(
    input.nights.map((night) => [night.date, night]),
  );

  for (const date of expectedNights) {
    const night = byDate.get(date);
    if (night === undefined) {
      errors.push({
        code: "calendar_gap",
        date,
        message: `No calendar rate for ${date}`,
      });
      continue;
    }
    if (night.isBlocked) {
      errors.push({
        code: "blocked_night",
        date,
        message: `${date} is not available`,
      });
    }
  }

  if (input.nights.length > expectedNights.length) {
    errors.push({
      code: "calendar_gap",
      message: `Received ${input.nights.length} nights for a ${expectedNights.length}-night stay`,
    });
  }

  const stayNights =
    input.nights.length === expectedNights.length
      ? input.nights
      : expectedNights.map((date) => {
          const night = byDate.get(date);
          if (night === undefined) {
            return {
              date,
              priceCents: 0 as Cents,
              minStay: null,
              isBlocked: true,
            };
          }
          return night;
        });

  const minStay = resolveEffectiveMinStay({ ...input, nights: stayNights });
  if (expectedNights.length < minStay) {
    errors.push({
      code: "min_stay_not_met",
      date: checkIn,
      message: `${checkIn} requires a minimum stay of ${minStay} nights, requested ${expectedNights.length}`,
    });
  }

  if (!Number.isInteger(context.guestCount) || context.guestCount < 1) {
    errors.push({
      code: "invalid_guest_count",
      message: `guestCount must be a positive integer, received ${context.guestCount}`,
    });
  } else if (context.guestCount > input.capacity) {
    errors.push({
      code: "capacity_exceeded",
      message: `Villa ${input.villaId} sleeps ${input.capacity}, requested ${context.guestCount}`,
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * The single public entry point. Throws `PricingError("invalid_stay")` rather
 * than returning a priced quote for a stay nobody can book.
 */
export function calculateQuote(input: PricingInput): PriceQuote {
  const validation = validateStay(input);
  if (!validation.valid) {
    throw new PricingError(
      "invalid_stay",
      `Cannot price villa ${input.villaId} for ${input.checkIn}..${input.checkOut}: ${validation.errors
        .map((error) => error.message)
        .join("; ")}`,
      validation.errors,
    );
  }

  const nightCount = input.nights.length;
  const baseTotalCents = calculateBaseTotal(input.nights);
  const selected = selectApplicablePromotions(input.promotions, input);
  const { steps, totalDiscountCents } = calculateSequentialDiscounts(
    baseTotalCents,
    input.nights,
    selected,
  );

  const nightlyTotalCents = baseTotalCents - totalDiscountCents;

  const appliedPromotions: AppliedPromotion[] = steps.map((step) => ({
    stepIndex: step.stepIndex,
    promotionId: step.promotionId,
    displayName: selected[step.stepIndex].displayName,
    discountType: step.discountType,
    discountCents: step.discountCents,
  }));

  const quote: PriceQuote = {
    nightCount,
    baseTotalCents,
    discountSteps: steps,
    totalDiscountCents,
    nightlyTotalCents,
    cleaningFeeCents: input.cleaningFeeCents,
    depositCents: input.depositCents,
    // The cleaning fee is added once, after the chain, and is never discounted.
    grandTotalCents: nightlyTotalCents + input.cleaningFeeCents,
    avgNightlyCents:
      nightCount === 0 ? 0 : Math.round(nightlyTotalCents / nightCount),
    appliedPromotions,
    engineVersion: PRICING_ENGINE_VERSION,
  };

  assertQuoteInvariants(quote);
  return quote;
}

/**
 * Fails loudly in development and test, and is a no-op in production: a guest
 * mid-checkout should not see a 500 because the average nightly rate rounded
 * oddly, but a developer should never get past a broken chain.
 */
export function assertQuoteInvariants(quote: PriceQuote): void {
  if (process.env.NODE_ENV === "production") return;

  const assert = (condition: boolean, message: string): void => {
    if (!condition) {
      throw new PricingError("invariant_violation", `Quote invariant: ${message}`);
    }
  };

  assert(
    quote.baseTotalCents - quote.totalDiscountCents === quote.nightlyTotalCents,
    `baseTotal ${quote.baseTotalCents} - totalDiscount ${quote.totalDiscountCents} !== nightlyTotal ${quote.nightlyTotalCents}`,
  );
  assert(
    quote.nightlyTotalCents >= 0,
    `nightlyTotal ${quote.nightlyTotalCents} is negative`,
  );

  const steppedDiscountCents = sumCents(
    quote.discountSteps.map((step) => step.discountCents),
  );
  assert(
    steppedDiscountCents === quote.totalDiscountCents,
    `steps sum to ${steppedDiscountCents}, totalDiscount is ${quote.totalDiscountCents}`,
  );

  quote.discountSteps.forEach((step, index) => {
    assert(
      step.stepIndex === index,
      `step at position ${index} reports stepIndex ${step.stepIndex}`,
    );
    assert(
      step.balanceAfterCents === step.balanceBeforeCents - step.discountCents,
      `step ${index}: ${step.balanceBeforeCents} - ${step.discountCents} !== ${step.balanceAfterCents}`,
    );
    const expectedBefore =
      index === 0
        ? quote.baseTotalCents
        : quote.discountSteps[index - 1].balanceAfterCents;
    assert(
      step.balanceBeforeCents === expectedBefore,
      `step ${index} starts at ${step.balanceBeforeCents}, expected ${expectedBefore}`,
    );
  });

  // The cleaning fee never enters the chain: it is not part of any step's
  // balance and not part of the nightly total.
  assert(
    quote.grandTotalCents === quote.nightlyTotalCents + quote.cleaningFeeCents,
    `grandTotal ${quote.grandTotalCents} !== nightlyTotal ${quote.nightlyTotalCents} + cleaningFee ${quote.cleaningFeeCents}`,
  );
  assert(
    quote.discountSteps.every(
      (step) => step.balanceBeforeCents <= quote.baseTotalCents,
    ),
    "a discount step was computed on a balance larger than the base total",
  );
}
