import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { getDashboardMetrics } from "@/actions/admin/analytics.actions";
import { AdminBookingStatusControl } from "@/components/admin/AdminBookingStatusControl";
import { AdminDashboardSkeleton } from "@/components/admin/AdminDashboardSkeleton";
import type { BookingStatus } from "@/db/tables/enums";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/locales";
import { fromCents } from "@/lib/money";

const EUR_FORMAT = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatEur(cents: number): string {
  return EUR_FORMAT.format(fromCents(cents));
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
}

async function AdminDashboardContent() {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  const metrics = await getDashboardMetrics(locale);

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Revenue, occupancy, and booking activity at a glance.
        </p>
      </div>

      <section
        aria-labelledby="kpi-heading"
        className="grid gap-4 sm:grid-cols-3"
      >
        <h2 id="kpi-heading" className="sr-only">
          Key metrics
        </h2>
        <article className="min-h-[7.5rem] rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Total revenue
          </p>
          <p className="mt-3 font-serif text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatEur(metrics.totalRevenueCents)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Confirmed &amp; completed bookings
          </p>
        </article>
        <article className="min-h-[7.5rem] rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Pending bookings
          </p>
          <p className="mt-3 font-serif text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {metrics.pendingBookingsCount}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Inquiry &amp; pending</p>
        </article>
        <article className="min-h-[7.5rem] rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Occupancy (this month)
          </p>
          <p className="mt-3 font-serif text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {metrics.occupancyRatePercent.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Booked nights vs active inventory
          </p>
        </article>
      </section>

      <section aria-labelledby="top-villas-heading" className="space-y-4">
        <h2
          id="top-villas-heading"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Top villas by revenue
        </h2>
        <div className="min-h-[14rem] overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50">
              <tr>
                <th className="px-4 py-3 font-medium">Villa</th>
                <th className="px-4 py-3 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {metrics.topVillas.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-8 text-center text-zinc-500"
                  >
                    No confirmed revenue yet.
                  </td>
                </tr>
              ) : (
                metrics.topVillas.map((row) => (
                  <tr key={row.villaId}>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {row.title}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                      {formatEur(row.revenueCents)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="recent-bookings-heading" className="space-y-4">
        <h2
          id="recent-bookings-heading"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Recent bookings
        </h2>
        <div className="min-h-[18rem] overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50">
              <tr>
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Villa</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium">Status &amp; actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {metrics.recentBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-zinc-500"
                  >
                    No bookings yet.
                  </td>
                </tr>
              ) : (
                metrics.recentBookings.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      {row.guestName}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {row.villaTitle}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">
                      {row.checkIn} → {row.checkOut}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-900 dark:text-zinc-100">
                      {formatEur(row.grandTotalCents)}
                    </td>
                    <td className="px-4 py-3">
                      <AdminBookingStatusControl
                        bookingId={row.id}
                        initialStatus={row.status as BookingStatus}
                        variant="compact"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
