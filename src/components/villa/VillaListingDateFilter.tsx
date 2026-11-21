"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import type { DateRange } from "react-day-picker";
import { X } from "lucide-react";

import { HeroDatePicker } from "@/components/home/HeroDatePicker";
import {
  apiDatesToPickerRange,
  fromApiDate,
  pickerRangeToApiDates,
} from "@/components/villa/calendar/calendar-dates";
import type { DateString } from "@/lib/dates";
import type { VillaFilters } from "@/lib/search-params";

type Props = {
  filters: VillaFilters;
  minDate: DateString;
  onCommitStay: (checkIn: DateString | undefined, checkOut: DateString | undefined) => void;
};

function formatStayTriggerLabel(
  range: DateRange | undefined,
  locale: string,
  placeholder: string,
): string {
  if (!range?.from || !range.to) return placeholder;
  const fmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  return `${fmt.format(range.from)} – ${fmt.format(range.to)}`;
}

export function VillaListingDateFilter({ filters, minDate, onCommitStay }: Props) {
  const t = useTranslations("filters");
  const locale = useLocale();
  const fieldId = useId();

  const urlRange = useMemo((): DateRange | undefined => {
    if (filters.checkIn === undefined || filters.checkOut === undefined) {
      return undefined;
    }
    return apiDatesToPickerRange(
      filters.checkIn as DateString,
      filters.checkOut as DateString,
    );
  }, [filters.checkIn, filters.checkOut]);

  const [datesOpen, setDatesOpen] = useState(false);
  const [pickerRange, setPickerRange] = useState<DateRange | undefined>(urlRange);
  const [twoMonths, setTwoMonths] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const minSelectable = useMemo(() => fromApiDate(minDate), [minDate]);
  const maxSelectable = useMemo(() => {
    const end = fromApiDate(minDate);
    end.setFullYear(end.getFullYear() + 2);
    return end;
  }, [minDate]);

  useEffect(() => {
    if (!datesOpen) {
      setPickerRange(urlRange);
    }
  }, [urlRange, datesOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setTwoMonths(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!datesOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const inside =
        rootRef.current?.contains(target) || popoverRef.current?.contains(target);
      if (!inside) {
        setDatesOpen(false);
        setPickerRange(urlRange);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [datesOpen, urlRange]);

  const hasDates = urlRange?.from !== undefined && urlRange.to !== undefined;
  const triggerLabel = formatStayTriggerLabel(
    urlRange,
    locale,
    t("placeholders.addDates"),
  );

  const handleRangeSelect = useCallback(
    (range: DateRange | undefined) => {
      setPickerRange(range);

      if (!range?.from || !range.to) return;

      const api = pickerRangeToApiDates(range.from, range.to);
      if (api.checkIn === null || api.checkOut === null) return;

      onCommitStay(api.checkIn, api.checkOut);
      setDatesOpen(false);
    },
    [onCommitStay],
  );

  const openPopover = useCallback(() => {
    setPickerRange(urlRange);
    setDatesOpen(true);
  }, [urlRange]);

  const clearDates = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      onCommitStay(undefined, undefined);
      setPickerRange(undefined);
      setDatesOpen(false);
    },
    [onCommitStay],
  );

  const monthCount = twoMonths ? 2 : 1;

  return (
    <div ref={rootRef} className="relative block">
      <span
        id={`${fieldId}-dates-label`}
        className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
      >
        {t("labels.dates")}
      </span>
      <div className="relative mt-1.5">
        <div
          className={`flex items-stretch ${hasDates ? "gap-1.5" : ""}`}
        >
          <button
            type="button"
            id={`${fieldId}-dates-trigger`}
            aria-labelledby={`${fieldId}-dates-label ${fieldId}-dates-trigger`}
            aria-expanded={datesOpen}
            aria-haspopup="dialog"
            onClick={openPopover}
            className={`flex min-h-10 items-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-left text-sm text-zinc-900 transition-colors hover:border-zinc-400 hover:bg-zinc-50/80 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus-visible:border-brand dark:focus-visible:ring-brand/30 ${
              hasDates ? "min-w-0 flex-1" : "w-full"
            }`}
          >
            <span
              className={`block w-full truncate tabular-nums ${
                hasDates ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {triggerLabel}
            </span>
          </button>
          {hasDates ? (
            <button
              type="button"
              onClick={clearDates}
              aria-label={t("clearDates")}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-600 transition-colors hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 dark:focus-visible:border-brand dark:focus-visible:ring-brand/30"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>

      {datesOpen ? (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={t("labels.dates")}
          className="absolute top-[calc(100%+0.5rem)] left-0 z-[100] w-max max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 lg:top-0 lg:left-[calc(100%+0.75rem)] lg:p-5"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -top-[0.4rem] left-1/2 size-2.5 -translate-x-1/2 rotate-45 border border-zinc-200 border-b-0 border-r-0 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900 lg:hidden"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute top-5 -left-[0.4rem] hidden size-2.5 -translate-y-1/2 rotate-45 border border-zinc-200 border-t-0 border-r-0 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900 lg:block"
          />
          <HeroDatePicker
            numberOfMonths={monthCount}
            selected={pickerRange}
            onSelect={handleRangeSelect}
            defaultMonth={pickerRange?.from ?? urlRange?.from ?? minSelectable}
            startMonth={minSelectable}
            endMonth={maxSelectable}
            disabled={{ before: minSelectable, after: maxSelectable }}
          />
        </div>
      ) : null}
      </div>
    </div>
  );
}