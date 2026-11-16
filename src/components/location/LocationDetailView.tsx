import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { JsonLd } from "@/components/seo/JsonLd";
import { VillaCard } from "@/components/villa/VillaCard";
import { getExchangeRates } from "@/db/queries/rates.queries";
import type { LocationDetailRow } from "@/db/queries/locations.queries";
import { getLocationLandingVillas } from "@/db/queries/landing.queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/locales";
import { generateLocationJsonLd } from "@/lib/seo/json-ld";
import { toAbsoluteUrl } from "@/lib/seo/site-url";
import { absoluteLocalizedUrl } from "@/lib/seo/urls";
import { resolvePreferences } from "@/lib/preferences";
import {
  buildExchangeRateMap,
  mapVillaCardRowToProps,
} from "@/lib/villa-listing-cards";

const HERO_FALLBACK = "/smr3.jpg";

type Props = {
  location: LocationDetailRow;
  locale: Locale;
};

function heroSubtitle(
  description: string | null,
  fallback: string,
): string {
  if (description === null || description.trim() === "") return fallback;
  const first = description.trim().split(/\n+/)[0]?.trim() ?? "";
  if (first.length <= 160) return first;
  return `${first.slice(0, 157)}…`;
}

export async function LocationDetailView({ location, locale }: Props) {
  const [t, tCard, preferences, ratesRows, villaResult] = await Promise.all([
    getTranslations("locationDetail"),
    getTranslations("layout.villaCard"),
    resolvePreferences(),
    getExchangeRates(),
    getLocationLandingVillas(location.slug, locale, {
      page: 1,
      pageSize: 4,
      sort: "default",
    }),
  ]);

  const rates = buildExchangeRateMap(ratesRows);
  const { currency } = preferences;

  const pageUrl = absoluteLocalizedUrl(locale, {
    pathname: "/locations/[slug]",
    params: { slug: location.slug },
  });

  const heroSrc = location.heroImageUrl ?? HERO_FALLBACK;
  const heroAbsolute = heroSrc.startsWith("http")
    ? heroSrc
    : toAbsoluteUrl(heroSrc);

  const jsonLd = generateLocationJsonLd({
    name: location.name,
    description: location.description,
    pageUrl,
    latitude: location.latitude,
    longitude: location.longitude,
    imageUrl: heroAbsolute,
  });

  const cards = villaResult.rows.map((row) =>
    mapVillaCardRowToProps(row, locale, currency, rates, {
      wasPrice: (v) => tCard("wasPrice", v),
      perStay: (v) => tCard("perStay", v),
      nextAvailable: (v) => tCard("nextAvailable", v),
      firstAvailability: tCard("firstAvailability"),
      priceStartingAt: tCard("priceStartingAt"),
      perNight: tCard("perNight"),
      specialOffer: tCard("specialOffer"),
      editorsChoice: tCard("editorsChoice"),
    }),
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="flex flex-1 flex-col bg-stone-50/90 dark:bg-zinc-950">
        <section className="relative min-h-[28rem] w-full overflow-hidden bg-stone-900 sm:min-h-[32rem] lg:min-h-[36rem]">
          <Image
            src={heroSrc}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/45 to-stone-900/25"
            aria-hidden
          />
          <div className="relative mx-auto flex h-full min-h-[28rem] max-w-7xl flex-col justify-end px-4 pb-14 pt-32 sm:min-h-[32rem] sm:px-6 sm:pb-16 lg:min-h-[36rem] lg:px-8 lg:pb-20">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-stone-300">
              {t("eyebrow")}
            </p>
            <h1 className="mt-4 max-w-4xl font-serif text-[clamp(2.5rem,6vw,4rem)] font-semibold leading-[1.05] tracking-tight text-white">
              {location.name}
            </h1>
            <p className="mt-5 max-w-2xl font-sans text-lg font-light leading-relaxed text-stone-200/95">
              {heroSubtitle(location.description, t("heroSubtitleFallback"))}
            </p>
          </div>
        </section>

        {location.description ? (
          <section className="border-b border-stone-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/30">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
              <div className="max-w-3xl font-sans text-base leading-[1.85] text-stone-700 dark:text-stone-300">
                {location.description.split("\n").map((paragraph, index) =>
                  paragraph.trim() === "" ? null : (
                    <p key={index} className={index > 0 ? "mt-5" : undefined}>
                      {paragraph.trim()}
                    </p>
                  ),
                )}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <header className="mb-10 max-w-2xl">
            <h2 className="font-serif text-[clamp(1.75rem,3.5vw,2.25rem)] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
              {t("featuredHeading")}
            </h2>
            <p className="mt-3 text-sm font-light leading-relaxed text-stone-600 dark:text-stone-400">
              {t("featuredSubtitle", { location: location.name })}
            </p>
          </header>

          {cards.length > 0 ? (
            <ul className="grid gap-8 sm:grid-cols-2 lg:gap-10">
              {cards.map((card) => (
                <li key={card.slug}>
                  <VillaCard {...card} layout="default" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {t("featuredEmpty")}
            </p>
          )}

          <div className="mt-14 flex justify-center border-t border-stone-200/80 pt-12 dark:border-stone-800">
            <Link
              href={{
                pathname: "/villas",
                query: { location: location.slug },
              }}
              className="inline-flex items-center justify-center rounded-full bg-stone-900 px-8 py-3.5 font-sans text-sm font-semibold tracking-wide text-white transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
            >
              {t("viewAll", { location: location.name })}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}