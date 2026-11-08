import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { getVillaQuote } from "@/actions/public/quote.actions";
import { getVillaBySlug } from "@/db/queries/villas.queries";
import { BookingInquiryForm } from "@/components/booking/BookingInquiryForm";
import { routing } from "@/i18n/routing";
import { isValidDateString } from "@/lib/dates";
import type { Locale } from "@/lib/locales";

type PageProps = {
  params: Promise<{ villaSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  input: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const raw = input[key];
  if (raw === undefined) return undefined;
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function BookingCheckoutPage({
  params,
  searchParams,
}: PageProps) {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  return (
    <Suspense fallback={<BookingCheckoutFallback />}>
      <BookingCheckoutContent
        params={params}
        searchParams={searchParams}
        locale={locale}
      />
    </Suspense>
  );
}

async function BookingCheckoutContent({
  params,
  searchParams,
  locale,
}: {
  params: Promise<{ villaSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  locale: Locale;
}) {
  const [{ villaSlug }, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations("booking.checkout"),
  ]);

  const villa = await getVillaBySlug(villaSlug, locale);
  if (villa === null) {
    notFound();
  }

  const checkIn = readParam(query, "check_in");
  const checkOut = readParam(query, "check_out");
  const guestsRaw = readParam(query, "guests");
  const guestCount = guestsRaw ? Number.parseInt(guestsRaw, 10) : NaN;

  if (
    checkIn === undefined ||
    checkOut === undefined ||
    !isValidDateString(checkIn) ||
    !isValidDateString(checkOut) ||
    !Number.isFinite(guestCount) ||
    guestCount < 1
  ) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <p className="text-sm text-red-700 dark:text-red-400">{t("missingDates")}</p>
      </main>
    );
  }

  const quote = await getVillaQuote({
    villaId: villa.id,
    checkIn,
    checkOut,
    guestCount,
  });

  if (!quote.ok) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <p className="text-sm text-red-700 dark:text-red-400">{quote.error}</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <div className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/50">
        <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
          <h1 className="font-serif text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {villa.title}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
        <BookingInquiryForm
          villaId={villa.id}
          checkIn={checkIn}
          checkOut={checkOut}
          guestCount={Math.min(guestCount, villa.capacity)}
          quote={quote.data}
        />
      </div>
    </main>
  );
}

function BookingCheckoutFallback() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <div className="h-8 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-8 h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
    </main>
  );
}
