import type { DiscountTierUnit } from "@/db/queries/discount-tiers.queries";
import type { DiscountType } from "@/db/tables/enums";
import {
  isPromoHubSlug,
  type PromoHubSlug,
  type PromoTierListingParams,
} from "@/lib/promotions-hub";
import type { SearchParamsInput } from "@/lib/search-params";

export type PromoListingFilter = {
  promo: PromoHubSlug;
  tier: PromoTierListingParams | null;
};

function readScalar(
  input: SearchParamsInput,
  key: string,
): string | undefined {
  if (input instanceof URLSearchParams) {
    return input.get(key) ?? undefined;
  }
  const value = input[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

const TIER_UNITS = new Set<DiscountTierUnit>([
  "percent_bp",
  "fixed_amount_cents",
  "free_nights",
]);

const DISCOUNT_TYPES = new Set<DiscountType>([
  "percentage",
  "fixed_amount",
  "free_days",
  "commission_waiver",
]);

/**
 * Reads `?promo=` and optional tier pins from the villa listing URL.
 * Returns null when `promo` is absent or invalid.
 */
export function parsePromoListingFilter(
  input: SearchParamsInput,
): PromoListingFilter | null {
  const promoRaw = readScalar(input, "promo");
  if (promoRaw === undefined || !isPromoHubSlug(promoRaw)) {
    return null;
  }

  const discountRaw = readScalar(input, "tier_discount");
  const unitRaw = readScalar(input, "tier_unit");
  const valueRaw = readScalar(input, "tier_value");

  if (
    discountRaw === undefined &&
    unitRaw === undefined &&
    valueRaw === undefined
  ) {
    return { promo: promoRaw, tier: null };
  }

  if (
    discountRaw === undefined ||
    unitRaw === undefined ||
    valueRaw === undefined ||
    !DISCOUNT_TYPES.has(discountRaw as DiscountType) ||
    !TIER_UNITS.has(unitRaw as DiscountTierUnit)
  ) {
    return { promo: promoRaw, tier: null };
  }

  const value = Number(valueRaw);
  if (!Number.isFinite(value) || value < 1) {
    return { promo: promoRaw, tier: null };
  }

  return {
    promo: promoRaw,
    tier: {
      discountType: discountRaw as DiscountType,
      unit: unitRaw as DiscountTierUnit,
      value: Math.round(value),
    },
  };
}
