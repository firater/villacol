import { INTL_LOCALE_TAGS, type Locale } from "@/lib/locales";

/**
 * Calendar dates are plain `YYYY-MM-DD` strings and all arithmetic runs in UTC,
 * so no DST transition can shift a night. A stay is the half-open interval
 * `[checkIn, checkOut)`: a night is named by the date it starts on, and the
 * checkout date is never a night.
 */
export type DateString = string;

export const BUSINESS_TIMEZONE = "Europe/Istanbul";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const businessDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function isValidDateString(value: unknown): value is DateString {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  return toDateString(parseDate(value)) === value;
}

function assertDateString(value: DateString): void {
  if (!DATE_PATTERN.test(value)) {
    throw new Error(`Expected a YYYY-MM-DD date string, received "${value}"`);
  }
}

/** Parses to a UTC midnight `Date`; never use the result for display. */
export function parseDate(value: DateString): Date {
  assertDateString(value);
  return new Date(`${value}T00:00:00.000Z`);
}

export function toDateString(date: Date): DateString {
  return date.toISOString().slice(0, 10);
}

/**
 * "Today" in Turkish business time. The cron path must call this rather than
 * `new Date()`: a server in UTC would otherwise compute yesterday's
 * next-available date for the three hours after midnight in Istanbul.
 */
export function getBusinessToday(now: Date = new Date()): DateString {
  return businessDateFormatter.format(now);
}

export function addDays(value: DateString, days: number): DateString {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateString(date);
}

/** Night count between two dates; negative when `to` precedes `from`. */
export function diffInNights(from: DateString, to: DateString): number {
  const millis = parseDate(to).getTime() - parseDate(from).getTime();
  return Math.round(millis / 86_400_000);
}

export function isBefore(left: DateString, right: DateString): boolean {
  return left < right;
}

export function isAfter(left: DateString, right: DateString): boolean {
  return left > right;
}

export function isSameOrBefore(left: DateString, right: DateString): boolean {
  return left <= right;
}

/** Returns one entry per night in `[checkIn, checkOut)`. */
export function enumerateNights(
  checkIn: DateString,
  checkOut: DateString,
): DateString[] {
  assertDateString(checkIn);
  assertDateString(checkOut);

  const nights: DateString[] = [];
  for (let date = checkIn; date < checkOut; date = addDays(date, 1)) {
    nights.push(date);
  }
  return nights;
}

/** Inclusive on both ends, for admin calendar ranges (not stays). */
export function enumerateDateRange(
  start: DateString,
  end: DateString,
): DateString[] {
  return enumerateNights(start, addDays(end, 1));
}

export function minDate(left: DateString, right: DateString): DateString {
  return left <= right ? left : right;
}

export function maxDate(left: DateString, right: DateString): DateString {
  return left >= right ? left : right;
}

export function formatBusinessWeekday(locale: Locale, now: Date = new Date()): string {
  return new Intl.DateTimeFormat(INTL_LOCALE_TAGS[locale], {
    weekday: "long",
    timeZone: BUSINESS_TIMEZONE,
  }).format(now);
}

export function formatBusinessLongDate(locale: Locale, now: Date): string {
  return new Intl.DateTimeFormat(INTL_LOCALE_TAGS[locale], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: BUSINESS_TIMEZONE,
  }).format(now);
}
