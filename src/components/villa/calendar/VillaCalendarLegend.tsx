"use client";

import { useTranslations } from "next-intl";

import { useCalendarData } from "./CalendarContext";

/**
 * Public availability key — mirrors the admin calendar legend in spirit only;
 * copy and markup are villa-detail specific.
 */
export function VillaCalendarLegend() {
  const t = useTranslations("villaDetail");
  const { defaultNightlyPriceCents, formatNightlyPrice } = useCalendarData();

  const defaultSample =
    defaultNightlyPriceCents !== null
      ? formatNightlyPrice(defaultNightlyPriceCents)
      : "—";

  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-600 dark:text-zinc-400">
      <li className="inline-flex items-center gap-2">
        <span
          aria-hidden
          className="size-3 rounded-md bg-red-100 ring-1 ring-inset ring-red-200 dark:bg-red-950/70 dark:ring-red-900"
        />
        {t("calendarLegendBlocked")}
      </li>
      <li className="inline-flex items-center gap-2">
        <span
          aria-hidden
          className="size-3 rounded-md bg-amber-50 ring-1 ring-inset ring-amber-300 dark:bg-amber-950/50 dark:ring-amber-800"
        />
        {t("calendarLegendCustomPrice")}
      </li>
      <li className="inline-flex items-center gap-2">
        <span
          aria-hidden
          className="size-3 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900/60"
        />
        {t("calendarLegendDefault", { price: defaultSample })}
      </li>
      <li className="inline-flex items-center gap-2">
        <span
          aria-hidden
          className="size-3 rounded-md bg-violet-50 ring-2 ring-inset ring-violet-400/90 dark:bg-violet-950/40 dark:ring-violet-600"
        />
        {t("calendarLegendHoliday")}
      </li>
    </ul>
  );
}
