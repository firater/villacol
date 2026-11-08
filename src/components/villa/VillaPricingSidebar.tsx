"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";

import { getVillaQuote, type QuoteDisplay } from "@/actions/public/quote.actions";
import { Link } from "@/i18n/navigation";

import {
  useCalendarData,
  useCalendarSelection,
} from "./calendar/CalendarContext";
import { VillaCalendar } from "./calendar/VillaCalendar";

/** Collapses the roundtrip into one state write so a quote costs one re-render. */
type QuoteState =
  | { status: "empty" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; display: QuoteDisplay };

const EMPTY_QUOTE: QuoteState = { status: "empty" };
const LOADING_QUOTE: QuoteState = { status: "loading" };

/** Guests can be re-typed quickly; hold the request until the input settles. */
const QUOTE_DEBOUNCE_MS = 150;

/**
 * Quote panel driven by the calendar context — it recalculates whenever
 * check-in/check-out change, including the dates restored from the URL on load.
 */
export function VillaPricingSidebar() {
  const t = useTranslations("villaDetail.pricing");
  const { villaId, villaSlug, capacity } = useCalendarData();
  const { checkIn, checkOut } = useCalendarSelection();

  const [guestCount, setGuestCount] = useState(() =>
    Math.min(2, Math.max(1, capacity)),
  );
  const [quote, setQuote] = useState<QuoteState>(EMPTY_QUOTE);

  useEffect(() => {
    if (checkIn === null || checkOut === null) {
      setQuote(EMPTY_QUOTE);
      return;
    }

    let active = true;
    setQuote(LOADING_QUOTE);

    const timer = setTimeout(() => {
      void getVillaQuote({ villaId, checkIn, checkOut, guestCount }).then(
        (result) => {
          // Dates may have changed while the action was in flight: dropping the
          // stale answer keeps the panel from flashing a price for a range the
          // visitor already abandoned.
          if (!active) return;
          setQuote(
            result.ok
              ? { status: "ready", display: result.data }
              : { status: "error", message: result.error },
          );
        },
      );
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [checkIn, checkOut, guestCount, villaId]);

  const handleGuestChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const parsed = Number.parseInt(event.target.value, 10);
      if (Number.isNaN(parsed)) return;
      setGuestCount(Math.min(capacity, Math.max(1, parsed)));
    },
    [capacity],
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
            <QuoteBreakdown display={quote.display} t={t} guestCount={guestCount} />
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

function QuoteBreakdown({
  display,
  t,
  guestCount,
}: {
  display: QuoteDisplay;
  t: ReturnType<typeof useTranslations<"villaDetail.pricing">>;
  guestCount: number;
}) {
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-zinc-600 dark:text-zinc-400">{t("baseTotal")}</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100">
          {display.baseTotal.formatted}
        </dd>
      </div>
      {display.appliedPromotions.length > 0 ? (
        <div>
          <dt className="text-zinc-600 dark:text-zinc-400">{t("promotions")}</dt>
          <dd className="mt-2 space-y-2">
            {display.appliedPromotions.map((p) => (
              <div
                key={`${p.promotionId}-${p.stepIndex}`}
                className="flex justify-between gap-2 text-zinc-800 dark:text-zinc-200"
              >
                <span className="min-w-0 truncate">{p.displayName}</span>
                <span className="shrink-0 font-medium">−{p.discount.formatted}</span>
              </div>
            ))}
          </dd>
        </div>
      ) : null}
      <div className="flex justify-between gap-4 border-t border-zinc-200 pt-3 dark:border-zinc-800">
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
      <div className="flex justify-between gap-4 border-t border-zinc-200 pt-3 text-base font-semibold dark:border-zinc-800">
        <dt className="text-zinc-900 dark:text-zinc-50">{t("grandTotal")}</dt>
        <dd className="text-zinc-900 dark:text-zinc-50">{display.grandTotal.formatted}</dd>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        {t("footnote", {
          nights: display.nightCount,
          guests: guestCount,
        })}
      </p>
    </dl>
  );
}
