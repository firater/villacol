import { getTranslations } from "next-intl/server";

import { VillaCard, type VillaCardLayout } from "@/components/villa/VillaCard";
import {
  getBestValueLandingVillas,
  getFeaturedLandingVillas,
  getOfferLandingVillas,
} from "@/db/queries/landing.queries";
import { getExchangeRates } from "@/db/queries/rates.queries";
import type { VillaCardRow } from "@/db/queries/villas.queries";
import type { Locale } from "@/lib/locales";
import { resolvePreferences } from "@/lib/preferences";
import { formatPromotionBadges } from "@/lib/promo-badge-labels";
import {
  buildExchangeRateMap,
  mapVillaCardRowToProps,
} from "@/lib/villa-listing-cards";

import { VillaCarousel } from "./VillaCarousel";

/** Which rail to render; each maps to one cached landing query. */
export type HomeSectionVariant = "featured" | "offers" | "bestValue";

const RAIL_SIZE = 6;

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

  const displayRows = listing.rows;

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

  const promoRatingLabels = {
    noUserReviews: tCard("noUserReviews"),
    noUserReviewsAria: tCard("noUserReviewsAria"),
    editorScoreLabel: tCard("editorScoreLabel"),
  };

  return (
    <VillaCarousel
      label={t(HEADING_KEYS[variant])}
      density={carouselDensity}
      items={displayRows.map((row) => ({
        key: String(row.id),
        node: buildVillaCardNode({
          row,
          locale,
          currency: preferences.currency,
          rates,
          cardCopy,
          viewLabel: cardCopy.view,
          cardLayout,
          carouselDensity,
          promoRatingLabels,
          statLabels:
            cardLayout === "recommended" || carouselDensity === "promo"
              ? {
                  guests: tCard("statGuests"),
                  bedrooms: tCard("statBedrooms"),
                  bathrooms: tCard("statBathrooms"),
                }
              : undefined,
        }),
      }))}
    />
  );
}

function buildVillaCardNode({
  row,
  locale,
  currency,
  rates,
  cardCopy,
  viewLabel,
  cardLayout,
  carouselDensity,
  promoRatingLabels,
  statLabels,
}: {
  row: VillaCardRow;
  locale: Locale;
  currency: Parameters<typeof mapVillaCardRowToProps>[2];
  rates: Parameters<typeof mapVillaCardRowToProps>[3];
  cardCopy: Parameters<typeof mapVillaCardRowToProps>[4];
  viewLabel: string;
  cardLayout: VillaCardLayout;
  carouselDensity: "default" | "promo";
  promoRatingLabels: {
    noUserReviews: string;
    noUserReviewsAria: string;
    editorScoreLabel: string;
  };
  statLabels?: {
    guests: string;
    bedrooms: string;
    bathrooms: string;
  };
}) {
  const cardProps = mapVillaCardRowToProps(row, locale, currency, rates, cardCopy);

  return (
    <VillaCard
      layout={carouselDensity === "promo" ? "promo" : cardLayout}
      viewLabel={viewLabel}
      promoStatLabels={statLabels}
      promoRatingLabels={promoRatingLabels}
      promotionBadges={formatPromotionBadges(
        row.appliedPromotions,
        locale,
        currency,
        rates,
      )}
      editorRating={readEditorRating(row)}
      {...cardProps}
    />
  );
}

function readEditorRating(row: VillaCardRow): number | null {
  const extended = row as VillaCardRow & { editorRating?: number | null };
  if (extended.editorRating == null || !Number.isFinite(extended.editorRating)) {
    return null;
  }
  return extended.editorRating;
}

const HEADING_KEYS = {
  featured: "featuredHeading",
  offers: "offersHeading",
  bestValue: "bestValueHeading",
} as const;

const EMPTY_KEYS = {
  featured: "featuredEmpty",
  offers: "offersEmpty",
  bestValue: "bestValueEmpty",
} as const;

function loadVillas(locale: Locale, variant: HomeSectionVariant) {
  if (variant === "featured") {
    return getFeaturedLandingVillas(locale, RAIL_SIZE);
  }
  if (variant === "offers") {
    return getOfferLandingVillas(locale, RAIL_SIZE);
  }
  return getBestValueLandingVillas(locale, RAIL_SIZE);
}
