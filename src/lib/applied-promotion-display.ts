import type { DiscountType } from "@/db/tables/enums";
import { DEFAULT_COMMISSION_RATE_BP } from "@/lib/commission";

export type AppliedPromotionLabelSource = {
  displayName: string;
  discountType: DiscountType;
  percentBp: number | null;
};

/** Basis points → whole-number percent for labels (2000 → "20"). */
export function percentLabelFromBp(percentBp: number): string {
  const value = percentBp / 100;
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1).replace(/\.0$/, "");
}

/**
 * Guest-facing line label for price breakdowns. Does not alter stored names or
 * pricing math — only how a row reads in the UI.
 */
export function formatAppliedPromotionLabel(
  promotion: AppliedPromotionLabelSource,
  labels: {
    commissionWaiver: (percent: string) => string;
  },
): string {
  if (promotion.discountType === "commission_waiver") {
    const basisPoints = promotion.percentBp ?? DEFAULT_COMMISSION_RATE_BP;
    return labels.commissionWaiver(percentLabelFromBp(basisPoints));
  }

  if (promotion.discountType === "percentage" && promotion.percentBp !== null) {
    if (/\d\s*%/.test(promotion.displayName)) {
      return promotion.displayName;
    }
    const percent = percentLabelFromBp(promotion.percentBp);
    return `${promotion.displayName} (${percent}%)`;
  }

  return promotion.displayName;
}
