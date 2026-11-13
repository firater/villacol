import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ContactForm } from "@/components/contact/ContactForm";
import { ContactInfoPanel } from "@/components/contact/ContactInfoPanel";
import { ContactPageFallback } from "@/components/content/ContactPageFallback";
import { loadContactPageCopy } from "@/lib/contact-page-content";
import { isLocale, type Locale } from "@/lib/locales";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeRaw } = await params;
  if (!isLocale(localeRaw)) return {};
  const copy = await loadContactPageCopy(localeRaw);
  return {
    title: copy.page.metaTitle,
    description: copy.page.metaDescription,
  };
}

export default function ContactPage({ params }: PageProps) {
  return (
    <Suspense fallback={<ContactPageFallback />}>
      <ContactPageContent params={params} />
    </Suspense>
  );
}

async function ContactPageContent({ params }: PageProps) {
  const { locale: localeRaw } = await params;
  if (!isLocale(localeRaw)) notFound();
  const locale = localeRaw as Locale;
  const copy = await loadContactPageCopy(locale);
  const page = copy.page;

  return (
    <main className="flex flex-1 flex-col bg-stone-50/90 dark:bg-zinc-950">
      <header className="border-b border-stone-200/80 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-stone-500 dark:text-zinc-500">
            {page.eyebrow}
          </p>
          <h1 className="mt-4 max-w-2xl font-serif text-[clamp(2.25rem,5vw,3.25rem)] font-semibold leading-[1.1] tracking-tight text-stone-900 dark:text-zinc-50">
            {page.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg font-light leading-[1.7] text-stone-600 dark:text-zinc-400">
            {page.intro}
          </p>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-14 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:py-20">
        <div className="min-w-0">
          <p className="mb-6 text-[10px] font-medium uppercase tracking-[0.28em] text-stone-400">
            {page.formSectionLabel}
          </p>
          <ContactForm />
        </div>
        <ContactInfoPanel copy={copy} />
      </div>
    </main>
  );
}
