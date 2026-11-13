import type { DiscountTier } from "@/db/queries/discount-tiers.queries";
import { Link } from "@/i18n/navigation";
import {
  buildPromoListingHref,
  formatDiscountTierShortLabel,
  type PromoHubSlug,
} from "@/lib/promotions-hub";

type Props = {
  promoSlug: PromoHubSlug;
  tiers: DiscountTier[];
  villasCountLabel: (count: number) => string;
};

export function PromotionsHubTierPills({
  promoSlug,
  tiers,
  villasCountLabel,
}: Props) {
  if (tiers.length === 0) {
    return (
      <p className="font-sans text-sm text-stone-500 dark:text-stone-400">
        —
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {tiers.map((tier) => {
        const label = formatDiscountTierShortLabel(tier);
        const href = buildPromoListingHref(promoSlug, {
          discountType: tier.discountType,
          unit: tier.unit,
          value: tier.value,
        });

        return (
          <li key={`${tier.discountType}-${tier.unit}-${tier.value}`}>
            <Link
              href={href}
              className="inline-flex items-center gap-2 border border-stone-300 bg-white px-3 py-1.5 font-sans text-xs font-medium tracking-wide text-stone-800 transition-colors hover:border-stone-900 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100 dark:hover:border-stone-300"
            >
              <span>{label}</span>
              <span className="text-stone-400" aria-hidden>
                •
              </span>
              <span className="text-stone-600 dark:text-stone-300">
                {villasCountLabel(tier.villaCount)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
