import type { AppliedPromotionSnapshot } from "@/db/tables/caches";
import type { DiscountType } from "@/db/tables/enums";
import { toDisplayAmount, type ExchangeRateMap } from "@/lib/currency";
import { localize, type Currency, type Locale } from "@/lib/locales";

export type PromotionBadgeItem = {
  name: string;
  discountType: DiscountType;
  /** e.g. "-£96.90" for pill face; null hides the badge. */
  savingsFormatted: string | null;
  /** e.g. "£96.90" for tooltips. */
  savingsAmountFormatted: string | null;
  /** Parsed from display name when present, e.g. "15". */
  percentageLabel: string | null;
};

function percentageFromName(name: string): string | null {
  const match = name.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (!match) return null;
  return match[1]!.replace(",", ".");
}

function discountTypeSummary(type: DiscountType, percentageLabel: string | null): string {
  if (type === "percentage") {
    return percentageLabel ? `${percentageLabel}% off` : "Percentage discount";
  }
  if (type === "fixed_amount") {
    return "Fixed amount off";
  }
  return "Free nights";
}

export function promotionBadgeTooltip(item: PromotionBadgeItem): string {
  const lines = [item.name, discountTypeSummary(item.discountType, item.percentageLabel)];
  if (item.savingsAmountFormatted) {
    lines.push(`Save ${item.savingsAmountFormatted}`);
  }
  return lines.join(" · ");
}

export function formatPromotionBadges(
  promotions: AppliedPromotionSnapshot[],
  locale: Locale,
  currency: Currency,
  rates: ExchangeRateMap,
): PromotionBadgeItem[] {
  return promotions.map((promotion) => {
    const name = localize(promotion.displayNameI18n, locale);
    const percentageLabel = percentageFromName(name);

    if (promotion.discountCents > 0) {
      const formatted = toDisplayAmount(
        promotion.discountCents,
        currency,
        locale,
        rates,
      ).formatted;
      return {
        name,
        discountType: promotion.discountType,
        savingsFormatted: `-${formatted}`,
        savingsAmountFormatted: formatted,
        percentageLabel,
      };
    }

    return {
      name,
      discountType: promotion.discountType,
      savingsFormatted: null,
      savingsAmountFormatted: null,
      percentageLabel,
    };
  });
}
