"use client";

import { useState, useTransition } from "react";

import { updateBookingStatus } from "@/actions/admin/booking.actions";
import type { BookingStatus } from "@/db/tables/enums";
import { useRouter } from "@/i18n/navigation";
import {
  ADMIN_BOOKING_QUICK_LABELS,
  ADMIN_BOOKING_QUICK_STATUSES,
  BOOKING_STATUS_STYLES,
  formatBookingStatus,
} from "@/lib/admin-booking-status";

type Props = {
  bookingId: string;
  initialStatus: BookingStatus;
  variant?: "compact" | "full";
};

export function AdminBookingStatusControl({
  bookingId,
  initialStatus,
  variant = "full",
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function apply(next: BookingStatus) {
    if (next === status || pending) return;
    setError(null);
    startTransition(async () => {
      const previous = status;
      setStatus(next);
      const result = await updateBookingStatus({ bookingId, status: next });
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

  const availableActions = ADMIN_BOOKING_QUICK_STATUSES.filter(
    (next) => next !== status,
  );

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeClass}`}
        >
          {pending ? "Updating…" : formatBookingStatus(status)}
        </span>
        <label className="sr-only" htmlFor={`booking-status-${bookingId}`}>
          Change booking status
        </label>
        <select
          id={`booking-status-${bookingId}`}
          disabled={pending || availableActions.length === 0}
          defaultValue=""
          onChange={(e) => {
            const value = e.target.value;
            if (value === "") return;
            apply(value as BookingStatus);
            e.target.value = "";
          }}
          className="max-w-[9.5rem] rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
        >
          <option value="" disabled>
            Update…
          </option>
          {availableActions.map((next) => (
            <option key={next} value={next}>
              {ADMIN_BOOKING_QUICK_LABELS[next]}
            </option>
          ))}
        </select>
        {error !== null ? (
          <span className="text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeClass}`}
      >
        {formatBookingStatus(status)}
      </span>
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
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
