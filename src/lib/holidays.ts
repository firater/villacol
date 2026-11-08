import type { DateString } from "@/lib/dates";

export type PublicHoliday = {
  date: DateString;
  /** Short label for admin calendar tooltips. */
  label: string;
};

/**
 * Fixed public holidays for Turkey + common international dates.
 * Islamic holidays are omitted (move each year); extend when needed.
 */
export const PUBLIC_HOLIDAYS: readonly PublicHoliday[] = [
  { date: "2026-01-01", label: "New Year's Day" },
  { date: "2026-04-23", label: "National Sovereignty and Children's Day" },
  { date: "2026-05-01", label: "Labour Day" },
  { date: "2026-05-19", label: "Commemoration of Atatürk, Youth and Sports Day" },
  { date: "2026-07-15", label: "Democracy and National Unity Day" },
  { date: "2026-08-30", label: "Victory Day" },
  { date: "2026-10-29", label: "Republic Day" },
  { date: "2026-12-24", label: "Christmas Eve" },
  { date: "2026-12-25", label: "Christmas Day" },
  { date: "2026-12-31", label: "New Year's Eve" },

  { date: "2027-01-01", label: "New Year's Day" },
  { date: "2027-04-23", label: "National Sovereignty and Children's Day" },
  { date: "2027-05-01", label: "Labour Day" },
  { date: "2027-05-19", label: "Commemoration of Atatürk, Youth and Sports Day" },
  { date: "2027-07-15", label: "Democracy and National Unity Day" },
  { date: "2027-08-30", label: "Victory Day" },
  { date: "2027-10-29", label: "Republic Day" },
  { date: "2027-12-24", label: "Christmas Eve" },
  { date: "2027-12-25", label: "Christmas Day" },
  { date: "2027-12-31", label: "New Year's Eve" },

  { date: "2028-01-01", label: "New Year's Day" },
  { date: "2028-04-23", label: "National Sovereignty and Children's Day" },
  { date: "2028-05-01", label: "Labour Day" },
  { date: "2028-05-19", label: "Commemoration of Atatürk, Youth and Sports Day" },
  { date: "2028-07-15", label: "Democracy and National Unity Day" },
  { date: "2028-08-30", label: "Victory Day" },
  { date: "2028-10-29", label: "Republic Day" },
  { date: "2028-12-24", label: "Christmas Eve" },
  { date: "2028-12-25", label: "Christmas Day" },
  { date: "2028-12-31", label: "New Year's Eve" },
] as const;

const HOLIDAY_BY_DATE = new Map<DateString, string>(
  PUBLIC_HOLIDAYS.map((entry) => [entry.date, entry.label]),
);

export function getHolidayLabel(date: DateString): string | null {
  return HOLIDAY_BY_DATE.get(date) ?? null;
}

/** Holidays whose calendar cell falls inside `[from, to]` (inclusive). */
export function listHolidaysInRange(
  from: DateString,
  to: DateString,
): PublicHoliday[] {
  return PUBLIC_HOLIDAYS.filter(
    (entry) => entry.date >= from && entry.date <= to,
  );
}
