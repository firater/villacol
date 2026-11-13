import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EditorialPageFallback } from "@/components/content/EditorialPageFallback";
import { JournalHubView } from "@/components/journal/JournalHubView";
import { loadJournalHub } from "@/lib/journal-content";
import { isLocale, type Locale } from "@/lib/locales";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeRaw } = await params;
  if (!isLocale(localeRaw)) return {};
  const copy = await loadJournalHub(localeRaw);
  return { title: copy.metaTitle, description: copy.metaDescription };
}

export default function JournalHubPage({ params }: PageProps) {
  return (
    <Suspense fallback={<EditorialPageFallback />}>
      <JournalHubContent params={params} />
    </Suspense>
  );
}

async function JournalHubContent({ params }: PageProps) {
  const { locale: localeRaw } = await params;
  if (!isLocale(localeRaw)) notFound();
  const copy = await loadJournalHub(localeRaw as Locale);
  return <JournalHubView copy={copy} />;
}
