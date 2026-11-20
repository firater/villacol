import type { AppliedPromotionSnapshot } from "@/db/tables/caches";
import type { DiscountType } from "@/db/tables/enums";
import { percentLabelFromBp } from "@/lib/applied-promotion-display";
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
  percentBp: number | null;
  freeNights: number | null;
};

function percentageFromName(name: string): string | null {
  const match = name.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (!match) return null;
  return match[1]!.replace(",", ".");
}

function resolvedPercentLabel(item: PromotionBadgeItem): string | null {
  if (item.percentageLabel) return item.percentageLabel;
  if (item.percentBp !== null) return percentLabelFromBp(item.percentBp);
  return null;
}

function joinDetail(parts: string[]): string {
  return parts.filter((part) => part.length > 0).join(" · ");
}

/** Second line of the savings hover card (type + value). */
export function buildPromotionPopoverDetail(item: PromotionBadgeItem): string {
  const amount = item.savingsAmountFormatted;

  switch (item.discountType) {
    case "percentage": {
      const percent = resolvedPercentLabel(item);
      if (percent && amount) return joinDetail([`${percent}% off`, amount]);
      if (percent) return `${percent}% off`;
      return amount ?? "Percentage discount";
    }
    case "fixed_amount":
      return amount ?? "Fixed amount off";
    case "free_days": {
      if (item.freeNights !== null && item.freeNights > 0) {
        const nights =
          item.freeNights === 1
            ? "1 free night"
            : `${item.freeNights} free nights`;
        return amount ? joinDetail([nights, amount]) : nights;
      }
      return amount ?? "Free nights";
    }
    case "commission_waiver": {
      const percent = resolvedPercentLabel(item);
      const head = percent ? `${percent}% off` : "Commission waiver";
      return amount ? joinDetail([head, amount]) : head;
    }
  }
}

export function promotionBadgeTooltip(item: PromotionBadgeItem): string {
  return joinDetail([item.name, buildPromotionPopoverDetail(item)]);
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
        percentBp: promotion.percentBp ?? null,
        freeNights: promotion.freeNights ?? null,
      };
    }

    return {
      name,
      discountType: promotion.discountType,
      savingsFormatted: null,
      savingsAmountFormatted: null,
      percentageLabel,
      percentBp: promotion.percentBp ?? null,
      freeNights: promotion.freeNights ?? null,
    };
  });
}
