import type { AppliedPromotionSnapshot } from "@/db/tables/caches";

export const PROMO_OFFER_TAB_KEYS = [
  "all",
  "last_minute",
  "early_bird",
  "long_stay",
  "coupon",
] as const;

export type PromoOfferTabKey = (typeof PROMO_OFFER_TAB_KEYS)[number];

export type PromoOfferVillaSlice = {
  hasActiveDiscount: boolean;
  appliedPromotions: AppliedPromotionSnapshot[];
};

function promotionTextBlob(promotion: AppliedPromotionSnapshot): string {
  const i18nValues = Object.values(promotion.displayNameI18n ?? {}).join(" ");
  return `${promotion.name} ${i18nValues}`.toLowerCase();
}

function promotionMatchesTab(
  promotion: AppliedPromotionSnapshot,
  tab: Exclude<PromoOfferTabKey, "all">,
): boolean {
  const text = promotionTextBlob(promotion);

  switch (tab) {
    case "last_minute":
      return /last[-\s]?minute|son dakika|последн/i.test(text);
    case "early_bird":
      return /early[-\s]?(book|bird)|frühbuch|erken rezervasyon|ранн/i.test(text);
    case "long_stay":
      return (
        /long[-\s]?stay|langzeit|uzun konaklama|длительн|pay 6,\s*stay 7|6 zahlen,\s*7 bleiben/i.test(
          text,
        ) || (promotion.discountType === "free_days" && /stay 7|7 bleiben|7 ноч/i.test(text))
      );
    case "coupon":
      return (
        /coupon|promo code|welcome code|willkommenscode|kupon|промокод|aktionscode|\d+€ promo/i.test(
          text,
        ) && !/exit intent|parting offer|exclusive web|last-chance|stay7|abschiedsangebot/i.test(text)
      );
    default:
      return false;
  }
}

export function villaMatchesPromoOfferTab(
  villa: PromoOfferVillaSlice,
  tab: PromoOfferTabKey,
): boolean {
  if (tab === "all") {
    return villa.hasActiveDiscount && villa.appliedPromotions.length > 0;
  }

  if (!villa.hasActiveDiscount) return false;

  return villa.appliedPromotions.some((promotion) => promotionMatchesTab(promotion, tab));
}
