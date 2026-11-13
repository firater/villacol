import type { BookingStatus } from "@/db/tables/enums";

export const BOOKING_STATUS_STYLES: Record<BookingStatus, string> = {
  inquiry:
    "bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100",
  pending: "bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
  awaiting_payment:
    "bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-100",
  confirmed:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100",
  completed:
    "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200",
};

export function formatBookingStatus(status: BookingStatus): string {
  return status.replaceAll("_", " ");
}

/** Status changes surfaced in the admin quick-actions UI. */
export const ADMIN_BOOKING_QUICK_STATUSES = [
  "confirmed",
  "awaiting_payment",
  "cancelled",
  "completed",
] as const satisfies readonly BookingStatus[];

export const ADMIN_BOOKING_QUICK_LABELS: Record<
  (typeof ADMIN_BOOKING_QUICK_STATUSES)[number],
  string
> = {
  confirmed: "Confirm",
  awaiting_payment: "Awaiting payment",
  cancelled: "Cancel",
  completed: "Complete",
};
