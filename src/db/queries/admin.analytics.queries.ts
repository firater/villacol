/**
 * Admin dashboard aggregates (uncached — operations metrics).
 */
import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  bookings,
  villaCalendar,
  villaTranslations,
  villas,
} from "@/db/schema";
import { diffInNights, getBusinessToday, type DateString } from "@/lib/dates";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locales";

const REVENUE_STATUSES = ["confirmed", "completed"] as const;
const PENDING_STATUSES = ["inquiry", "pending"] as const;

export type TopVillaRevenueRow = {
  villaId: number;
  title: string;
  revenueCents: number;
};

export type RecentBookingRow = {
  id: string;
  guestName: string;
  villaTitle: string;
  checkIn: string;
  checkOut: string;
  grandTotalCents: number;
  status: string;
};

export type DashboardMetrics = {
  totalRevenueCents: number;
  pendingBookingsCount: number;
  occupancyRatePercent: number;
  topVillas: TopVillaRevenueRow[];
  recentBookings: RecentBookingRow[];
};

function currentMonthBounds(
  today: DateString = getBusinessToday(),
): { start: DateString; endExclusive: DateString; nightsInMonth: number } {
  const [year, month] = today.split("-").map(Number);
  const start = `${year}-${String(month).padStart(2, "0")}-01` as DateString;
  const endExclusive =
    month === 12
      ? (`${year + 1}-01-01` as DateString)
      : (`${year}-${String(month + 1).padStart(2, "0")}-01` as DateString);
  return {
    start,
    endExclusive,
    nightsInMonth: diffInNights(start, endExclusive),
  };
}

export async function getTotalRevenueCents(): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${bookings.grandTotalCents}), 0)::int`,
    })
    .from(bookings)
    .where(inArray(bookings.status, [...REVENUE_STATUSES]));

  return row?.total ?? 0;
}

export async function getPendingBookingsCount(): Promise<number> {
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(bookings)
    .where(inArray(bookings.status, [...PENDING_STATUSES]));

  return row?.count ?? 0;
}

/**
 * Booked villa-nights (calendar blocks from confirmed stays) divided by active
 * inventory nights in the business calendar month.
 */
export async function getCurrentMonthOccupancyRatePercent(): Promise<number> {
  const { start, endExclusive, nightsInMonth } = currentMonthBounds();

  const [activeRow, bookedRow] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(villas)
      .where(eq(villas.isActive, true)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(villaCalendar)
      .innerJoin(villas, eq(villas.id, villaCalendar.villaId))
      .where(
        and(
          eq(villas.isActive, true),
          gte(villaCalendar.date, start),
          lt(villaCalendar.date, endExclusive),
          eq(villaCalendar.isBlocked, true),
          eq(villaCalendar.blockSource, "booking"),
        ),
      ),
  ]);

  const activeVillas = activeRow[0]?.count ?? 0;
  const bookedNights = bookedRow[0]?.count ?? 0;
  const totalNights = activeVillas * nightsInMonth;

  if (totalNights <= 0) return 0;
  return Math.round((bookedNights / totalNights) * 10_000) / 100;
}

export async function getTopVillasByRevenue(
  limit: number,
  locale: Locale = DEFAULT_LOCALE,
): Promise<TopVillaRevenueRow[]> {
  const rows = await db
    .select({
      villaId: bookings.villaId,
      title: villaTranslations.title,
      revenueCents: sql<number>`sum(${bookings.grandTotalCents})::int`,
    })
    .from(bookings)
    .innerJoin(
      villaTranslations,
      and(
        eq(villaTranslations.villaId, bookings.villaId),
        eq(villaTranslations.locale, locale),
      ),
    )
    .where(inArray(bookings.status, [...REVENUE_STATUSES]))
    .groupBy(bookings.villaId, villaTranslations.title)
    .orderBy(desc(sql`sum(${bookings.grandTotalCents})`))
    .limit(limit);

  return rows.map((row) => ({
    villaId: row.villaId,
    title: row.title,
    revenueCents: row.revenueCents,
  }));
}

export async function getRecentBookings(
  limit: number,
  locale: Locale = DEFAULT_LOCALE,
): Promise<RecentBookingRow[]> {
  const rows = await db
    .select({
      id: bookings.id,
      guestName: bookings.guestName,
      villaTitle: villaTranslations.title,
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
      grandTotalCents: bookings.grandTotalCents,
      status: bookings.status,
    })
    .from(bookings)
    .innerJoin(
      villaTranslations,
      and(
        eq(villaTranslations.villaId, bookings.villaId),
        eq(villaTranslations.locale, locale),
      ),
    )
    .orderBy(desc(bookings.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    guestName: row.guestName,
    villaTitle: row.villaTitle,
    checkIn: String(row.checkIn),
    checkOut: String(row.checkOut),
    grandTotalCents: row.grandTotalCents,
    status: row.status,
  }));
}

export async function loadDashboardMetrics(
  locale: Locale = DEFAULT_LOCALE,
): Promise<DashboardMetrics> {
  const [
    totalRevenueCents,
    pendingBookingsCount,
    occupancyRatePercent,
    topVillas,
    recentBookings,
  ] = await Promise.all([
    getTotalRevenueCents(),
    getPendingBookingsCount(),
    getCurrentMonthOccupancyRatePercent(),
    getTopVillasByRevenue(5, locale),
    getRecentBookings(5, locale),
  ]);

  return {
    totalRevenueCents,
    pendingBookingsCount,
    occupancyRatePercent,
    topVillas,
    recentBookings,
  };
}
