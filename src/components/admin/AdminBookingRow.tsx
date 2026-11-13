"use client";

import { useState, useTransition } from "react";

import { updateBookingStatus } from "@/actions/admin/booking.actions";
import type { AdminBookingListRow } from "@/db/queries/admin.bookings.queries";
import type { BookingStatus } from "@/db/tables/enums";
import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/lib/locales";
import {
  ADMIN_BOOKING_QUICK_LABELS,
  ADMIN_BOOKING_QUICK_STATUSES,
  BOOKING_STATUS_STYLES,
  formatBookingStatus,
} from "@/lib/admin-booking-status";
import { formatEurFromCents } from "@/lib/money";

import { AdminBookingPaymentLink } from "./AdminBookingPaymentLink";

type Props = {
  row: AdminBookingListRow;
  locale: Locale;
};

export function AdminBookingRow({ row, locale }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(row.status as BookingStatus);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function apply(next: BookingStatus) {
    if (next === status || pending) return;
    setError(null);
    startTransition(async () => {
      const previous = status;
      setStatus(next);
      const result = await updateBookingStatus({
        bookingId: row.id,
        status: next,
      });
      if (!result.ok) {
        setStatus(previous);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const badgeClass =
    BOOKING_STATUS_STYLES[status] ??
    "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";

  return (
    <tr className="bg-white align-top dark:bg-zinc-950/40">
      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
        {row.guestName}
      </td>
      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
        {row.villaTitle}
      </td>
      <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">
        {row.checkIn} → {row.checkOut}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-zinc-900 dark:text-zinc-100">
        {formatEurFromCents(row.grandTotalCents)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeClass}`}
        >
          {pending ? "Updating…" : formatBookingStatus(status)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {ADMIN_BOOKING_QUICK_STATUSES.map((next) => {
            const isCurrent = next === status;
            return (
              <button
                key={next}
                type="button"
                disabled={pending || isCurrent}
                onClick={() => apply(next)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  isCurrent
                    ? "border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
                    : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                {ADMIN_BOOKING_QUICK_LABELS[next]}
              </button>
            );
          })}
        </div>
        {error !== null ? (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        {status === "awaiting_payment" ? (
          <AdminBookingPaymentLink bookingId={row.id} locale={locale} />
        ) : null}
      </td>
    </tr>
  );
}
