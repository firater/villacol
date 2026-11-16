import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";

import { ConciergeWizard } from "@/components/concierge/ConciergeWizard";
import { listCategoryNavLinks } from "@/db/queries/categories.queries";
import { getVillaFilterFacets } from "@/db/queries/filter-facets.queries";
import { listLocationNavLinks } from "@/db/queries/locations.queries";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/locales";

export default async function FindVillaPage() {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  const [t, featuredLocations, facets, featuredCategories] = await Promise.all([
    getTranslations("concierge"),
    listLocationNavLinks(locale),
    getVillaFilterFacets(locale),
    listCategoryNavLinks(locale),
  ]);

  const featuredLocationOptions = featuredLocations.map((row) => ({
    slug: row.slug,
    name: row.name,
  }));
  const allLocationOptions = facets.locations.map((row) => ({
    slug: row.value,
    name: row.label,
  }));
  const featuredCategoryOptions = featuredCategories.map((row) => ({
    slug: row.slug,
    name: row.name,
  }));
  const allCategoryOptions = facets.categories.map((row) => ({
    slug: row.value,
    name: row.label,
  }));

  return (
    <main className="flex flex-1 flex-col bg-stone-50/90 dark:bg-zinc-950">
      <div className="border-b border-stone-200/80 bg-white dark:border-stone-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-14 lg:py-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-stone-500">
            {t("eyebrow")}
          </p>
          <h1 className="mt-3 font-serif text-[clamp(2rem,4.5vw,2.75rem)] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            {t("title")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] font-light leading-relaxed text-stone-600 dark:text-stone-400">
            {t("intro")}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <ConciergeWizard
          featuredLocations={featuredLocationOptions}
          allLocations={allLocationOptions}
          featuredCategories={featuredCategoryOptions}
          allCategories={allCategoryOptions}
        />
      </div>
    </main>
  );
}