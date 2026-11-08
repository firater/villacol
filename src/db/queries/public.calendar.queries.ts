/**
 * Read-only villa calendar for the public detail page (cached).
 */
import { and, eq, gte, lt } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { villaCalendar, villas } from "@/db/schema";
import {
  addDays,
  diffInNights,
  getBusinessToday,
  type DateString,
} from "@/lib/dates";

/** Matches the price-cache cron horizon for consistent availability. */
export const PUBLIC_CALENDAR_HORIZON_DAYS = 540;

/**
 * Availability is sent as two fixed-length bitmask strings rather than one
 * object per day: the payload is retained in the client router cache for every
 * villa the visitor opens, so 540 chars beats 540 objects when someone browses
 * through dozens of villas in one tab. Index 0 is `rangeFrom`, `"1"` means the
 * flag is set.
 */
/** Sparse nightly overrides — offsets omit when the villa default applies. */
export type PublicCalendarPriceOverride = {
  offset: number;
  cents: number;
};

export type VillaPublicCalendarSnapshot = {
  defaultNightlyPriceCents: number | null;
  rangeFrom: DateString;
  /** Exclusive: the first day past the bookable horizon. */
  rangeTo: DateString;
  /** `"1"` = the night cannot be booked. */
  blockedMask: string;
  /** `"1"` = the nightly rate differs from the villa default. */
  customPriceMask: string;
  /** Effective EUR cents for nights that differ from `defaultNightlyPriceCents`. */
  priceOverrides: readonly PublicCalendarPriceOverride[];
};

export async function getVillaPublicCalendarSnapshot(
  villaId: number,
): Promise<VillaPublicCalendarSnapshot | null> {
  "use cache";
  cacheTag("villas", `villa-${villaId}`, "villa-calendar-public");
  cacheLife("hours");

  const [villaRow] = await db
    .select({
      id: villas.id,
      defaultNightlyPriceCents: villas.defaultNightlyPriceCents,
    })
    .from(villas)
    .where(and(eq(villas.id, villaId), eq(villas.isActive, true)))
    .limit(1);

  if (villaRow === undefined) return null;

  const rangeFrom = getBusinessToday();
  const rangeTo = addDays(rangeFrom, PUBLIC_CALENDAR_HORIZON_DAYS);

  const rows = await db
    .select({
      date: villaCalendar.date,
      isBlocked: villaCalendar.isBlocked,
      priceCents: villaCalendar.priceCents,
    })
    .from(villaCalendar)
    .where(
      and(
        eq(villaCalendar.villaId, villaId),
        gte(villaCalendar.date, rangeFrom),
        lt(villaCalendar.date, rangeTo),
      ),
    );

  const defaultCents = villaRow.defaultNightlyPriceCents;

  // A night with no calendar row falls back to the villa default, so it is only
  // bookable when that default exists.
  const blocked = new Uint8Array(PUBLIC_CALENDAR_HORIZON_DAYS).fill(
    defaultCents === null ? 1 : 0,
  );
  const customPrice = new Uint8Array(PUBLIC_CALENDAR_HORIZON_DAYS);
  const priceOverrides: PublicCalendarPriceOverride[] = [];

  for (const row of rows) {
    const index = diffInNights(rangeFrom, String(row.date) as DateString);
    if (index < 0 || index >= PUBLIC_CALENDAR_HORIZON_DAYS) continue;

    const nightlyCents = row.priceCents ?? defaultCents;
    blocked[index] = row.isBlocked || nightlyCents === null ? 1 : 0;
    customPrice[index] =
      row.priceCents !== null && row.priceCents !== defaultCents ? 1 : 0;

    if (
      !row.isBlocked &&
      nightlyCents !== null &&
      row.priceCents !== null &&
      row.priceCents !== defaultCents
    ) {
      priceOverrides.push({ offset: index, cents: row.priceCents });
    }
  }

  return {
    defaultNightlyPriceCents: defaultCents,
    rangeFrom,
    rangeTo,
    blockedMask: blocked.join(""),
    customPriceMask: customPrice.join(""),
    priceOverrides,
  };
}
