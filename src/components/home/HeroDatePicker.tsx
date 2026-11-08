"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DayPicker,
  type DateRange,
  type DayPickerProps,
  type Matcher,
  type ModifiersClassNames,
} from "react-day-picker";

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

function localDayIndex(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

const HOVER_PREVIEW_MODIFIER_CLASS_NAMES: ModifiersClassNames = {
  hover_preview_middle:
    "[&_button]:!rounded-none [&_button]:!border-transparent [&_button]:!bg-[#fff2e8] [&_button]:!text-stone-800",
  hover_preview_end:
    "[&_button]:!rounded-l-none [&_button]:!rounded-r-full [&_button]:!border-orange-300 [&_button]:!bg-[#ffedd5] [&_button]:!text-stone-900",
  hover_preview_start:
    "[&_button]:!rounded-l-full [&_button]:!rounded-r-none [&_button]:!border-orange-300 [&_button]:!bg-[#ffedd5] [&_button]:!text-stone-900",
  hover_preview_anchor_forward:
    "[&_button]:!rounded-l-full [&_button]:!rounded-r-none [&_button]:!border-orange-300 [&_button]:!bg-[#ffedd5] [&_button]:!text-stone-900",
  hover_preview_anchor_backward:
    "[&_button]:!rounded-l-none [&_button]:!rounded-r-full [&_button]:!border-orange-300 [&_button]:!bg-[#ffedd5] [&_button]:!text-stone-900",
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
  const [hoveredDay, setHoveredDay] = useState<Date | undefined>();

  const hoverPreviewModifiers = useMemo((): DayPickerProps["modifiers"] | undefined => {
    const anchor = selected?.from;
    if (!anchor || selected.to || !hoveredDay) return undefined;

    const anchorT = localDayIndex(anchor);
    const hoverT = localDayIndex(hoveredDay);
    const lo = Math.min(anchorT, hoverT);
    const hi = Math.max(anchorT, hoverT);

    return {
      hover_preview_start: (date: Date) =>
        localDayIndex(date) === hoverT && hoverT < anchorT,
      hover_preview_end: (date: Date) =>
        localDayIndex(date) === hoverT && hoverT > anchorT,
      hover_preview_anchor_forward: (date: Date) =>
        localDayIndex(date) === anchorT && hoverT >= anchorT,
      hover_preview_anchor_backward: (date: Date) =>
        localDayIndex(date) === anchorT && hoverT < anchorT,
      hover_preview_middle: (date: Date) => {
        const t = localDayIndex(date);
        return t > lo && t < hi;
      },
    };
  }, [hoveredDay, selected]);

  const handleDayMouseEnter = useCallback<NonNullable<DayPickerProps["onDayMouseEnter"]>>(
    (date) => {
      if (selected?.from && !selected.to) {
        setHoveredDay(date);
      }
    },
    [selected?.from, selected?.to],
  );

  return (
    <div
      className="hero-date-picker"
      onMouseLeave={() => setHoveredDay(undefined)}
    >
      <DayPicker
        mode="range"
        resetOnSelect
        min={2}
        numberOfMonths={numberOfMonths}
        selected={selected}
        onSelect={(range) => {
          setHoveredDay(undefined);
          onSelect(range);
        }}
        defaultMonth={defaultMonth}
        startMonth={startMonth}
        endMonth={endMonth}
        disabled={disabled}
        modifiers={hoverPreviewModifiers}
        modifiersClassNames={HOVER_PREVIEW_MODIFIER_CLASS_NAMES}
        onDayMouseEnter={handleDayMouseEnter}
        showOutsideDays={false}
        fixedWeeks
      />
    </div>
  );
}
