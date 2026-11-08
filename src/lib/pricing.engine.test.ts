import { describe, expect, it, vi } from "vitest";

import { addDays, type DateString } from "@/lib/dates";
import {
  applyFixedAmountDiscount,
  applyFreeDaysDiscount,
  applyPercentageDiscount,
  assertQuoteInvariants,
  calculateBaseTotal,
  calculateQuote,
  calculateSequentialDiscounts,
  isPromotionEligible,
  PricingError,
  resolveMinStay,
  selectApplicablePromotions,
  validateStay,
} from "@/lib/pricing.engine";
import type {
  NightRate,
  PriceQuote,
  PricingContext,
  PricingInput,
  PromotionRule,
} from "@/lib/pricing.types";
import type { Cents } from "@/lib/money";

const CHECK_IN: DateString = "2026-07-01";
const BOOKED_AT: DateString = "2026-06-15";

function repeat(priceCents: Cents, count: number): Cents[] {
  return Array.from({ length: count }, () => priceCents);
}

function makeNights(
  prices: readonly Cents[],
  options: {
    start?: DateString;
    minStay?: number | null;
    blockedDates?: readonly DateString[];
    minStayByDate?: Readonly<Record<string, number>>;
  } = {},
): NightRate[] {
  const start = options.start ?? CHECK_IN;
  return prices.map((priceCents, index) => {
    const date = addDays(start, index);
    return {
      date,
      priceCents,
      minStay: options.minStayByDate?.[date] ?? options.minStay ?? null,
      isBlocked: options.blockedDates?.includes(date) ?? false,
    };
  });
}

function makeContext(overrides: Partial<PricingContext> = {}): PricingContext {
  return {
    today: BOOKED_AT,
    bookedAt: BOOKED_AT,
    guestCount: 4,
    couponCode: null,
    locale: "en",
    ...overrides,
  };
}

function makeInput(overrides: Partial<PricingInput> = {}): PricingInput {
  const nights = overrides.nights ?? makeNights(repeat(10_000, 7));
  const firstNight = nights[0]?.date ?? CHECK_IN;
  const lastNight = nights[nights.length - 1]?.date ?? CHECK_IN;

  const base: PricingInput = {
    villaId: 1,
    checkIn: firstNight,
    checkOut: addDays(lastNight, 1),
    nights,
    cleaningFeeCents: 0,
    depositCents: 0,
    defaultMinStay: 1,
    capacity: 8,
    promotions: [],
    context: makeContext(),
  };

  return { ...base, ...overrides, nights };
}

const PROMOTION_DEFAULTS: PromotionRule = {
  id: 1,
  name: "promo",
  displayName: "Promo",
  discountType: "percentage",
  triggerType: "always",
  percentBp: null,
  fixedAmountCents: null,
  freeNights: null,
  freeNightsThreshold: null,
  minNights: null,
  maxNights: null,
  overrideMinNights: null,
  lastMinuteWithinDays: null,
  earlyBirdMinDays: null,
  code: null,
  bookingWindowStart: null,
  bookingWindowEnd: null,
  travelWindowStart: null,
  travelWindowEnd: null,
  priorityOrder: 100,
  isStackable: true,
  isActive: true,
  maxRedemptions: null,
  redemptionCount: 0,
};

function percentagePromo(
  id: number,
  percentBp: number,
  overrides: Partial<PromotionRule> = {},
): PromotionRule {
  return {
    ...PROMOTION_DEFAULTS,
    id,
    name: `${percentBp / 100}% off`,
    displayName: `${percentBp / 100}% off`,
    discountType: "percentage",
    percentBp,
    ...overrides,
  };
}

function fixedPromo(
  id: number,
  fixedAmountCents: Cents,
  overrides: Partial<PromotionRule> = {},
): PromotionRule {
  return {
    ...PROMOTION_DEFAULTS,
    id,
    name: `${fixedAmountCents} cents off`,
    displayName: `${fixedAmountCents} cents off`,
    discountType: "fixed_amount",
    fixedAmountCents,
    ...overrides,
  };
}

/** Pay-6-stay-7 is `freeNights: 1`, `freeNightsThreshold: 7`. */
function freeDaysPromo(
  id: number,
  freeNights: number,
  freeNightsThreshold: number,
  overrides: Partial<PromotionRule> = {},
): PromotionRule {
  return {
    ...PROMOTION_DEFAULTS,
    id,
    name: `pay-${freeNightsThreshold - freeNights}-stay-${freeNightsThreshold}`,
    displayName: `${freeNights} night free`,
    discountType: "free_days",
    freeNights,
    freeNightsThreshold,
    ...overrides,
  };
}

describe("calculateBaseTotal", () => {
  it("sums the nightly rates and nothing else", () => {
    expect(calculateBaseTotal(makeNights(repeat(10_000, 7)))).toBe(70_000);
    expect(calculateBaseTotal(makeNights([12_345, 9_999, 1]))).toBe(22_345);
    expect(calculateBaseTotal([])).toBe(0);
  });
});

describe("discount primitives", () => {
  it("rounds a percentage half-up, exactly once", () => {
    expect(applyPercentageDiscount(70_000, 1_000)).toBe(7_000);
    expect(applyPercentageDiscount(70_007, 1_000)).toBe(7_001);
    expect(applyPercentageDiscount(5, 1_000)).toBe(1);
    expect(applyPercentageDiscount(70_000, 10_000)).toBe(70_000);
  });

  it("caps a fixed amount at the balance so the chain cannot go negative", () => {
    expect(applyFixedAmountDiscount(70_000, 7_500)).toBe(7_500);
    expect(applyFixedAmountDiscount(50_000, 80_000)).toBe(50_000);
    expect(applyFixedAmountDiscount(0, 80_000)).toBe(0);
  });

  it("values the cheapest nights, not the last ones", () => {
    const nights = makeNights([
      20_000, 20_000, 5_000, 20_000, 20_000, 20_000, 20_000,
    ]);
    const baseTotalCents = calculateBaseTotal(nights);
    expect(baseTotalCents).toBe(125_000);
    expect(applyFreeDaysDiscount(nights, 1, baseTotalCents, baseTotalCents)).toBe(
      5_000,
    );
    // Reversing the input must not change the answer.
    expect(
      applyFreeDaysDiscount([...nights].reverse(), 1, baseTotalCents, baseTotalCents),
    ).toBe(5_000);
  });

  it("scales a free night by the already-discounted balance", () => {
    const nights = makeNights([
      20_000, 20_000, 5_000, 20_000, 20_000, 20_000, 20_000,
    ]);
    // 10% already taken: 125_000 -> 112_500, so the free night is worth 90%.
    expect(applyFreeDaysDiscount(nights, 1, 112_500, 125_000)).toBe(4_500);
  });

  it("degrades safely on empty or zero inputs", () => {
    const nights = makeNights(repeat(10_000, 7));
    expect(applyFreeDaysDiscount(nights, 0, 70_000, 70_000)).toBe(0);
    expect(applyFreeDaysDiscount(nights, 1, 0, 70_000)).toBe(0);
    expect(applyFreeDaysDiscount([], 1, 70_000, 70_000)).toBe(0);
    expect(applyFreeDaysDiscount(nights, 1, 70_000, 0)).toBe(0);
  });

  it("never frees more nights than the stay has", () => {
    const nights = makeNights(repeat(10_000, 3));
    expect(applyFreeDaysDiscount(nights, 99, 30_000, 30_000)).toBe(30_000);
  });
});

describe("calculateQuote - single promotion", () => {
  it("applies a single percentage", () => {
    const quote = calculateQuote(
      makeInput({
        cleaningFeeCents: 5_000,
        promotions: [percentagePromo(1, 1_000)],
      }),
    );

    expect(quote.baseTotalCents).toBe(70_000);
    expect(quote.totalDiscountCents).toBe(7_000);
    expect(quote.nightlyTotalCents).toBe(63_000);
    expect(quote.grandTotalCents).toBe(68_000);
    expect(quote.avgNightlyCents).toBe(9_000);
    expect(quote.discountSteps).toHaveLength(1);
  });

  it("applies a single fixed amount", () => {
    const quote = calculateQuote(
      makeInput({ promotions: [fixedPromo(1, 7_500)] }),
    );

    expect(quote.totalDiscountCents).toBe(7_500);
    expect(quote.nightlyTotalCents).toBe(62_500);
  });

  it("clamps a fixed amount larger than the balance to zero, never negative", () => {
    const quote = calculateQuote(
      makeInput({
        cleaningFeeCents: 4_000,
        promotions: [fixedPromo(1, 100_000)],
      }),
    );

    expect(quote.totalDiscountCents).toBe(70_000);
    expect(quote.nightlyTotalCents).toBe(0);
    // Only the cleaning fee is left to pay.
    expect(quote.grandTotalCents).toBe(4_000);
  });

  it("prices an empty promotion list as the plain base total", () => {
    const quote = calculateQuote(makeInput({ cleaningFeeCents: 6_000 }));

    expect(quote.discountSteps).toEqual([]);
    expect(quote.appliedPromotions).toEqual([]);
    expect(quote.totalDiscountCents).toBe(0);
    expect(quote.nightlyTotalCents).toBe(70_000);
    expect(quote.grandTotalCents).toBe(76_000);
  });
});

describe("calculateQuote - sequential compounding", () => {
  it("compounds two percentages to 19%, not 20%", () => {
    const quote = calculateQuote(
      makeInput({
        promotions: [
          percentagePromo(1, 1_000, { priorityOrder: 10 }),
          percentagePromo(2, 1_000, { priorityOrder: 20 }),
        ],
      }),
    );

    expect(quote.discountSteps.map((step) => step.discountCents)).toEqual([
      7_000, 6_300,
    ]);
    expect(quote.totalDiscountCents).toBe(13_300);
    expect(quote.totalDiscountCents).not.toBe(14_000);
    expect(quote.nightlyTotalCents).toBe(56_700);
  });

  it("records each step against the running balance, not the base total", () => {
    const quote = calculateQuote(
      makeInput({
        promotions: [
          percentagePromo(1, 1_000, { priorityOrder: 10 }),
          percentagePromo(2, 1_000, { priorityOrder: 20 }),
        ],
      }),
    );

    expect(quote.discountSteps[0]).toMatchObject({
      stepIndex: 0,
      balanceBeforeCents: 70_000,
      discountCents: 7_000,
      balanceAfterCents: 63_000,
    });
    expect(quote.discountSteps[1]).toMatchObject({
      stepIndex: 1,
      balanceBeforeCents: 63_000,
      discountCents: 6_300,
      balanceAfterCents: 56_700,
    });
  });

  it("makes priority_order change the total: percentage then fixed differs from fixed then percentage", () => {
    const percentageFirst = calculateQuote(
      makeInput({
        promotions: [
          percentagePromo(1, 1_000, { priorityOrder: 10 }),
          fixedPromo(2, 10_000, { priorityOrder: 20 }),
        ],
      }),
    );
    const fixedFirst = calculateQuote(
      makeInput({
        promotions: [
          percentagePromo(1, 1_000, { priorityOrder: 20 }),
          fixedPromo(2, 10_000, { priorityOrder: 10 }),
        ],
      }),
    );

    // 10% of 70_000 = 7_000, then a flat 10_000 off 63_000.
    expect(percentageFirst.totalDiscountCents).toBe(17_000);
    expect(percentageFirst.nightlyTotalCents).toBe(53_000);

    // 10_000 off first, then 10% of the smaller 60_000 balance.
    expect(fixedFirst.totalDiscountCents).toBe(16_000);
    expect(fixedFirst.nightlyTotalCents).toBe(54_000);

    expect(percentageFirst.nightlyTotalCents).not.toBe(
      fixedFirst.nightlyTotalCents,
    );
  });

  it("keeps the step log in sync with the total for a zero-value step", () => {
    const quote = calculateQuote(
      makeInput({
        promotions: [
          fixedPromo(1, 100_000, { priorityOrder: 10 }),
          percentagePromo(2, 1_000, { priorityOrder: 20 }),
        ],
      }),
    );

    expect(quote.nightlyTotalCents).toBe(0);
    expect(quote.discountSteps).toHaveLength(2);
    expect(quote.discountSteps[1]).toMatchObject({
      balanceBeforeCents: 0,
      discountCents: 0,
      balanceAfterCents: 0,
    });
  });
});

describe("calculateQuote - free days", () => {
  it("prices pay-6-stay-7 on its own", () => {
    const quote = calculateQuote(
      makeInput({ promotions: [freeDaysPromo(1, 1, 7)] }),
    );

    expect(quote.totalDiscountCents).toBe(10_000);
    expect(quote.nightlyTotalCents).toBe(60_000);
    expect(quote.avgNightlyCents).toBe(8_571);
  });

  it("combines pay-6-stay-7 with a percentage identically in both orders", () => {
    const freeNightFirst = calculateQuote(
      makeInput({
        promotions: [
          freeDaysPromo(1, 1, 7, { priorityOrder: 10 }),
          percentagePromo(2, 1_000, { priorityOrder: 20 }),
        ],
      }),
    );
    const percentageFirst = calculateQuote(
      makeInput({
        promotions: [
          freeDaysPromo(1, 1, 7, { priorityOrder: 20 }),
          percentagePromo(2, 1_000, { priorityOrder: 10 }),
        ],
      }),
    );

    // The scaling factor is exactly what makes this pair commutative: the free
    // night is worth the discounted night, so neither order is a double-dip.
    expect(freeNightFirst.nightlyTotalCents).toBe(54_000);
    expect(percentageFirst.nightlyTotalCents).toBe(54_000);

    // Same total, different audit trail.
    expect(freeNightFirst.discountSteps.map((s) => s.discountCents)).toEqual([
      10_000, 6_000,
    ]);
    expect(percentageFirst.discountSteps.map((s) => s.discountCents)).toEqual([
      7_000, 9_000,
    ]);
  });

  it("skips a free-days promotion below its threshold", () => {
    const input = makeInput({
      nights: makeNights(repeat(10_000, 3)),
      promotions: [freeDaysPromo(1, 1, 7)],
    });

    expect(isPromotionEligible(input.promotions[0], input)).toEqual({
      eligible: false,
      reason: "free_nights_threshold_not_met",
    });
    expect(calculateQuote(input).totalDiscountCents).toBe(0);
  });
});

describe("selectApplicablePromotions", () => {
  it("lets a non-stackable promotion beat a stackable one", () => {
    const exclusive = percentagePromo(1, 2_000, {
      priorityOrder: 10,
      isStackable: false,
    });
    const stackable = percentagePromo(2, 1_000, { priorityOrder: 20 });
    const input = makeInput({ promotions: [stackable, exclusive] });

    expect(selectApplicablePromotions(input.promotions, input)).toEqual([
      exclusive,
    ]);

    const quote = calculateQuote(input);
    expect(quote.discountSteps).toHaveLength(1);
    expect(quote.totalDiscountCents).toBe(14_000);
    expect(quote.nightlyTotalCents).toBe(56_000);
  });

  it("skips a non-stackable promotion that is not first in the chain", () => {
    const stackable = percentagePromo(1, 1_000, { priorityOrder: 10 });
    const exclusive = percentagePromo(2, 2_000, {
      priorityOrder: 20,
      isStackable: false,
    });
    const input = makeInput({ promotions: [stackable, exclusive] });

    expect(selectApplicablePromotions(input.promotions, input)).toEqual([
      stackable,
    ]);
    expect(calculateQuote(input).nightlyTotalCents).toBe(63_000);
  });

  it("orders by priority and breaks ties on id for determinism", () => {
    const input = makeInput({
      promotions: [
        percentagePromo(9, 1_000, { priorityOrder: 50 }),
        percentagePromo(3, 1_000, { priorityOrder: 50 }),
        percentagePromo(7, 1_000, { priorityOrder: 10 }),
      ],
    });

    expect(
      selectApplicablePromotions(input.promotions, input).map((p) => p.id),
    ).toEqual([7, 3, 9]);
  });

  it("does not mutate the promotion array it was given", () => {
    const promotions = [
      percentagePromo(2, 1_000, { priorityOrder: 50 }),
      percentagePromo(1, 1_000, { priorityOrder: 10 }),
    ];
    const input = makeInput({ promotions });

    selectApplicablePromotions(promotions, input);
    expect(promotions.map((p) => p.id)).toEqual([2, 1]);
  });

  it("drops ineligible promotions", () => {
    const input = makeInput({
      promotions: [
        percentagePromo(1, 1_000, { isActive: false }),
        percentagePromo(2, 1_000, { maxRedemptions: 5, redemptionCount: 5 }),
      ],
    });

    expect(selectApplicablePromotions(input.promotions, input)).toEqual([]);
  });
});

describe("isPromotionEligible", () => {
  it("rejects an inactive promotion", () => {
    const input = makeInput();
    expect(
      isPromotionEligible(percentagePromo(1, 1_000, { isActive: false }), input),
    ).toEqual({ eligible: false, reason: "inactive" });
  });

  it("rejects an exhausted promotion", () => {
    const input = makeInput();
    expect(
      isPromotionEligible(
        percentagePromo(1, 1_000, { maxRedemptions: 3, redemptionCount: 3 }),
        input,
      ),
    ).toEqual({ eligible: false, reason: "redemptions_exhausted" });
    expect(
      isPromotionEligible(
        percentagePromo(1, 1_000, { maxRedemptions: 3, redemptionCount: 2 }),
        input,
      ).eligible,
    ).toBe(true);
  });

  it("rejects an expired booking window even when the travel window is valid", () => {
    const input = makeInput({
      promotions: [
        percentagePromo(1, 1_000, {
          bookingWindowStart: "2026-01-01",
          bookingWindowEnd: "2026-01-31",
          travelWindowStart: "2026-07-01",
          travelWindowEnd: "2026-07-31",
        }),
      ],
    });

    // Booked 2026-06-15 for a stay that sits squarely inside the travel window.
    expect(isPromotionEligible(input.promotions[0], input)).toEqual({
      eligible: false,
      reason: "booking_window_closed",
    });
    expect(calculateQuote(input).totalDiscountCents).toBe(0);
  });

  it("rejects a booking made before the window opens", () => {
    const input = makeInput();
    expect(
      isPromotionEligible(
        percentagePromo(1, 1_000, { bookingWindowStart: "2026-06-16" }),
        input,
      ),
    ).toEqual({ eligible: false, reason: "booking_window_closed" });
    expect(
      isPromotionEligible(
        percentagePromo(1, 1_000, { bookingWindowStart: "2026-06-15" }),
        input,
      ).eligible,
    ).toBe(true);
  });

  it("matches the travel window against the last night, not the checkout date", () => {
    // Stay is 2026-07-01..2026-07-08, so the last night is 2026-07-07.
    const input = makeInput();

    expect(
      isPromotionEligible(
        percentagePromo(1, 1_000, { travelWindowEnd: "2026-07-07" }),
        input,
      ).eligible,
    ).toBe(true);
    expect(
      isPromotionEligible(
        percentagePromo(1, 1_000, { travelWindowEnd: "2026-07-06" }),
        input,
      ),
    ).toEqual({ eligible: false, reason: "travel_window_mismatch" });
    expect(
      isPromotionEligible(
        percentagePromo(1, 1_000, { travelWindowStart: "2026-07-02" }),
        input,
      ),
    ).toEqual({ eligible: false, reason: "travel_window_mismatch" });
  });

  it("gates long_stay on min_nights and max_nights", () => {
    const sevenNights = makeInput();
    const promo = percentagePromo(1, 1_000, {
      triggerType: "long_stay",
      minNights: 7,
      maxNights: 14,
    });

    expect(isPromotionEligible(promo, sevenNights).eligible).toBe(true);
    expect(
      isPromotionEligible(
        promo,
        makeInput({ nights: makeNights(repeat(10_000, 6)) }),
      ),
    ).toEqual({ eligible: false, reason: "min_nights_not_met" });
    expect(
      isPromotionEligible(
        promo,
        makeInput({ nights: makeNights(repeat(10_000, 15)) }),
      ),
    ).toEqual({ eligible: false, reason: "max_nights_exceeded" });
  });

  it.each([
    [6, true],
    [7, true],
    [8, false],
  ])(
    "treats a last_minute window of 7 days as inclusive: %i days out -> %s",
    (leadDays, expected) => {
      const input = makeInput({
        context: makeContext({ today: addDays(CHECK_IN, -leadDays) }),
      });
      const promo = percentagePromo(1, 1_000, {
        triggerType: "last_minute",
        lastMinuteWithinDays: 7,
      });

      expect(isPromotionEligible(promo, input).eligible).toBe(expected);
    },
  );

  it.each([
    [59, false],
    [60, true],
    [61, true],
  ])(
    "treats an early_bird minimum of 60 days as inclusive: %i days out -> %s",
    (leadDays, expected) => {
      const input = makeInput({
        context: makeContext({ today: addDays(CHECK_IN, -leadDays) }),
      });
      const promo = percentagePromo(1, 1_000, {
        triggerType: "early_bird",
        earlyBirdMinDays: 60,
      });

      expect(isPromotionEligible(promo, input).eligible).toBe(expected);
    },
  );

  it("rejects a coupon with the wrong code and accepts the right one", () => {
    const promo = percentagePromo(1, 1_500, {
      triggerType: "coupon",
      code: "SUMMER10",
    });

    const wrong = makeInput({
      promotions: [promo],
      context: makeContext({ couponCode: "WINTER10" }),
    });
    expect(isPromotionEligible(promo, wrong)).toEqual({
      eligible: false,
      reason: "coupon_mismatch",
    });
    expect(calculateQuote(wrong).totalDiscountCents).toBe(0);

    const missing = makeInput({ promotions: [promo] });
    expect(isPromotionEligible(promo, missing).eligible).toBe(false);

    // Case- and whitespace-insensitive, because guests paste codes.
    const right = makeInput({
      promotions: [promo],
      context: makeContext({ couponCode: "  summer10 " }),
    });
    expect(isPromotionEligible(promo, right).eligible).toBe(true);
    expect(calculateQuote(right).totalDiscountCents).toBe(10_500);
  });

  it("treats exit_intent codes the same way as coupons", () => {
    const promo = percentagePromo(1, 500, {
      triggerType: "exit_intent",
      code: "STAY5",
    });
    const input = makeInput({
      promotions: [promo],
      context: makeContext({ couponCode: "stay5" }),
    });

    expect(isPromotionEligible(promo, input).eligible).toBe(true);
  });

  it("throws on a promotion whose trigger column is null", () => {
    const input = makeInput();
    const malformed = percentagePromo(1, 1_000, { triggerType: "long_stay" });

    expect(() => isPromotionEligible(malformed, input)).toThrow(PricingError);
    expect(() => isPromotionEligible(malformed, input)).toThrow(/min_nights/);
  });

  it("throws on a promotion whose discount value is null", () => {
    const input = makeInput({
      promotions: [{ ...PROMOTION_DEFAULTS, discountType: "percentage" }],
    });

    expect(() => calculateQuote(input)).toThrow(PricingError);
    expect(() => calculateQuote(input)).toThrow(/percent_bp/);
  });
});

describe("validateStay", () => {
  it("accepts a clean stay", () => {
    expect(validateStay(makeInput())).toEqual({ valid: true, errors: [] });
  });

  it("rejects a checkout on or before check-in", () => {
    const result = validateStay(
      makeInput({ checkIn: CHECK_IN, checkOut: CHECK_IN }),
    );

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual([
      "invalid_date_range",
    ]);
  });

  it("takes min stay from the check-in night, not the most expensive night", () => {
    const midStayRestriction = makeInput({
      nights: makeNights(repeat(10_000, 3), {
        minStayByDate: { [CHECK_IN]: 2, [addDays(CHECK_IN, 1)]: 14 },
      }),
    });

    expect(resolveMinStay(midStayRestriction)).toBe(2);
    expect(validateStay(midStayRestriction).valid).toBe(true);
  });

  it("rejects a stay shorter than the check-in night's min stay", () => {
    const input = makeInput({
      nights: makeNights(repeat(10_000, 3), {
        minStayByDate: { [CHECK_IN]: 5 },
      }),
    });
    const result = validateStay(input);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatchObject({
      code: "min_stay_not_met",
      date: CHECK_IN,
    });
    expect(() => calculateQuote(input)).toThrow(PricingError);
  });

  it("falls back to the villa default min stay", () => {
    const input = makeInput({
      nights: makeNights(repeat(10_000, 2)),
      defaultMinStay: 4,
    });

    expect(resolveMinStay(input)).toBe(4);
    expect(validateStay(input).valid).toBe(false);
  });

  it("rejects a blocked night inside the range", () => {
    const blockedDate = addDays(CHECK_IN, 3);
    const input = makeInput({
      nights: makeNights(repeat(10_000, 7), { blockedDates: [blockedDate] }),
    });
    const result = validateStay(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      {
        code: "blocked_night",
        date: blockedDate,
        message: `${blockedDate} is not available`,
      },
    ]);

    expect(() => calculateQuote(input)).toThrow(PricingError);
    try {
      calculateQuote(input);
    } catch (error) {
      expect(error).toBeInstanceOf(PricingError);
      expect((error as PricingError).code).toBe("invalid_stay");
    }
  });

  it("rejects a gap in the night list", () => {
    const nights = makeNights(repeat(10_000, 7));
    const missing = nights[4];
    const input = makeInput({
      nights: nights.filter((night) => night.date !== missing.date),
      checkIn: CHECK_IN,
      checkOut: addDays(CHECK_IN, 7),
    });
    const result = validateStay(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      {
        code: "calendar_gap",
        date: missing.date,
        message: `No calendar rate for ${missing.date}`,
      },
    ]);
  });

  it("rejects more nights than the interval holds", () => {
    const input = makeInput({
      nights: makeNights(repeat(10_000, 7)),
      checkIn: CHECK_IN,
      checkOut: addDays(CHECK_IN, 5),
    });

    expect(validateStay(input).errors).toEqual([
      {
        code: "calendar_gap",
        message: "Received 7 nights for a 5-night stay",
      },
    ]);
  });

  it("rejects a guest count above capacity", () => {
    const result = validateStay(
      makeInput({ capacity: 4, context: makeContext({ guestCount: 5 }) }),
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("capacity_exceeded");
    expect(
      validateStay(
        makeInput({ capacity: 4, context: makeContext({ guestCount: 4 }) }),
      ).valid,
    ).toBe(true);
  });

  it("rejects a nonsensical guest count", () => {
    expect(
      validateStay(makeInput({ context: makeContext({ guestCount: 0 }) }))
        .errors[0].code,
    ).toBe("invalid_guest_count");
    expect(
      validateStay(makeInput({ context: makeContext({ guestCount: 2.5 }) }))
        .errors[0].code,
    ).toBe("invalid_guest_count");
  });

  it("reports every problem at once", () => {
    const input = makeInput({
      nights: makeNights(repeat(10_000, 2), {
        blockedDates: [CHECK_IN],
        minStayByDate: { [CHECK_IN]: 7 },
      }),
      capacity: 2,
      context: makeContext({ guestCount: 6 }),
    });

    expect(validateStay(input).errors.map((error) => error.code)).toEqual([
      "blocked_night",
      "min_stay_not_met",
      "capacity_exceeded",
    ]);
  });
});

describe("rounding", () => {
  it("stays cent-exact compounding two percentages over a 7-night odd-cent stay", () => {
    const quote = calculateQuote(
      makeInput({
        nights: makeNights(repeat(10_001, 7)),
        promotions: [
          percentagePromo(1, 1_000, { priorityOrder: 10 }),
          percentagePromo(2, 1_000, { priorityOrder: 20 }),
        ],
      }),
    );

    expect(quote.baseTotalCents).toBe(70_007);
    expect(quote.discountSteps.map((step) => step.discountCents)).toEqual([
      7_001, 6_301,
    ]);
    expect(quote.totalDiscountCents).toBe(13_302);
    expect(quote.nightlyTotalCents).toBe(56_705);
    // The average is a display value and does not multiply back to the total.
    expect(quote.avgNightlyCents).toBe(8_101);
    expect(quote.avgNightlyCents * quote.nightCount).not.toBe(
      quote.nightlyTotalCents,
    );
  });

  it("keeps every amount an integer across a messy chain", () => {
    const quote = calculateQuote(
      makeInput({
        nights: makeNights([13_333, 9_997, 10_001, 7_777, 12_345, 1, 99_999]),
        cleaningFeeCents: 4_567,
        depositCents: 25_000,
        promotions: [
          percentagePromo(1, 1_337, { priorityOrder: 10 }),
          freeDaysPromo(2, 2, 7, { priorityOrder: 20 }),
          fixedPromo(3, 3_333, { priorityOrder: 30 }),
        ],
      }),
    );

    const amounts = [
      quote.baseTotalCents,
      quote.totalDiscountCents,
      quote.nightlyTotalCents,
      quote.grandTotalCents,
      quote.avgNightlyCents,
      ...quote.discountSteps.flatMap((step) => [
        step.balanceBeforeCents,
        step.discountCents,
        step.balanceAfterCents,
      ]),
    ];

    for (const amount of amounts) {
      expect(Number.isInteger(amount)).toBe(true);
    }
  });
});

describe("fees and deposits", () => {
  it("never discounts the cleaning fee and never puts it in the chain", () => {
    const quote = calculateQuote(
      makeInput({
        cleaningFeeCents: 12_345,
        promotions: [percentagePromo(1, 1_000)],
      }),
    );

    expect(quote.nightlyTotalCents).toBe(63_000);
    expect(quote.cleaningFeeCents).toBe(12_345);
    expect(quote.grandTotalCents).toBe(75_345);
    for (const step of quote.discountSteps) {
      expect(step.balanceBeforeCents).toBeLessThanOrEqual(quote.baseTotalCents);
    }
  });

  it("reports the deposit without adding it to the grand total", () => {
    const quote = calculateQuote(
      makeInput({ cleaningFeeCents: 5_000, depositCents: 50_000 }),
    );

    expect(quote.depositCents).toBe(50_000);
    expect(quote.grandTotalCents).toBe(75_000);
  });
});

describe("quote metadata", () => {
  it("mirrors the chain into appliedPromotions for booking_promotions", () => {
    const quote = calculateQuote(
      makeInput({
        promotions: [
          percentagePromo(1, 1_000, { priorityOrder: 10 }),
          freeDaysPromo(2, 1, 7, { priorityOrder: 20 }),
        ],
      }),
    );

    expect(quote.appliedPromotions).toEqual([
      {
        stepIndex: 0,
        promotionId: 1,
        displayName: "10% off",
        discountType: "percentage",
        discountCents: 7_000,
      },
      {
        stepIndex: 1,
        promotionId: 2,
        displayName: "1 night free",
        discountType: "free_days",
        discountCents: 9_000,
      },
    ]);
  });

  it("stamps the engine version so a frozen breakdown stays readable", () => {
    expect(calculateQuote(makeInput()).engineVersion).toBe("1.0.0");
  });
});

describe("assertQuoteInvariants", () => {
  const validQuote = (): PriceQuote => calculateQuote(makeInput({
    cleaningFeeCents: 5_000,
    promotions: [percentagePromo(1, 1_000)],
  }));

  it("passes a quote the engine produced", () => {
    expect(() => assertQuoteInvariants(validQuote())).not.toThrow();
  });

  it("catches a nightly total that does not match the discount", () => {
    expect(() =>
      assertQuoteInvariants({ ...validQuote(), nightlyTotalCents: 62_999 }),
    ).toThrow(/nightlyTotal/);
  });

  it("catches a step log that does not sum to the total discount", () => {
    expect(() =>
      assertQuoteInvariants({ ...validQuote(), totalDiscountCents: 6_999 }),
    ).toThrow(PricingError);
  });

  it("catches a step whose balances do not reconcile", () => {
    const quote = validQuote();
    expect(() =>
      assertQuoteInvariants({
        ...quote,
        discountSteps: [
          { ...quote.discountSteps[0], balanceAfterCents: 60_000 },
        ],
      }),
    ).toThrow(/!==/);
  });

  it("catches a cleaning fee that leaked into the grand total twice", () => {
    const quote = validQuote();
    expect(() =>
      assertQuoteInvariants({ ...quote, grandTotalCents: 73_000 }),
    ).toThrow(/grandTotal/);
  });

  it("is a no-op in production so a guest mid-checkout never sees a 500", () => {
    vi.stubEnv("NODE_ENV", "production");
    try {
      expect(() =>
        assertQuoteInvariants({ ...validQuote(), nightlyTotalCents: -1 }),
      ).not.toThrow();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("catches a negative nightly total", () => {
    expect(() =>
      assertQuoteInvariants({
        nightCount: 1,
        baseTotalCents: 10_000,
        discountSteps: [],
        totalDiscountCents: 20_000,
        nightlyTotalCents: -10_000,
        cleaningFeeCents: 0,
        depositCents: 0,
        grandTotalCents: -10_000,
        avgNightlyCents: -10_000,
        appliedPromotions: [],
        engineVersion: "1.0.0",
      }),
    ).toThrow(/negative/);
  });
});

describe("calculateSequentialDiscounts", () => {
  it("returns an empty chain for no promotions", () => {
    expect(
      calculateSequentialDiscounts(70_000, makeNights(repeat(10_000, 7)), []),
    ).toEqual({ steps: [], totalDiscountCents: 0, finalTotalCents: 70_000 });
  });

  it("is callable without a full PricingInput, as the cron needs", () => {
    const nights = makeNights(repeat(10_000, 7));
    const result = calculateSequentialDiscounts(70_000, nights, [
      percentagePromo(1, 2_500),
    ]);

    expect(result.totalDiscountCents).toBe(17_500);
    expect(result.finalTotalCents).toBe(52_500);
  });
});
