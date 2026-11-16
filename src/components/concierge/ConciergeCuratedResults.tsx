import { getTranslations } from "next-intl/server";

import { VillaCard } from "@/components/villa/VillaCard";
import { findConciergeMatches } from "@/db/queries/concierge.queries";
import { getExchangeRates } from "@/db/queries/rates.queries";
import { Link } from "@/i18n/navigation";
import {
  buildConciergeListingHrefQuery,
  type ConciergeCriteria,
} from "@/lib/concierge-params";
import { applyConciergeStayQuotesToRows } from "@/lib/concierge-stay-quote";
import type { Locale } from "@/lib/locales";
import { resolvePreferences } from "@/lib/preferences";
import {
  buildExchangeRateMap,
  mapVillaCardRowToProps,
} from "@/lib/villa-listing-cards";

type Props = {
  locale: Locale;
  criteria: ConciergeCriteria;
};

export async function ConciergeCuratedResults({ locale, criteria }: Props) {
  const [t, tCard, preferences, ratesRows, listing] = await Promise.all([
    getTranslations("concierge.results"),
    getTranslations("layout.villaCard"),
    resolvePreferences(),
    getExchangeRates(),
    findConciergeMatches(locale, criteria),
  ]);

  const rates = buildExchangeRateMap(ratesRows);
  const { currency } = preferences;

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

  const rowsForCards = await applyConciergeStayQuotesToRows(listing.rows, {
    desiredNights: criteria.nights,
    guestCount: criteria.guests,
    locale,
  });

  const cards = rowsForCards.map((row) =>
    mapVillaCardRowToProps(row, locale, currency, rates, cardCopy),
  );

  const listingQuery = buildConciergeListingHrefQuery(criteria);

  return (
    <div className="space-y-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-stone-500">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 font-serif text-[clamp(1.85rem,4.5vw,2.75rem)] font-semibold leading-[1.08] tracking-tight text-stone-900 dark:text-stone-50">
          {listing.total > 0
            ? t("headline", { count: listing.total })
            : t("headlineEmpty")}
        </h1>
        <p className="mt-4 text-[15px] font-light leading-relaxed text-stone-600 dark:text-stone-400">
          {t("subtitle", {
            nights: criteria.nights,
            guests: criteria.guests,
          })}
        </p>
      </header>

      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-900/30 dark:text-stone-400">
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

      <div className="flex flex-col items-center gap-6 border-t border-stone-200/80 pt-12 dark:border-stone-800">
        {listing.total > 0 ? (
          <Link
            href={{
              pathname: "/villas",
              query: listingQuery,
            }}
            className="inline-flex items-center justify-center rounded-full bg-stone-900 px-8 py-3.5 font-sans text-sm font-semibold tracking-wide text-white transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
          >
            {t("seeAll", { count: listing.total })}
          </Link>
        ) : (
          <Link
            href="/villas"
            className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-8 py-3.5 text-sm font-semibold text-stone-900 transition hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          >
            {t("browseAll")}
          </Link>
        )}

        <Link
          href="/find-villa"
          className="text-sm font-medium text-stone-600 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        >
          {t("startOver")}
        </Link>
      </div>
    </div>
  );
}