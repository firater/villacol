/** Admin booking list reads (uncached). */
import { getRecentBookings } from "@/db/queries/admin.analytics.queries";
import type { Locale } from "@/lib/locales";

export type { RecentBookingRow as AdminBookingListRow } from "@/db/queries/admin.analytics.queries";

/** Newest first; cap keeps the table responsive on large installs. */
const ADMIN_BOOKING_LIST_LIMIT = 500;

export async function listAdminBookings(locale: Locale) {
  return getRecentBookings(ADMIN_BOOKING_LIST_LIMIT, locale);
}
