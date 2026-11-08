"use client";

import { DayPicker, type DateRange, type Matcher } from "react-day-picker";

import "react-day-picker/style.css";

type Props = {
  numberOfMonths: number;
  selected: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  defaultMonth: Date;
  startMonth: Date;
  endMonth: Date;
  disabled: Matcher | Matcher[];
};

/**
 * Range picker for the homepage search bar.
 *
 * Deliberately *not* built on the villa-detail calendar: that one renders a
 * nightly price inside every cell, so it needs tall bordered boxes. A search
 * bar only picks dates, so this uses react-day-picker's own range visuals
 * (circular endpoints joined by a tinted band) themed in `globals.css`.
 *
 * `resetOnSelect` is the library's native behaviour for "a completed range is
 * on screen, the next click starts a new one".
 */
export function HeroDatePicker({
  numberOfMonths,
  selected,
  onSelect,
  defaultMonth,
  startMonth,
  endMonth,
  disabled,
}: Props) {
  return (
    <div className="hero-date-picker">
      <DayPicker
        mode="range"
        resetOnSelect
        min={2}
        numberOfMonths={numberOfMonths}
        selected={selected}
        onSelect={onSelect}
        defaultMonth={defaultMonth}
        startMonth={startMonth}
        endMonth={endMonth}
        disabled={disabled}
        showOutsideDays={false}
        fixedWeeks
      />
    </div>
  );
}
