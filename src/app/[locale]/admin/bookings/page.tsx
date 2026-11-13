import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { AdminBookingRow } from "@/components/admin/AdminBookingRow";
import { routing } from "@/i18n/routing";
import { listAdminBookings } from "@/db/queries/admin.bookings.queries";
import type { Locale } from "@/lib/locales";

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<AdminBookingsPageFallback />}>
      <AdminBookingsPageContent />
    </Suspense>
  );
}

async function AdminBookingsPageContent() {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  const rows = await listAdminBookings(locale);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Bookings
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Review inquiries and update status. Confirming or marking awaiting
          payment blocks the villa calendar automatically.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50">
            <tr>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Villa</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                  No bookings yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <AdminBookingRow key={row.id} row={row} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminBookingsPageFallback() {
  return (
    <div className="mx-auto max-w-7xl space-y-6" aria-busy="true">
      <div>
        <div className="h-8 w-36 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-2 h-4 w-full max-w-xl animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800">
        <div className="h-11 animate-pulse border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800" />
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse border-b border-zinc-100 dark:border-zinc-800"
          />
        ))}
      </div>
    </div>
  );
}
