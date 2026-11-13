import type { DiscountTier, DiscountTierFilter } from "@/db/queries/discount-tiers.queries";
import type { DiscountType } from "@/db/tables/enums";
import { DEFAULT_COMMISSION_RATE_BP } from "@/lib/commission";
import { fromCents } from "@/lib/money";

/** URL `?promo=` slugs — universal English per project rules. */
export const PROMO_HUB_SLUGS = [
  "commission-waiver",
  "long-stay",
  "early-bird",
  "last-minute",
  "coupon",
] as const;

export type PromoHubSlug = (typeof PROMO_HUB_SLUGS)[number];

export type PromoHubSectionId =
  | "direct-booking"
  | "long-stay"
  | "early-bird"
  | "last-minute"
  | "coupons";

export type PromoHubSectionConfig = {
  id: PromoHubSectionId;
  promoSlug: PromoHubSlug;
  /** One or more tier queries merged for the pill row. */
  tierFilters: DiscountTierFilter[];
};

export const PROMO_HUB_SECTIONS: PromoHubSectionConfig[] = [
  {
    id: "direct-booking",
    promoSlug: "commission-waiver",
    tierFilters: [{ discountType: "commission_waiver" }],
  },
  {
    id: "long-stay",
    promoSlug: "long-stay",
    tierFilters: [
      { discountType: "free_days" },
      { triggerType: "long_stay" },
    ],
  },
  {
    id: "early-bird",
    promoSlug: "early-bird",
    tierFilters: [{ triggerType: "early_bird" }],
  },
  {
    id: "last-minute",
    promoSlug: "last-minute",
    tierFilters: [{ triggerType: "last_minute" }],
  },
  {
    id: "coupons",
    promoSlug: "coupon",
    tierFilters: [{ triggerType: "coupon" }, { triggerType: "exit_intent" }],
  },
];

export function getPromoHubSection(
  id: PromoHubSectionId,
): PromoHubSectionConfig {
  const section = PROMO_HUB_SECTIONS.find((row) => row.id === id);
  if (section === undefined) {
    throw new Error(`Unknown promotions hub section: ${id}`);
  }
  return section;
}

export function getPromoHubSectionBySlug(
  slug: PromoHubSlug,
): PromoHubSectionConfig | undefined {
  return PROMO_HUB_SECTIONS.find((row) => row.promoSlug === slug);
}

export function isPromoHubSlug(value: string): value is PromoHubSlug {
  return (PROMO_HUB_SLUGS as readonly string[]).includes(value);
}

/** Merges duplicate type+value buckets when a section runs multiple tier queries. */
export function mergeDiscountTiers(batches: DiscountTier[][]): DiscountTier[] {
  const map = new Map<string, DiscountTier>();

  for (const tiers of batches) {
    for (const tier of tiers) {
      const key = `${tier.discountType}:${tier.unit}:${tier.value}`;
      const existing = map.get(key);
      if (existing === undefined) {
        map.set(key, { ...tier });
      } else {
        map.set(key, {
          ...existing,
          villaCount: existing.villaCount + tier.villaCount,
        });
      }
    }
  }

  return [...map.values()].sort((a, b) => b.value - a.value);
}

export function formatDiscountTierShortLabel(tier: DiscountTier): string {
  switch (tier.unit) {
    case "percent_bp": {
      const pct = tier.value / 100;
      const text =
        pct % 1 === 0 ? String(pct) : pct.toFixed(2).replace(/\.?0+$/, "");
      return `${text}% off`;
    }
    case "fixed_amount_cents":
      return `€${fromCents(tier.value).toFixed(0)} off`;
    case "free_nights":
      return tier.value === 1
        ? "1 free night"
        : `${tier.value} free nights`;
    default:
      return "Offer";
  }
}

export function commissionWaiverPercentLabel(
  rateBp: number = DEFAULT_COMMISSION_RATE_BP,
): string {
  return `${rateBp / 100}%`;
}

export type PromoTierListingParams = {
  discountType: DiscountType;
  unit: DiscountTier["unit"];
  value: number;
};

export function buildPromoListingQuery(
  promoSlug: PromoHubSlug,
  tier?: PromoTierListingParams,
): string {
  const params = new URLSearchParams();
  params.set("promo", promoSlug);
  if (tier !== undefined) {
    params.set("tier_discount", tier.discountType);
    params.set("tier_unit", tier.unit);
    params.set("tier_value", String(tier.value));
  }
  return `?${params.toString()}`;
}

export type PromoListingHref = {
  pathname: "/villas";
  query: Record<string, string>;
};

export function buildPromoListingHref(
  promoSlug: PromoHubSlug,
  tier?: PromoTierListingParams,
): PromoListingHref {
  const query: Record<string, string> = { promo: promoSlug };
  if (tier !== undefined) {
    query.tier_discount = tier.discountType;
    query.tier_unit = tier.unit;
    query.tier_value = String(tier.value);
  }
  return { pathname: "/villas", query };
}
