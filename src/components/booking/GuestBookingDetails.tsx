import { getTranslations } from "next-intl/server";

import type { GuestBookingView } from "@/actions/public/booking-access.actions";

const STATUS_KEYS = [
  "inquiry",
  "pending",
  "awaiting_payment",
  "confirmed",
  "cancelled",
  "completed",
] as const;

type StatusKey = (typeof STATUS_KEYS)[number];

function statusMessageKey(status: string): `statuses.${StatusKey}` {
  if ((STATUS_KEYS as readonly string[]).includes(status)) {
    return `statuses.${status as StatusKey}`;
  }
  return "statuses.inquiry";
}

type Props = {
  booking: GuestBookingView;
};

export async function GuestBookingDetails({ booking }: Props) {
  const t = await getTranslations("booking.status");
  const statusLabel = t(statusMessageKey(booking.status));

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <div>
        <h2 className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {booking.villaTitle}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("statusLabel", { status: statusLabel })}
        </p>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">{t("checkIn")}</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">
            {booking.checkIn}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">{t("checkOut")}</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">
            {booking.checkOut}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">{t("nights")}</dt>
          <dd className="font-medium">{booking.nightCount}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">{t("total")}</dt>
          <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
            {booking.displayTotalFormatted}
          </dd>
        </div>
      </dl>

      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {t("guestSection")}
        </h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-zinc-500">{t("guestName")}</dt>
            <dd className="font-medium">{booking.guestName}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">{t("guestEmail")}</dt>
            <dd>{booking.guestEmail}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">{t("guestPhone")}</dt>
            <dd>{booking.guestPhone}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">{t("guestCount")}</dt>
            <dd>{booking.guestCount}</dd>
          </div>
          {booking.guestNote ? (
            <div>
              <dt className="text-zinc-500">{t("guestNote")}</dt>
              <dd className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                {booking.guestNote}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}
