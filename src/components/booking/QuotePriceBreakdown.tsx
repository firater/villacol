"use client";

import { useTranslations } from "next-intl";

import type { QuoteDisplay } from "@/actions/public/quote.actions";
import { formatAppliedPromotionLabel } from "@/lib/applied-promotion-display";

type Props = {
  display: QuoteDisplay;
  guestCount: number;
};

/** Same line items as the villa detail pricing sidebar — keeps checkout math visible. */
export function QuotePriceBreakdown({ display, guestCount }: Props) {
  const t = useTranslations("villaDetail.pricing");

  return (
    <dl className="space-y-2.5 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-zinc-600 dark:text-zinc-400">{t("baseTotal")}</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100">
          {display.baseTotal.formatted}
        </dd>
      </div>
      {display.appliedPromotions.length > 0 ? (
        <div>
          <dt className="text-zinc-600 dark:text-zinc-400">{t("promotions")}</dt>
          <dd className="mt-1.5 space-y-1.5">
            {display.appliedPromotions.map((p) => (
              <div
                key={`${p.promotionId}-${p.stepIndex}`}
                className="flex justify-between gap-2 text-zinc-800 dark:text-zinc-200"
              >
                <span className="min-w-0 truncate text-xs">
                  {formatAppliedPromotionLabel(p, {
                    commissionWaiver: (percent) =>
                      t("commissionWaiverLine", { percent }),
                  })}
                </span>
                <span className="shrink-0 text-xs font-medium">
                  −{p.discount.formatted}
                </span>
              </div>
            ))}
          </dd>
        </div>
      ) : null}
      <div className="flex justify-between gap-4 border-t border-zinc-200/80 pt-2.5 dark:border-zinc-700">
        <dt className="text-zinc-600 dark:text-zinc-400">{t("totalDiscount")}</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100">
          −{display.totalDiscount.formatted}
        </dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-zinc-600 dark:text-zinc-400">{t("cleaningFee")}</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100">
          {display.cleaningFee.formatted}
        </dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-zinc-200/80 pt-2.5 font-semibold dark:border-zinc-700">
        <dt className="text-zinc-900 dark:text-zinc-50">{t("grandTotal")}</dt>
        <dd className="text-zinc-900 dark:text-zinc-50">
          {display.grandTotal.formatted}
        </dd>
      </div>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-500">
        {t("footnote", {
          nights: display.nightCount,
          guests: guestCount,
        })}
      </p>
    </dl>
  );
}
