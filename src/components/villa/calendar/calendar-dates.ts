/**
 * Day math shared by the calendar context and the pickers.
 *
 * react-day-picker builds every day cell as a `Date` at *local* midnight, so a
 * cell must be identified with local getters. Reading UTC fields off those
 * dates would shift the entire grid by one day for visitors west of UTC.
 */
import type { DateString } from "@/lib/dates";

const MS_PER_DAY = 86_400_000;
const CHAR_ONE = 49;

export type DayMatcher = (date: Date) => boolean;

export function toApiDate(date: Date): DateString {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromApiDate(value: DateString): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Maps a rendered day cell to its offset from `rangeFrom`. The comparison runs
 * on `Date.UTC` day numbers so a DST transition cannot skew the division.
 */
export function createDayIndexer(rangeFrom: DateString): (date: Date) => number {
  const [year, month, day] = rangeFrom.split("-").map(Number);
  const origin = Date.UTC(year, month - 1, day) / MS_PER_DAY;

  return (date: Date) =>
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY -
    origin;
}

export function maskHasDay(mask: string, index: number): boolean {
  return index >= 0 && index < mask.length && mask.charCodeAt(index) === CHAR_ONE;
}

/** True when any night of `[startIndex, startIndex + nights)` carries the flag. */
export function maskHasNight(
  mask: string,
  startIndex: number,
  nights: number,
): boolean {
  for (let index = startIndex; index < startIndex + nights; index += 1) {
    if (maskHasDay(mask, index)) return true;
  }
  return false;
}

/**
 * URL/API stay is half-open `[checkIn, checkOut)` — `checkOut` is the calendar
 * checkout day (not a billed night). The picker highlights check-in through
 * checkout day inclusive, so both ends map 1:1 with `YYYY-MM-DD` strings.
 */
export function apiDatesToPickerRange(
  checkIn: DateString | null,
  checkOut: DateString | null,
): { from: Date; to?: Date } | undefined {
  if (checkIn === null) return undefined;
  const from = fromApiDate(checkIn);
  if (checkOut === null) return { from };
  return { from, to: fromApiDate(checkOut) };
}

export function pickerRangeToApiDates(
  from: Date | undefined,
  to: Date | undefined,
): { checkIn: DateString | null; checkOut: DateString | null } {
  if (from === undefined) return { checkIn: null, checkOut: null };
  return {
    checkIn: toApiDate(from),
    checkOut: to === undefined ? null : toApiDate(to),
  };
}
