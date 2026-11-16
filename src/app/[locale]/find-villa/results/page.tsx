import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { ConciergeCuratedResults } from "@/components/concierge/ConciergeCuratedResults";
import { ConciergeResultsSkeleton } from "@/components/concierge/ConciergeResultsSkeleton";
import { routing } from "@/i18n/routing";
import { parseConciergeResultsSearch } from "@/lib/concierge-params";
import type { Locale } from "@/lib/locales";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ConciergeResultsPage({ searchParams }: PageProps) {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  return (
    <main className="flex flex-1 flex-col bg-stone-50/90 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <Suspense fallback={<ConciergeResultsSkeleton />}>
          <ResultsContent searchParams={searchParams} locale={locale} />
        </Suspense>
      </div>
    </main>
  );
}

async function ResultsContent({
  searchParams,
  locale,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  locale: Locale;
}) {
  const resolved = await searchParams;
  const criteria = parseConciergeResultsSearch(resolved);

  return <ConciergeCuratedResults locale={locale} criteria={criteria} />;
}