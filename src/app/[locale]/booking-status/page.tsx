import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import {
  getBookingIdForAccessToken,
  getGuestBookingForSession,
  getVerifiedBookingId,
} from "@/actions/public/booking-access.actions";
import { BookingOtpGate } from "@/components/booking/BookingOtpGate";
import { GuestBookingDetails } from "@/components/booking/GuestBookingDetails";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/locales";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BookingStatusPage({ searchParams }: PageProps) {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  return (
    <Suspense fallback={<BookingStatusFallback />}>
      <BookingStatusContent searchParams={searchParams} locale={locale} />
    </Suspense>
  );
}

async function BookingStatusContent({
  searchParams,
  locale,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  locale: Locale;
}) {
  const [query, t] = await Promise.all([
    searchParams,
    getTranslations("booking.status"),
  ]);

  const tokenRaw = query.token;
  const accessToken = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw;

  if (accessToken === undefined || accessToken.length < 16) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <p className="text-sm text-red-700 dark:text-red-400">{t("invalidLink")}</p>
      </main>
    );
  }

  const bookingIdFromToken = await getBookingIdForAccessToken(accessToken);
  if (bookingIdFromToken === null) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <p className="text-sm text-red-700 dark:text-red-400">{t("invalidLink")}</p>
      </main>
    );
  }

  const verifiedId = await getVerifiedBookingId();
  const showDetails =
    verifiedId !== null && verifiedId === bookingIdFromToken;

  const booking = showDetails
    ? await getGuestBookingForSession(locale)
    : null;

  return (
    <main className="flex flex-1 flex-col">
      <div className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800">
        <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
          <h1 className="font-serif text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
        {booking !== null ? (
          <GuestBookingDetails booking={booking} />
        ) : (
          <BookingOtpGate accessToken={accessToken} />
        )}
      </div>
    </main>
  );
}

function BookingStatusFallback() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <div className="h-8 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
    </main>
  );
}
