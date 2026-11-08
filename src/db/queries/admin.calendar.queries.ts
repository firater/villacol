/**
 * Admin villa calendar reads (uncached).
 */
import { and, eq, gte, lte } from "drizzle-orm";

import { db } from "@/db";
import { villaCalendar } from "@/db/schema";
import type { DateString } from "@/lib/dates";

export type AdminCalendarDayRow = {
  date: DateString;
  priceCents: number | null;
  isBlocked: boolean;
  blockSource: string | null;
};

export async function getAdminVillaCalendarRange(
  villaId: number,
  fromInclusive: DateString,
  toInclusive: DateString,
): Promise<AdminCalendarDayRow[]> {
  const rows = await db
    .select({
      date: villaCalendar.date,
      priceCents: villaCalendar.priceCents,
      isBlocked: villaCalendar.isBlocked,
      blockSource: villaCalendar.blockSource,
    })
    .from(villaCalendar)
    .where(
      and(
        eq(villaCalendar.villaId, villaId),
        gte(villaCalendar.date, fromInclusive),
        lte(villaCalendar.date, toInclusive),
      ),
    )
    .orderBy(villaCalendar.date);

  return rows.map((r) => ({
    date: String(r.date) as DateString,
    priceCents: r.priceCents,
    isBlocked: r.isBlocked,
    blockSource: r.blockSource,
  }));
}
