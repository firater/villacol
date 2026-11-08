"use client";

import {
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { VillaPublicCalendarSnapshot } from "@/db/queries/public.calendar.queries";
import {
  addDays,
  diffInNights,
  isValidDateString,
  type DateString,
} from "@/lib/dates";
import { listHolidaysInRange } from "@/lib/holidays";

import type { Cents } from "@/lib/money";

import {
  createDayIndexer,
  fromApiDate,
  maskHasDay,
  maskHasNight,
  type DayMatcher,
} from "./calendar-dates";

const EUR_NIGHTLY_LABEL = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export function formatPublicNightlyPrice(cents: Cents): string {
  return EUR_NIGHTLY_LABEL.format(cents / 100);
}

export type CalendarSelection = {
  checkIn: DateString | null;
  checkOut: DateString | null;
};

/** Everything that is fixed for the lifetime of one villa page. */
type CalendarData = {
  villaId: number;
  villaSlug: string;
  capacity: number;
  rangeFrom: DateString;
  rangeTo: DateString;
  firstSelectableDate: Date;
  lastSelectableDate: Date;
  defaultNightlyPriceCents: number | null;
  isBlocked: DayMatcher;
  hasCustomPrice: DayMatcher;
  isHoliday: DayMatcher;
  getNightlyCents: (date: Date) => number | null;
  formatNightlyPrice: (cents: Cents) => string;
};

type CalendarActions = {
  setRange: (checkIn: DateString | null, checkOut: DateString | null) => void;
};

/**
 * Three contexts instead of one: the pickers depend on `data` (never changes)
 * and `actions` (never changes), so only a date pick can re-render them. A
 * single context would hand every consumer a new object whenever any part of it
 * moved, re-rendering both pickers on every keystroke elsewhere in the page.
 */
const CalendarDataContext = createContext<CalendarData | null>(null);
const CalendarSelectionContext = createContext<CalendarSelection | null>(null);
const CalendarActionsContext = createContext<CalendarActions | null>(null);

export function useCalendarData(): CalendarData {
  const value = useContext(CalendarDataContext);
  if (value === null) {
    throw new Error("useCalendarData must be used within CalendarProvider");
  }
  return value;
}

export function useCalendarSelection(): CalendarSelection {
  const value = useContext(CalendarSelectionContext);
  if (value === null) {
    throw new Error("useCalendarSelection must be used within CalendarProvider");
  }
  return value;
}

export function useCalendarActions(): CalendarActions {
  const value = useContext(CalendarActionsContext);
  if (value === null) {
    throw new Error("useCalendarActions must be used within CalendarProvider");
  }
  return value;
}

type ProviderProps = {
  villaId: number;
  villaSlug: string;
  capacity: number;
  snapshot: VillaPublicCalendarSnapshot;
  children: ReactNode;
};

const EMPTY_SELECTION: CalendarSelection = { checkIn: null, checkOut: null };

export function CalendarProvider({
  villaId,
  villaSlug,
  capacity,
  snapshot,
  children,
}: ProviderProps) {
  const searchParams = useSearchParams();

  /**
   * Read `check_in`/`check_out` while initialising state rather than in an
   * effect: the first commit already carries the dates, so the sidebar quote
   * fires once on load with no second render pass and no state-write loop.
   */
  const [selection, setSelection] = useState<CalendarSelection>(() =>
    readSelectionFromUrl(searchParams, snapshot),
  );

  const setRange = useCallback(
    (checkIn: DateString | null, checkOut: DateString | null) => {
      setSelection((current) =>
        current.checkIn === checkIn && current.checkOut === checkOut
          ? current
          : { checkIn, checkOut },
      );
    },
    [],
  );

  const actions = useMemo<CalendarActions>(() => ({ setRange }), [setRange]);

  const data = useMemo<CalendarData>(() => {
    const {
      rangeFrom,
      rangeTo,
      blockedMask,
      customPriceMask,
      defaultNightlyPriceCents,
      priceOverrides,
    } = snapshot;
    const indexOfDay = createDayIndexer(rangeFrom);
    const holidayMask = buildHolidayMask(rangeFrom, rangeTo);
    const priceByOffset = new Map<number, number>();
    for (const { offset, cents } of priceOverrides) {
      priceByOffset.set(offset, cents);
    }

    const isBlocked: DayMatcher = (date) =>
      maskHasDay(blockedMask, indexOfDay(date));

    return {
      villaId,
      villaSlug,
      capacity,
      rangeFrom,
      rangeTo,
      defaultNightlyPriceCents,
      firstSelectableDate: fromApiDate(rangeFrom),
      // Last bookable *night*; `rangeTo` itself is exclusive and can only ever
      // be a checkout day.
      lastSelectableDate: fromApiDate(addDays(rangeTo, -1)),
      isBlocked,
      hasCustomPrice: (date) => maskHasDay(customPriceMask, indexOfDay(date)),
      isHoliday: (date) => maskHasDay(holidayMask, indexOfDay(date)),
      getNightlyCents: (date) => {
        if (isBlocked(date)) return null;
        const index = indexOfDay(date);
        const explicit = priceByOffset.get(index);
        const cents = explicit ?? defaultNightlyPriceCents;
        return cents;
      },
      formatNightlyPrice: formatPublicNightlyPrice,
    };
  }, [capacity, snapshot, villaId, villaSlug]);

  /**
   * Shallow URL sync. `router.replace` would refetch the whole RSC tree on
   * every click and keep each response in the client router cache, so the
   * native history API is used instead — Next.js still feeds `useSearchParams`
   * from it. The ref makes the write idempotent, and it is seeded with the
   * hydrated selection so mounting never writes.
   */
  const syncedSelectionRef = useRef(selectionKey(selection));

  useEffect(() => {
    const key = selectionKey(selection);
    if (key === syncedSelectionRef.current) return;
    syncedSelectionRef.current = key;

    const params = new URLSearchParams(window.location.search);
    if (selection.checkIn === null) params.delete("check_in");
    else params.set("check_in", selection.checkIn);
    if (selection.checkOut === null) params.delete("check_out");
    else params.set("check_out", selection.checkOut);

    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      query.length > 0
        ? `${window.location.pathname}?${query}`
        : window.location.pathname,
    );
  }, [selection]);

  return (
    <CalendarDataContext.Provider value={data}>
      <CalendarActionsContext.Provider value={actions}>
        <CalendarSelectionContext.Provider value={selection}>
          {children}
        </CalendarSelectionContext.Provider>
      </CalendarActionsContext.Provider>
    </CalendarDataContext.Provider>
  );
}

function selectionKey(selection: CalendarSelection): string {
  return `${selection.checkIn ?? ""}|${selection.checkOut ?? ""}`;
}

function buildHolidayMask(rangeFrom: DateString, rangeTo: DateString): string {
  const dayCount = diffInNights(rangeFrom, rangeTo);
  const mask = new Uint8Array(dayCount);
  for (const holiday of listHolidaysInRange(rangeFrom, rangeTo)) {
    const index = diffInNights(rangeFrom, holiday.date);
    if (index >= 0 && index < dayCount) mask[index] = 1;
  }
  return mask.join("");
}

/**
 * A shared link can point at sold-out or long-expired dates, so the range is
 * only restored when it is actually bookable; otherwise the visitor would see a
 * selection the quote endpoint rejects.
 */
function readSelectionFromUrl(
  searchParams: ReadonlyURLSearchParams,
  snapshot: VillaPublicCalendarSnapshot,
): CalendarSelection {
  const checkIn = searchParams.get("check_in");
  const checkOut = searchParams.get("check_out");

  if (
    checkIn === null ||
    checkOut === null ||
    !isValidDateString(checkIn) ||
    !isValidDateString(checkOut) ||
    checkIn < snapshot.rangeFrom ||
    checkOut > snapshot.rangeTo
  ) {
    return EMPTY_SELECTION;
  }

  const nights = diffInNights(checkIn, checkOut);
  const startIndex = diffInNights(snapshot.rangeFrom, checkIn);
  if (nights < 1 || maskHasNight(snapshot.blockedMask, startIndex, nights)) {
    return EMPTY_SELECTION;
  }

  return { checkIn, checkOut };
}
