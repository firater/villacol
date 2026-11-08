"use client";

import { memo, useCallback, useMemo, useState } from "react";
import type { DateRange, Matcher } from "react-day-picker";

import {
  useCalendarActions,
  useCalendarData,
  useCalendarSelection,
} from "./CalendarContext";
import {
  apiDatesToPickerRange,
  fromApiDate,
  pickerRangeToApiDates,
} from "./calendar-dates";
import {
  VILLA_RANGE_DAY_PICKER_COMPONENTS,
  VillaRangeDayPicker,
} from "./VillaRangeDayPicker";

type Props = {
  numberOfMonths?: number;
  className?: string;
};

function VillaCalendarInner({ numberOfMonths = 1, className }: Props) {
  const data = useCalendarData();
  const { checkIn, checkOut } = useCalendarSelection();
  const { setRange } = useCalendarActions();

  const selected = useMemo(
    () => apiDatesToPickerRange(checkIn, checkOut),
    [checkIn, checkOut],
  );

  const disabled = useMemo<Matcher[]>(
    () => [
      { before: data.firstSelectableDate },
      { after: data.lastSelectableDate },
      data.isBlocked,
    ],
    [data],
  );

  const modifiers = useMemo(
    () => ({
      blocked: data.isBlocked,
      customPrice: (date: Date) =>
        data.hasCustomPrice(date) &&
        !data.isBlocked(date) &&
        !data.isHoliday(date),
      holiday: (date: Date) => data.isHoliday(date) && !data.isBlocked(date),
    }),
    [data],
  );

  const handleSelect = useCallback(
    (range: DateRange | undefined) => {
      const next = pickerRangeToApiDates(range?.from, range?.to);
      setRange(next.checkIn, next.checkOut);
    },
    [setRange],
  );

  const [defaultMonth] = useState(() =>
    checkIn === null ? undefined : fromApiDate(checkIn),
  );

  const wrapperClass = className === undefined ? "" : className;

  return (
    <VillaRangeDayPicker
      wrapperClassName={wrapperClass}
      numberOfMonths={numberOfMonths}
      defaultMonth={defaultMonth}
      startMonth={data.firstSelectableDate}
      endMonth={data.lastSelectableDate}
      selected={selected}
      onSelect={handleSelect}
      disabled={disabled}
      modifiers={modifiers}
      excludeDisabled
      components={VILLA_RANGE_DAY_PICKER_COMPONENTS}
    />
  );
}

export const VillaCalendar = memo(VillaCalendarInner);
