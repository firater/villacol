"use client";

import type { PromotionBadgeItem } from "@/lib/promo-badge-labels";
import {
  buildPromotionPopoverDetail,
  promotionBadgeTooltip,
} from "@/lib/promo-badge-labels";

type Props = {
  badges: PromotionBadgeItem[];
};

export function BestValueImageSavingsPills({ badges }: Props) {
  const withSavings = badges.filter(
    (badge) => badge.savingsFormatted !== null || badge.savingsAmountFormatted !== null,
  );

  if (withSavings.length === 0) {
    return null;
  }

  return (
    <div className="flex max-w-full flex-wrap items-start gap-1">
      {withSavings.map((badge, index) => {
        const amountLabel =
          badge.savingsFormatted ??
          (badge.savingsAmountFormatted ? `-${badge.savingsAmountFormatted}` : null);
        if (!amountLabel) {
          return null;
        }

        return (
          <span
            key={`${badge.name}-${index}`}
            className="group/pill relative max-w-[calc(100%-0.25rem)] shrink-0 cursor-default"
          >
            <span className="inline-flex w-max min-w-[6.25rem] max-w-[min(100%,11rem)] items-center justify-center whitespace-nowrap border border-stone-200/90 bg-white/92 px-3 py-1 backdrop-blur-[2px]">
              <span className="font-sans text-[10px] font-bold tabular-nums text-brand-dark">
                {amountLabel}
              </span>
            </span>

            <span
              role="tooltip"
              className="pointer-events-none absolute left-0 top-full z-30 mt-1 w-max min-w-[10rem] max-w-[14rem] border border-stone-200/90 bg-white px-2.5 py-2 text-left opacity-0 transition-opacity duration-150 group-hover/pill:opacity-100 group-focus-within/pill:opacity-100"
            >
              <span className="block font-serif text-xs font-semibold leading-snug text-stone-900">
                {badge.name}
              </span>
              <span className="mt-0.5 block font-sans text-[10px] leading-snug text-stone-500">
                {buildPromotionPopoverDetail(badge)}
              </span>
            </span>

            <span className="sr-only">{promotionBadgeTooltip(badge)}</span>
          </span>
        );
      })}
    </div>
  );
}