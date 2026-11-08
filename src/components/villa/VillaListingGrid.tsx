import { getTranslations } from "next-intl/server";

import { JsonLd } from "@/components/seo/JsonLd";
import { getExchangeRates } from "@/db/queries/rates.queries";
import { getVillaListing } from "@/db/queries/villas.queries";
import { Link } from "@/i18n/navigation";
import {
  buildVillaFilterQuery,
  DEFAULT_PAGE_SIZE,
  normalizeVillaFilters,
  parseVillaFilters,
  toListingFilters,
  type SearchParamsInput,
  type VillaFilters,
} from "@/lib/search-params";
import { resolvePreferences } from "@/lib/preferences";
import type { Locale } from "@/lib/locales";
import { generateVillaListJsonLd } from "@/lib/seo/json-ld";
import {
  buildExchangeRateMap,
  mapVillaCardRowToProps,
} from "@/lib/villa-listing-cards";

import { VillaCard } from "./VillaCard";

type ListingPath = "/villas" | "/villa-offers";

type Props = {
  locale: Locale;
  searchParams: Promise<SearchParamsInput>;
  lockOffersOnly?: boolean;
  listingPath: ListingPath;
};

export async function VillaListingGrid({
  locale,
  searchParams,
  lockOffersOnly = false,
  listingPath,
}: Props) {
  const [t, tCard, tListing, preferences, ratesRows, resolvedSearch] =
    await Promise.all([
      getTranslations("filters"),
      getTranslations("layout.villaCard"),
      getTranslations("layout.listing"),
      resolvePreferences(),
      getExchangeRates(),
      searchParams,
    ]);

  const parsed = parseVillaFilters(resolvedSearch);
  const listingFilters = toListingFilters(parsed, locale, {
    lockOffersOnly,
  });
  const listing = await getVillaListing(listingFilters);

  const rates = buildExchangeRateMap(ratesRows);
  const currency = preferences.currency;
  const pageSize = listingFilters.pageSize ?? DEFAULT_PAGE_SIZE;
  const page = listingFilters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(listing.total / pageSize));

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

  const baseFilters: VillaFilters = lockOffersOnly
    ? { ...parsed, offersOnly: true }
    : parsed;

  const pageHref = (targetPage: number) => {
    const query = Object.fromEntries(
      buildVillaFilterQuery(
        normalizeVillaFilters({ ...baseFilters, page: targetPage }),
      ).entries(),
    );
    if (Object.keys(query).length === 0) {
      return { pathname: listingPath } as const;
    }
    return { pathname: listingPath, query } as const;
  };

  const prevHref = page > 1 ? pageHref(page - 1) : null;
  const nextHref = page < totalPages ? pageHref(page + 1) : null;

  const listJsonLd =
    listing.rows.length > 0
      ? generateVillaListJsonLd(
          listing.rows.map((row) => ({ name: row.title, slug: row.slug })),
          locale,
          listingPath,
        )
      : null;

  return (
    <div className="min-w-0 flex-1">
      {listJsonLd !== null ? <JsonLd data={listJsonLd} /> : null}
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t("resultCount", { count: listing.total })}
      </p>

      {listing.rows.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
          {tListing("empty")}
        </p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {listing.rows.map((row) => (
            <VillaCard
              key={row.id}
              {...mapVillaCardRowToProps(row, locale, currency, rates, cardCopy)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          className="mt-10 flex items-center justify-between gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800"
          aria-label={tListing("paginationLabel")}
        >
          {prevHref ? (
            <Link
              href={prevHref}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              {tListing("prev")}
            </Link>
          ) : (
            <span className="rounded-lg border border-transparent px-4 py-2 text-sm text-zinc-400">
              {tListing("prev")}
            </span>
          )}
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {tListing("pageOf", { page, total: totalPages })}
          </span>
          {nextHref ? (
            <Link
              href={nextHref}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              {tListing("next")}
            </Link>
          ) : (
            <span className="rounded-lg border border-transparent px-4 py-2 text-sm text-zinc-400">
              {tListing("next")}
            </span>
          )}
        </nav>
      ) : null}
    </div>
  );
}
