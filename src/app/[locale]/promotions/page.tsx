import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { PromotionsHubView } from "@/components/promotions/PromotionsHubView";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/locales";

function PromotionsHubFallback() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-8 px-4 py-12" aria-busy>
      <div className="h-10 w-2/3 rounded bg-stone-200 dark:bg-stone-800" />
      <div className="h-4 w-full max-w-xl rounded bg-stone-100 dark:bg-stone-900" />
      <div className="h-48 border border-stone-200 dark:border-stone-800" />
      <div className="h-48 border border-stone-200 dark:border-stone-800" />
    </div>
  );
}

export default function PromotionsHubPage() {
  return (
    <main className="flex flex-1 flex-col bg-stone-50/50 dark:bg-zinc-950">
      <Suspense fallback={<PromotionsHubFallback />}>
        <PromotionsHubContent />
      </Suspense>
    </main>
  );
}

async function PromotionsHubContent() {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  void (localeRaw as Locale);

  return <PromotionsHubView />;
}
