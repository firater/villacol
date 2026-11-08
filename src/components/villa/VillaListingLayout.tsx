import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import type { Locale } from "@/lib/locales";
import type { SearchParamsInput } from "@/lib/search-params";

import { VillaFiltersPanel } from "./VillaFiltersPanel";
import { VillaFiltersSkeleton } from "./VillaFiltersSkeleton";
import { VillaListingGrid } from "./VillaListingGrid";
import { VillaListingSkeleton } from "./VillaListingSkeleton";

type Props = {
  locale: Locale;
  searchParams: Promise<SearchParamsInput>;
  lockOffersOnly: boolean;
  titleKey: "allVillas" | "offers";
};

export async function VillaListingLayout({
  locale,
  searchParams,
  lockOffersOnly,
  titleKey,
}: Props) {
  const t = await getTranslations("layout.listing");

  return (
    <main className="flex flex-1 flex-col">
      <div className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            {t(titleKey)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:px-8">
        <Suspense fallback={<VillaFiltersSkeleton />}>
          <VillaFiltersPanel locale={locale} lockOffersOnly={lockOffersOnly} />
        </Suspense>

        <Suspense fallback={<VillaListingSkeleton />}>
          <VillaListingGrid
            locale={locale}
            searchParams={searchParams}
            lockOffersOnly={lockOffersOnly}
            listingPath={lockOffersOnly ? "/villa-offers" : "/villas"}
          />
        </Suspense>
      </div>
    </main>
  );
}
