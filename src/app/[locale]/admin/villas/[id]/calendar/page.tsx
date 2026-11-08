import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { VillaCalendarAdmin } from "@/components/admin/VillaCalendarAdmin";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getAdminVillaForEdit } from "@/db/queries/admin.villas.queries";
import { getAdminVillaCalendarRange } from "@/db/queries/admin.calendar.queries";
import { addDays, getBusinessToday, type DateString } from "@/lib/dates";
import type { Locale } from "@/lib/locales";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminVillaCalendarPage({ params }: PageProps) {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarLoader params={params} locale={locale} />
    </Suspense>
  );
}

async function CalendarLoader({
  params,
  locale,
}: {
  params: Promise<{ id: string }>;
  locale: Locale;
}) {
  const { id: rawId } = await params;
  const numericId = Number(rawId);
  if (!Number.isInteger(numericId) || numericId < 1) {
    notFound();
  }

  const villa = await getAdminVillaForEdit(numericId);
  if (villa === null) {
    notFound();
  }

  const rangeFrom = getBusinessToday();
  const rangeTo = addDays(rangeFrom, 92) as DateString;

  const calendarRows = await getAdminVillaCalendarRange(
    numericId,
    rangeFrom,
    rangeTo,
  );

  const titleEn =
    villa.translations.find((t) => t.locale === "en")?.title ?? villa.refCode;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Villa calendar
          </p>
          <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {titleEn}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {villa.refCode} · Block holds or set nightly overrides in EUR.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={{ pathname: "/admin/villas/[id]", params: { id: String(numericId) } }}
            locale={locale}
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Edit villa
          </Link>
          <Link
            href="/admin/villas"
            locale={locale}
            className="text-sm font-medium text-amber-800 hover:underline dark:text-amber-200"
          >
            All villas
          </Link>
        </div>
      </div>

      <VillaCalendarAdmin
        villaId={numericId}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        defaultNightlyPriceCents={villa.defaultNightlyPriceCents}
        initialDays={calendarRows}
      />
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6">
      <div className="h-10 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-96 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}
