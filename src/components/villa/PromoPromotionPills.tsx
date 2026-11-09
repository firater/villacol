"use client";

import type { PromotionBadgeItem } from "@/lib/promo-badge-labels";
import { promotionBadgeTooltip } from "@/lib/promo-badge-labels";

type Props = {
  badges: PromotionBadgeItem[];
};

export function PromoPromotionPills({ badges }: Props) {
  const withSavings = badges.filter((badge) => badge.savingsFormatted);

  if (withSavings.length === 0) {
    return null;
  }

  return (
    <div className="flex max-w-[min(100%,10rem)] flex-row flex-wrap items-center justify-end gap-x-2 gap-y-0.5 md:max-w-[40%]">
      {withSavings.map((badge, index) => (
        <span
          key={`${badge.name}-${index}`}
          className="group/pill relative max-w-full shrink cursor-default"
        >
          <span className="inline-flex max-w-full items-baseline gap-1 truncate rounded-full border border-stone-300/90 bg-transparent px-2 py-0.5">
            <span className="truncate font-sans text-[10px] font-bold text-orange-600">
              {badge.savingsFormatted}
            </span>
            <span className="font-serif text-[9px] font-medium uppercase tracking-wide text-stone-500">
              Saving
            </span>
          </span>

          <span
            role="tooltip"
            className="pointer-events-none absolute top-full right-0 z-30 mt-1.5 w-max max-w-[16rem] translate-y-0 rounded-lg border border-stone-200/90 bg-white px-3 py-2.5 text-left font-serif text-xs leading-snug text-stone-700 opacity-0 shadow-md transition-opacity duration-150 group-hover/pill:opacity-100 group-focus-within/pill:opacity-100"
          >
            <span className="block text-sm font-semibold text-stone-900">{badge.name}</span>
            {badge.percentageLabel ? (
              <span className="mt-1 block text-xs text-stone-500">{badge.percentageLabel}% off</span>
            ) : (
              <span className="mt-1 block text-xs capitalize text-stone-500">
                {badge.discountType.replaceAll("_", " ")}
              </span>
            )}
            {badge.savingsAmountFormatted ? (
              <span className="mt-1.5 block font-sans text-sm font-semibold text-orange-600">
                {badge.savingsAmountFormatted}
              </span>
            ) : null}
          </span>

          <span className="sr-only">{promotionBadgeTooltip(badge)}</span>
        </span>
      ))}
    </div>
  );
}
