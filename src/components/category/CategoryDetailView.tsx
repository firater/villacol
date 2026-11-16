import { getTranslations } from "next-intl/server";

import { JsonLd } from "@/components/seo/JsonLd";
import { VillaCard } from "@/components/villa/VillaCard";
import type { CategoryDetailRow } from "@/db/queries/categories.queries";
import { getCategoryLandingVillas } from "@/db/queries/landing.queries";
import { getExchangeRates } from "@/db/queries/rates.queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/locales";

const CATEGORY_PREVIEW_LIMIT = 6;
import { generateCategoryJsonLd } from "@/lib/seo/json-ld";
import { absoluteLocalizedUrl } from "@/lib/seo/urls";
import { resolvePreferences } from "@/lib/preferences";
import {
  buildExchangeRateMap,
  mapVillaCardRowToProps,
} from "@/lib/villa-listing-cards";

type Props = {
  category: CategoryDetailRow;
  locale: Locale;
};

function descriptionParagraphs(description: string | null): string[] {
  if (description === null || description.trim() === "") return [];
  return description
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p !== "");
}

export async function CategoryDetailView({ category, locale }: Props) {
  const [t, tCard, preferences, ratesRows, villaResult] = await Promise.all([
    getTranslations("categoryDetail"),
    getTranslations("layout.villaCard"),
    resolvePreferences(),
    getExchangeRates(),
    getCategoryLandingVillas(category.slug, locale, {
      page: 1,
      pageSize: CATEGORY_PREVIEW_LIMIT,
      sort: "default",
    }),
  ]);

  const rates = buildExchangeRateMap(ratesRows);
  const { currency } = preferences;

  const pageUrl = absoluteLocalizedUrl(locale, {
    pathname: "/categories/[slug]",
    params: { slug: category.slug },
  });

  const jsonLd = generateCategoryJsonLd({
    name: category.name,
    description: category.description,
    pageUrl,
  });

  const cardCopy = {
    wasPrice: (values: { price: string }) =>
      tCard("wasPrice", { price: values.price }),
    perStay: (values: { nights: number }) =>
      tCard("perStay", { nights: values.nights }),
    nextAvailable: (values: { range: string }) =>
      tCard("nextAvailable", { range: values.range }),
    firstAvailability: tCard("firstAvailability"),
    priceStartingAt: tCard("priceStartingAt"),
    perNight: tCard("perNight"),
    specialOffer: tCard("specialOffer"),
    editorsChoice: tCard("editorsChoice"),
  };

  const cards = villaResult.rows.map((row) =>
    mapVillaCardRowToProps(row, locale, currency, rates, cardCopy),
  );

  const paragraphs = descriptionParagraphs(category.description);
  const showViewAll = villaResult.total > cards.length || cards.length > 0;

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="flex flex-1 flex-col bg-stone-50/90 dark:bg-zinc-950">
        <header className="border-b border-stone-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-11 lg:px-8 lg:py-12">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-stone-500 dark:text-stone-400">
              {t("eyebrow")}
            </p>
            <h1 className="mt-3 max-w-4xl font-serif text-[clamp(2rem,4.5vw,2.75rem)] font-semibold leading-[1.08] tracking-tight text-stone-900 dark:text-stone-50">
              {category.name}
            </h1>
            {paragraphs.length > 0 ? (
              <div className="mt-4 max-w-3xl space-y-3 font-sans text-[15px] font-light leading-[1.75] text-stone-600 dark:text-stone-400">
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="mt-4 max-w-2xl font-sans text-[15px] font-light leading-[1.75] text-stone-600 dark:text-stone-400">
                {t("descriptionFallback")}
              </p>
            )}
          </div>
        </header>

        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
          {cards.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center text-sm text-stone-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
              {t("empty")}
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <li key={card.slug}>
                  <VillaCard {...card} layout="default" />
                </li>
              ))}
            </ul>
          )}

          {showViewAll ? (
            <div className="mt-14 flex justify-center border-t border-stone-200/80 pt-12 dark:border-stone-800">
              <Link
                href={{
                  pathname: "/villas",
                  query: { category: category.slug },
                }}
                className="inline-flex items-center justify-center rounded-full bg-stone-900 px-8 py-3.5 font-sans text-sm font-semibold tracking-wide text-white transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
              >
                {t("viewAll", { category: category.name })}
              </Link>
            </div>
          ) : null}
        </section>
      </main>
    </>
  );
}