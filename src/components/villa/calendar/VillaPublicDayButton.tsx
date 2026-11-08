"use client";

import { memo } from "react";
import type { DayButtonProps } from "react-day-picker";

import { useCalendarData } from "./CalendarContext";

/**
 * Public day cell: date number plus a compact nightly rate. Styling lives on the
 * parent `<td>` via modifiers; this button only lays out content.
 */
export const VillaPublicDayButton = memo(function VillaPublicDayButton({
  day,
  modifiers,
  className,
  ...buttonProps
}: DayButtonProps) {
  const { getNightlyCents, formatNightlyPrice } = useCalendarData();

  const blocked = modifiers.blocked === true;
  const isCheckout =
    modifiers.range_end === true && modifiers.range_start !== true;
  const cents =
    blocked || modifiers.disabled === true ? null : getNightlyCents(day.date);
  const dom = day.date.getDate();

  const mergedClassName = [className, "villa-cal-day-btn"]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={mergedClassName} {...buttonProps}>
      <span className="text-[11px] font-semibold leading-none tabular-nums">
        {dom}
      </span>
      {isCheckout ? (
        <span className="text-[8px] font-semibold uppercase leading-none tracking-wide opacity-90">
          out
        </span>
      ) : cents !== null ? (
        <span className="text-[9px] font-medium leading-none tabular-nums">
          {formatNightlyPrice(cents)}
        </span>
      ) : blocked ? (
        <span className="text-[8px] font-medium uppercase leading-none tracking-wide opacity-80">
          —
        </span>
      ) : null}
    </button>
  );
});
