"use client";

import { useTranslations } from "next-intl";
import { useCallback, type ChangeEvent } from "react";

import { QuotePriceBreakdown } from "@/components/booking/QuotePriceBreakdown";
import { Link } from "@/i18n/navigation";

import {
  useCalendarData,
  useCalendarSelection,
} from "./calendar/CalendarContext";
import { VillaCalendar } from "./calendar/VillaCalendar";
import { useVillaDetailPricing } from "./VillaDetailPricingContext";

/**
 * Quote panel driven by the calendar context — it recalculates whenever
 * check-in/check-out change, including the dates restored from the URL on load.
 */
export function VillaPricingSidebar() {
  const t = useTranslations("villaDetail.pricing");
  const { villaSlug, capacity } = useCalendarData();
  const { checkIn, checkOut } = useCalendarSelection();
  const { guestCount, setGuestCount, quote } = useVillaDetailPricing();

  const handleGuestChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const parsed = Number.parseInt(event.target.value, 10);
      if (Number.isNaN(parsed)) return;
      setGuestCount(Math.min(capacity, Math.max(1, parsed)));
    },
    [capacity, setGuestCount],
  );

  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <h2 className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t("title")}
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>

      <div className="mt-4 flex justify-center">
        <VillaCalendar numberOfMonths={1} />
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {t("guests")}
        </span>
        <input
          type="number"
          min={1}
          max={capacity}
          value={guestCount}
          onChange={handleGuestChange}
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </label>

      <div className="mt-6 min-h-[18rem] rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
        {quote.status === "loading" ? (
          <div className="space-y-3" aria-busy="true">
            <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-3/5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-10 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ) : quote.status === "error" ? (
          <p className="text-sm text-red-700 dark:text-red-400">{quote.message}</p>
        ) : quote.status === "empty" ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-500">{t("emptyHint")}</p>
        ) : (
          <>
            <QuotePriceBreakdown
              display={quote.display}
              guestCount={guestCount}
            />
            {checkIn !== null && checkOut !== null ? (
              <Link
                href={{
                  pathname: "/booking/[villaSlug]",
                  params: { villaSlug },
                  query: {
                    check_in: checkIn,
                    check_out: checkOut,
                    guests: String(guestCount),
                  },
                }}
                className="mt-4 flex w-full items-center justify-center rounded-full bg-amber-800 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-900 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100"
              >
                {t("bookNow")}
              </Link>
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}