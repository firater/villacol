import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EditorialStaticPage } from "@/components/content/EditorialStaticPage";
import { EditorialPageFallback } from "@/components/content/EditorialPageFallback";
import { isLocale, type Locale } from "@/lib/locales";
import { loadEditorialStaticPage } from "@/lib/static-page-content";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeRaw } = await params;
  if (!isLocale(localeRaw)) return {};
  const copy = await loadEditorialStaticPage("about", localeRaw);
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
  };
}

export default function AboutPage({ params }: PageProps) {
  return (
    <Suspense fallback={<EditorialPageFallback />}>
      <AboutPageContent params={params} />
    </Suspense>
  );
}

async function AboutPageContent({ params }: PageProps) {
  const { locale: localeRaw } = await params;
  if (!isLocale(localeRaw)) notFound();
  const locale = localeRaw as Locale;
  const copy = await loadEditorialStaticPage("about", locale);

  return (
    <EditorialStaticPage
      eyebrow={copy.eyebrow}
      title={copy.title}
      intro={copy.intro}
      sections={copy.sections}
    />
  );
}
