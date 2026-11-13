/**
 * Input and output shapes for the pricing engine.
 *
 * Everything the engine needs arrives fully materialized here, which is what
 * lets `pricing.engine.ts` stay a pure module with zero DB imports. The only
 * imports below are `import type`, so they are erased at compile time and add
 * no runtime coupling to Drizzle.
 */
import type { DiscountType, PromotionTrigger } from "@/db/tables/enums";
import type { DateString } from "@/lib/dates";
import type { Locale } from "@/lib/locales";
import type { Cents } from "@/lib/money";

/** Bumped whenever the math changes, so a frozen `price_breakdown` stays readable. */
export const PRICING_ENGINE_VERSION = "1.0.0";

/**
 * Integer form of the version, for `villa_price_cache.engine_version` (an `int`
 * column). Bumping this is what forces the cron to recompute every cached row.
 */
export const PRICING_ENGINE_VERSION_ID = 1;

/**
 * One night of a stay. A night is named by the date it starts on, so a stay of
 * `[checkIn, checkOut)` has exactly `diffInNights(checkIn, checkOut)` entries
 * and the checkout date is never one of them.
 */
export type NightRate = {
  date: DateString;
  priceCents: Cents;
  /** Calendar override; `null` falls back to `PricingInput.defaultMinStay`. */
  minStay: number | null;
  isBlocked: boolean;
};

/**
 * A flattened `promotions` row. `displayName` is already localized by the query
 * layer so the engine never has to know about i18n.
 */
export type PromotionRule = {
  id: number;
  name: string;
  displayName: string;

  discountType: DiscountType;
  triggerType: PromotionTrigger;

  percentBp: number | null;
  fixedAmountCents: Cents | null;
  freeNights: number | null;
  freeNightsThreshold: number | null;

  minNights: number | null;
  maxNights: number | null;
  /** Lowers effective min stay when this promotion applies (`validateStay`). */
  overrideMinNights: number | null;
  lastMinuteWithinDays: number | null;
  earlyBirdMinDays: number | null;
  code: string | null;

  bookingWindowStart: DateString | null;
  bookingWindowEnd: DateString | null;
  travelWindowStart: DateString | null;
  travelWindowEnd: DateString | null;

  /** Lower runs first in the sequential chain. */
  priorityOrder: number;
  /** False means exclusive: if this one is selected, nothing else applies. */
  isStackable: boolean;

  isActive: boolean;
  maxRedemptions: number | null;
  redemptionCount: number;
};

export type PricingContext = {
  /** Business-timezone today, from `getBusinessToday()` - never `new Date()`. */
  today: DateString;
  /** When the booking is being made; gates `booking_window_*`. */
  bookedAt: DateString;
  guestCount: number;
  couponCode: string | null;
  locale: Locale;
};

export type PricingInput = {
  villaId: number;
  checkIn: DateString;
  checkOut: DateString;
  nights: readonly NightRate[];
  cleaningFeeCents: Cents;
  depositCents: Cents;
  defaultMinStay: number;
  /** Villa `capacity`; `validateStay` rejects a larger `guestCount`. */
  capacity: number;
  promotions: readonly PromotionRule[];
  /**
   * Global agency commission, in basis points. A `commission_waiver` promotion
   * with no `percentBp` of its own discounts by exactly this. Optional so every
   * existing call site keeps working; omitting it uses
   * `DEFAULT_COMMISSION_RATE_BP`.
   */
  commissionRateBp?: number;
  context: PricingContext;
};

export type IneligibilityReason =
  | "inactive"
  | "booking_window_closed"
  | "travel_window_mismatch"
  | "redemptions_exhausted"
  | "free_nights_threshold_not_met"
  | "min_nights_not_met"
  | "max_nights_exceeded"
  | "not_last_minute"
  | "not_early_bird"
  | "coupon_mismatch";

export type EligibilityResult =
  | { eligible: true; reason: null }
  | { eligible: false; reason: IneligibilityReason };

export type StayErrorCode =
  | "invalid_date_range"
  | "calendar_gap"
  | "blocked_night"
  | "min_stay_not_met"
  | "invalid_guest_count"
  | "capacity_exceeded";

export type StayValidationError = {
  code: StayErrorCode;
  message: string;
  date?: DateString;
};

export type StayValidation = {
  valid: boolean;
  errors: StayValidationError[];
};

/**
 * One link in the compounding chain. `balanceBeforeCents - discountCents`
 * always equals `balanceAfterCents`; that is the audit trail that makes a wrong
 * total diagnosable without re-running the engine.
 */
export type DiscountStep = {
  stepIndex: number;
  promotionId: number;
  promotionName: string;
  discountType: DiscountType;
  balanceBeforeCents: Cents;
  discountCents: Cents;
  balanceAfterCents: Cents;
};

export type SequentialDiscountResult = {
  steps: DiscountStep[];
  totalDiscountCents: Cents;
  finalTotalCents: Cents;
};

/** Guest-facing summary of the chain, mirrored into `booking_promotions`. */
export type AppliedPromotion = {
  stepIndex: number;
  promotionId: number;
  displayName: string;
  discountType: DiscountType;
  discountCents: Cents;
  /** From the promotion row; used for guest-facing labels only. */
  percentBp: number | null;
};

/**
 * The frozen result. `depositCents` is reported for the payment flow but is
 * deliberately not part of `grandTotalCents`, which is what the guest owes.
 */
export type PriceQuote = {
  nightCount: number;
  baseTotalCents: Cents;
  discountSteps: DiscountStep[];
  totalDiscountCents: Cents;
  nightlyTotalCents: Cents;
  cleaningFeeCents: Cents;
  depositCents: Cents;
  grandTotalCents: Cents;
  avgNightlyCents: Cents;
  appliedPromotions: AppliedPromotion[];
  engineVersion: string;
};
