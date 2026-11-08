import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { getVillaBySlug } from "@/db/queries/villas.queries";
import { VillaDetailSkeleton } from "@/components/villa/VillaDetailSkeleton";
import { VillaDetailView } from "@/components/villa/VillaDetailView";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/locales";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * `await params` must run inside a Suspense boundary so prerender is not blocked
 * (Next.js Cache Components / partial prerender).
 */
export default async function VillaDetailPage({ params }: PageProps) {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  return (
    <main className="flex flex-1 flex-col">
      <Suspense fallback={<VillaDetailSkeleton />}>
        <VillaDetailPageContent params={params} locale={locale} />
      </Suspense>
    </main>
  );
}

async function VillaDetailPageContent({
  params,
  locale,
}: {
  params: Promise<{ slug: string }>;
  locale: Locale;
}) {
  const { slug } = await params;
  const row = await getVillaBySlug(slug, locale);
  if (row === null) {
    notFound();
  }

  return <VillaDetailView villaId={row.id} locale={locale} />;
}
