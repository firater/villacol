"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/locales";

import { useCalendarData, useCalendarSelection } from "./calendar/CalendarContext";
import { formatVillaStayRange } from "./villa-detail-date-format";
import { useVillaDetailPricing } from "./VillaDetailPricingContext";
import { useVillaDetailScroll } from "./VillaDetailScrollContext";

export function VillaDetailFloatingWidget() {
  const t = useTranslations("villaDetail.floatingWidget");
  const tPricing = useTranslations("villaDetail.pricing");
  const locale = useLocale() as Locale;
  const { showFloatingWidget, anchor, scrollToPricingSidebar } =
    useVillaDetailScroll();
  const { guestCount, quote } = useVillaDetailPricing();
  const { villaSlug } = useCalendarData();
  const { checkIn, checkOut } = useCalendarSelection();

  const hasDates = checkIn !== null && checkOut !== null;
  const readyQuote = quote.status === "ready" ? quote.display : null;

  if (anchor === null) return null;

  return (
    <div
      className={`pointer-events-none fixed z-40 hidden lg:block transition-[opacity,transform] duration-300 ease-out ${
        showFloatingWidget ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
      style={{
        top: "6rem",
        right: `${anchor.right}px`,
        width: `${anchor.width}px`,
      }}
      aria-hidden={!showFloatingWidget}
    >
      <div
        className={`flex flex-col gap-4 rounded-2xl border border-stone-200/80 bg-white/95 p-4 shadow-[0_18px_50px_-12px_rgba(28,25,23,0.22)] backdrop-blur-md dark:border-stone-700/60 dark:bg-stone-950/92 ${
          showFloatingWidget ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {hasDates && readyQuote !== null ? (
          <p className="text-center font-sans text-[13px] leading-snug tracking-tight text-stone-700 dark:text-stone-200">
            {t("totalSummary", {
              range: formatVillaStayRange(checkIn, checkOut, locale),
              total: readyQuote.grandTotal.formatted,
            })}
          </p>
        ) : quote.status === "loading" && hasDates ? (
          <p className="text-center text-[13px] text-stone-500" aria-busy="true">
            {tPricing("calculating")}
          </p>
        ) : hasDates && quote.status === "error" ? (
          <p className="text-center text-[13px] leading-snug text-stone-500 dark:text-stone-400">
            {quote.message}
          </p>
        ) : (
          <p className="text-center font-sans text-[13px] leading-snug text-stone-500 dark:text-stone-400">
            {t("selectDatesPrompt")}
          </p>
        )}

        {hasDates && readyQuote !== null ? (
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
            className="flex w-full items-center justify-center rounded-full bg-amber-800 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-900 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100"
          >
            {tPricing("bookNow")}
          </Link>
        ) : (
          <button
            type="button"
            onClick={scrollToPricingSidebar}
            className="w-full rounded-full border border-stone-300 bg-stone-50 py-2.5 text-sm font-medium text-stone-800 transition hover:border-stone-400 hover:bg-white dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800"
          >
            {t("selectDates")}
          </button>
        )}
      </div>
    </div>
  );
}