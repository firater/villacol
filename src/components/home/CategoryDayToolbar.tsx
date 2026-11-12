"use client";

import { Link } from "@/i18n/navigation";

type CategoryOfTheDay = {
  slug: string;
  label: string;
};

type Props = {
  categoryOfTheDay: CategoryOfTheDay | undefined;
  categoryOfTheDayLabel: string;
  categoryOfTheDayName: string;
  bestPriceGuaranteeLabel: string;
  viewAllLabel: string;
  className?: string;
  /** When set, category block is a button that scrolls the carousel; otherwise links to villas. */
  onFocusCategoryOfDay?: () => void;
};

export function CategoryDayToolbar({
  categoryOfTheDay,
  categoryOfTheDayLabel,
  categoryOfTheDayName,
  bestPriceGuaranteeLabel,
  viewAllLabel,
  onFocusCategoryOfDay,
  className,
}: Props) {
  const categoryBlock = categoryOfTheDay ? (
    <>
      <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">
        {categoryOfTheDayLabel}
      </span>
      <span className="font-serif text-2xl text-stone-900 transition group-hover:text-brand">
        {categoryOfTheDayName}
      </span>
      <span className="hidden h-4 w-px bg-stone-300 sm:block" aria-hidden />
      <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-stone-500">
        {bestPriceGuaranteeLabel}
      </span>
    </>
  ) : null;

  return (
    <div
      className={`flex flex-col gap-5 border-y border-solid border-stone-300/80 py-5 sm:flex-row sm:items-center sm:justify-between ${className ?? ""}`}
    >
      {categoryOfTheDay ? (
        onFocusCategoryOfDay ? (
          <button
            type="button"
            onClick={onFocusCategoryOfDay}
            className="group flex flex-col gap-1 text-left sm:flex-row sm:items-center sm:gap-4"
            aria-label={`${categoryOfTheDayLabel} ${categoryOfTheDayName}`}
          >
            {categoryBlock}
          </button>
        ) : (
          <Link
            href={{ pathname: "/villas", query: { category: categoryOfTheDay.slug } }}
            className="group flex flex-col gap-1 text-left sm:flex-row sm:items-center sm:gap-4"
            aria-label={`${categoryOfTheDayLabel} ${categoryOfTheDayName}`}
          >
            {categoryBlock}
          </Link>
        )
      ) : (
        <span />
      )}
      <Link
        href="/villas"
        className="shrink-0 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-900 underline-offset-4 transition hover:text-brand hover:underline"
      >
        {viewAllLabel}
      </Link>
    </div>
  );
}
