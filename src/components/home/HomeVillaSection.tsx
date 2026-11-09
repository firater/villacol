import { getTranslations } from "next-intl/server";

import { VillaCard, type VillaCardLayout } from "@/components/villa/VillaCard";
import {
  getBestValueLandingVillas,
  getOfferLandingVillas,
} from "@/db/queries/landing.queries";
import { getExchangeRates } from "@/db/queries/rates.queries";
import type { Locale } from "@/lib/locales";
import { resolvePreferences } from "@/lib/preferences";
import { sortOfferVillasForHomeRail } from "@/lib/home-offer-villa-sort";
import {
  buildExchangeRateMap,
  mapVillaCardRowToProps,
} from "@/lib/villa-listing-cards";

import { VillaCarousel } from "./VillaCarousel";

/** Which rail to render; each maps to one cached landing query. */
export type HomeSectionVariant = "featured" | "offers" | "bestValue";

const RAIL_SIZE = 6;
/** Pull a wider offer pool, then sort client-side before slicing the rail. */
const FEATURED_OFFER_POOL_SIZE = 24;

type Props = {
  locale: Locale;
  variant: HomeSectionVariant;
  cardLayout?: VillaCardLayout;
  carouselDensity?: "default" | "promo";
};

/**
 * Reads cookie-backed currency, so each rail must stay inside its own
 * `<Suspense>`: the hero above it still prerenders as static HTML.
 */
export async function HomeVillaSection({
  locale,
  variant,
  cardLayout = "default",
  carouselDensity = "default",
}: Props) {
  const [t, tCard, preferences, ratesRows, listing] = await Promise.all([
    getTranslations("layout.home"),
    getTranslations("layout.villaCard"),
    resolvePreferences(),
    getExchangeRates(),
    loadVillas(locale, variant),
  ]);

  const displayRows =
    variant === "featured"
      ? sortOfferVillasForHomeRail(listing.rows).slice(0, RAIL_SIZE)
      : listing.rows;

  if (displayRows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-10 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
        {t(EMPTY_KEYS[variant])}
      </p>
    );
  }

  const rates = buildExchangeRateMap(ratesRows);
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
    view: tCard("viewVilla"),
  };

  return (
    <VillaCarousel
      label={t(HEADING_KEYS[variant])}
      density={carouselDensity}
      items={displayRows.map((row) => ({
        key: String(row.id),
        node: (
          <VillaCard
            layout={cardLayout}
            viewLabel={cardCopy.view}
            {...mapVillaCardRowToProps(
              row,
              locale,
              preferences.currency,
              rates,
              cardCopy,
            )}
          />
        ),
      }))}
    />
  );
}

const HEADING_KEYS = {
  featured: "featuredHeading",
  offers: "offersHeading",
  bestValue: "bestValueHeading",
} as const;

const EMPTY_KEYS = {
  featured: "offersEmpty",
  offers: "offersEmpty",
  bestValue: "bestValueEmpty",
} as const;

function loadVillas(locale: Locale, variant: HomeSectionVariant) {
  if (variant === "featured") {
    return getOfferLandingVillas(locale, FEATURED_OFFER_POOL_SIZE);
  }
  if (variant === "offers") {
    return getOfferLandingVillas(locale, RAIL_SIZE);
  }
  return getBestValueLandingVillas(locale, RAIL_SIZE);
}
