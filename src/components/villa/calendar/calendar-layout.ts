/**
 * Height reservations for the two picker layouts, shared with
 * `VillaDetailSkeleton` so the suspense fallback and the real calendars cannot
 * drift apart and shift the page on hydration.
 *
 * The values are derived from `--rdp-day-height` (3rem) with `fixedWeeks` and a
 * second price line inside each cell:
 * caption + weekday row + six week rows, multiplied by the grid rows each
 * breakpoint shows.
 */
export const CALENDAR_SINGLE_MIN_HEIGHT = "min-h-[21.5rem]";

export const CALENDAR_TRIPLE_MIN_HEIGHT =
  "min-h-[68rem] sm:min-h-[44rem] lg:min-h-[22.5rem]";

export function calendarMinHeightClass(numberOfMonths: number): string {
  return numberOfMonths > 1
    ? CALENDAR_TRIPLE_MIN_HEIGHT
    : CALENDAR_SINGLE_MIN_HEIGHT;
}
