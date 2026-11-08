"use client";

import { useMemo, useState, useTransition } from "react";

import { setCalendarBlocked, setCalendarPrices } from "@/actions/admin/calendar.actions";
import { useRouter } from "@/i18n/navigation";
import { type DateString, getBusinessToday } from "@/lib/dates";
import { getHolidayLabel, listHolidaysInRange } from "@/lib/holidays";
import { fromCents, toCents } from "@/lib/money";

type DayState = {
  priceCents: number | null;
  isBlocked: boolean;
  blockSource: string | null;
};

type MonthModel = {
  year: number;
  monthIndex: number; // 0-11
  label: string;
  weeks: (DateString | null)[][];
};

function buildThreeMonths(startDate: DateString): MonthModel[] {
  const [y0, m0] = parseYmd(startDate);
  const months: MonthModel[] = [];

  for (let i = 0; i < 3; i += 1) {
    const d = new Date(Date.UTC(y0, m0 + i, 1));
    const year = d.getUTCFullYear();
    const monthIndex = d.getUTCMonth();
    const label = new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);

    const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

    const cells: (DateString | null)[] = [];
    for (let pad = 0; pad < firstWeekday; pad += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const ds = toDateStringUtc(year, monthIndex, day);
      cells.push(ds);
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const weeks: (DateString | null)[][] = [];
    for (let w = 0; w < cells.length; w += 7) {
      weeks.push(cells.slice(w, w + 7) as (DateString | null)[]);
    }

    months.push({ year, monthIndex, label, weeks });
  }

  return months;
}

function parseYmd(ds: DateString): [number, number, number] {
  const [y, m, d] = ds.split("-").map(Number);
  return [y, m - 1, d];
}

function toDateStringUtc(year: number, monthIndex: number, day: number): DateString {
  const iso = new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);
  return iso as DateString;
}

type Props = {
  villaId: number;
  /** Inclusive window matching the grid (server-computed). */
  rangeFrom: DateString;
  rangeTo: DateString;
  defaultNightlyPriceCents: number | null;
  initialDays: { date: DateString; priceCents: number | null; isBlocked: boolean; blockSource: string | null }[];
};

export function VillaCalendarAdmin({
  villaId,
  rangeFrom,
  rangeTo,
  defaultNightlyPriceCents,
  initialDays,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [dayMap, setDayMap] = useState(() => {
    const m = new Map<string, DayState>();
    for (const row of initialDays) {
      m.set(row.date, {
        priceCents: row.priceCents,
        isBlocked: row.isBlocked,
        blockSource: row.blockSource,
      });
    }
    return m;
  });

  const months = useMemo(() => buildThreeMonths(rangeFrom), [rangeFrom]);

  const [rangeStart, setRangeStart] = useState(rangeFrom);
  const [rangeEnd, setRangeEnd] = useState(rangeFrom);
  const [priceEur, setPriceEur] = useState("");

  function cellState(date: DateString): DayState | undefined {
    return dayMap.get(date);
  }

  function formatActionError(result: {
    ok: false;
    error: string;
    fieldErrors?: Record<string, string[]>;
  }) {
    const extra = result.fieldErrors
      ? Object.values(result.fieldErrors)
          .flat()
          .filter(Boolean)
          .join(" ")
      : "";
    return [result.error, extra].filter(Boolean).join(" ");
  }

  function mergeUpdates(dates: DateString[], updates: Partial<DayState>) {
    setDayMap((prev) => {
      const next = new Map(prev);
      for (const d of dates) {
        const cur = next.get(d) ?? {
          priceCents: null,
          isBlocked: false,
          blockSource: null,
        };
        next.set(d, { ...cur, ...updates });
      }
      return next;
    });
  }

  function handleBlock() {
    setError(null);
    const from = minDate(rangeStart, rangeEnd);
    const to = maxDate(rangeStart, rangeEnd);
    startTransition(async () => {
      const out = await setCalendarBlocked({
        villaId,
        range: { from, to },
        isBlocked: true,
        note: null,
      });
      if (!out.ok) {
        setError(formatActionError(out));
        return;
      }
      mergeUpdates(out.data.dates, { isBlocked: true, blockSource: "admin" });
      router.refresh();
    });
  }

  function handleUnblock() {
    setError(null);
    const from = minDate(rangeStart, rangeEnd);
    const to = maxDate(rangeStart, rangeEnd);
    startTransition(async () => {
      const out = await setCalendarBlocked({
        villaId,
        range: { from, to },
        isBlocked: false,
        note: null,
      });
      if (!out.ok) {
        setError(formatActionError(out));
        return;
      }
      mergeUpdates(out.data.dates, { isBlocked: false, blockSource: null });
      router.refresh();
    });
  }

  function handleSetPrices() {
    setError(null);
    const raw = priceEur.trim();
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      setError("Enter a valid nightly price in EUR.");
      return;
    }
    const priceCents = toCents(n);
    const from = minDate(rangeStart, rangeEnd);
    const to = maxDate(rangeStart, rangeEnd);

    startTransition(async () => {
      const out = await setCalendarPrices({
        villaId,
        range: { from, to },
        priceCents,
      });
      if (!out.ok) {
        setError(formatActionError(out));
        return;
      }
      mergeUpdates(out.data.dates, { priceCents });
      router.refresh();
    });
  }

  const defaultLabel =
    defaultNightlyPriceCents != null
      ? `€${fromCents(defaultNightlyPriceCents).toFixed(2)}`
      : "—";

  const holidaysInView = useMemo(
    () => listHolidaysInRange(rangeFrom, rangeTo),
    [rangeFrom, rangeTo],
  );

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Range actions
        </h2>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              From
            </span>
            <input
              type="date"
              value={rangeStart}
              min={rangeFrom}
              max={rangeTo}
              onChange={(e) => setRangeStart(e.target.value as DateString)}
              className="mt-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              To
            </span>
            <input
              type="date"
              value={rangeEnd}
              min={rangeFrom}
              max={rangeTo}
              onChange={(e) => setRangeEnd(e.target.value as DateString)}
              className="mt-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={handleBlock}
            className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
          >
            Block dates
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleUnblock}
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Unblock dates
          </button>
        </div>
        <div className="mt-6 flex flex-wrap items-end gap-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
          <label className="block">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Nightly price (EUR) for range
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={priceEur}
              onChange={(e) => setPriceEur(e.target.value)}
              placeholder="250"
              className="mt-1 w-36 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={handleSetPrices}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Set prices
          </button>
        </div>
        {error !== null ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-zinc-600 dark:text-zinc-400">
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded bg-red-200 dark:bg-red-950" /> Blocked
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded bg-amber-100 dark:bg-amber-950/60" /> Custom
          price
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded bg-zinc-100 dark:bg-zinc-800" /> Default (
          {defaultLabel})
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded border-2 border-violet-400 bg-violet-100 dark:border-violet-600 dark:bg-violet-950/50" />{" "}
          Public holiday
        </span>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        {months.map((m) => (
          <div key={`${m.year}-${m.monthIndex}`}>
            <h3 className="mb-3 text-center font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {m.label}
            </h3>
            <table className="w-full border-collapse text-center text-xs">
              <thead>
                <tr className="text-zinc-500">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <th key={d} className="pb-2 font-medium">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {m.weeks.map((week, wi) => (
                  <tr key={wi}>
                    {week.map((cell, ci) => (
                      <td key={ci} className="p-0.5 align-top">
                        {cell === null ? (
                          <div className="aspect-square min-h-[2.25rem]" />
                        ) : (
                          <DayCell
                            date={cell}
                            state={cellState(cell)}
                            defaultNightlyPriceCents={defaultNightlyPriceCents}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {holidaysInView.length > 0 ? (
        <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900 dark:bg-violet-950/30">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-900 dark:text-violet-200">
            Holidays in this window
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-violet-950 dark:text-violet-100">
            {holidaysInView.map((h) => (
              <li key={h.date}>
                <time dateTime={h.date}>{h.date}</time> — {h.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-zinc-500">
        Window {rangeFrom} – {rangeTo}. “Today” for pricing rules: {getBusinessToday()}.
      </p>
    </div>
  );
}

function DayCell({
  date,
  state,
  defaultNightlyPriceCents,
}: {
  date: DateString;
  state: DayState | undefined;
  defaultNightlyPriceCents: number | null;
}) {
  const dom = Number(date.slice(8, 10));
  const holidayLabel = getHolidayLabel(date);
  const blocked = state?.isBlocked === true;
  const hasExplicitPrice = state?.priceCents != null;
  const customPrice =
    hasExplicitPrice &&
    (defaultNightlyPriceCents == null || state!.priceCents !== defaultNightlyPriceCents);

  let boxClass =
    "flex aspect-square min-h-[2.25rem] w-full flex-col items-center justify-center rounded-lg border text-[10px] leading-tight ";
  if (holidayLabel !== null && !blocked) {
    boxClass +=
      "border-violet-400 bg-violet-50 text-violet-950 ring-1 ring-violet-300/80 dark:border-violet-600 dark:bg-violet-950/40 dark:text-violet-100";
  } else if (blocked) {
    boxClass += "border-red-300 bg-red-100 text-red-950 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100";
  } else if (hasExplicitPrice) {
    boxClass +=
      customPrice
        ? "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
        : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300";
  } else {
    boxClass +=
      "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300";
  }

  const priceLabel =
    hasExplicitPrice
      ? `€${fromCents(state!.priceCents!).toFixed(0)}`
      : defaultNightlyPriceCents != null && !blocked
        ? `€${fromCents(defaultNightlyPriceCents).toFixed(0)}`
        : null;

  const title =
    holidayLabel !== null ? `${date} — ${holidayLabel}` : date;

  return (
    <div className={boxClass} title={title}>
      <span className="text-[11px] font-semibold">{dom}</span>
      {!blocked && priceLabel !== null ? (
        <span className="font-medium">{priceLabel}</span>
      ) : null}
      {blocked ? <span className="text-[9px]">Hold</span> : null}
    </div>
  );
}

function minDate(a: DateString, b: DateString): DateString {
  return a <= b ? a : b;
}

function maxDate(a: DateString, b: DateString): DateString {
  return a >= b ? a : b;
}
