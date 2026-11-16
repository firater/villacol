import type { DateString } from "@/lib/dates";
import { INTL_LOCALE_TAGS, type Locale } from "@/lib/locales";

export function formatVillaStayRange(
  checkIn: DateString,
  checkOut: DateString,
  locale: Locale,
): string {
  const format = new Intl.DateTimeFormat(INTL_LOCALE_TAGS[locale], {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const from = format.format(new Date(`${checkIn}T00:00:00.000Z`));
  const to = format.format(new Date(`${checkOut}T00:00:00.000Z`));
  return `${from} – ${to}`;
}