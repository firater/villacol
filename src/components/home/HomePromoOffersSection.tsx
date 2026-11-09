import { getTranslations } from "next-intl/server";

import { getOfferLandingVillas } from "@/db/queries/landing.queries";
import { getExchangeRates } from "@/db/queries/rates.queries";
import type { Locale } from "@/lib/locales";
import { resolvePreferences } from "@/lib/preferences";
import {
  buildExchangeRateMap,
  mapVillaCardRowToProps,
} from "@/lib/villa-listing-cards";

import { PromoOffersRail } from "./PromoOffersRail";

const RAIL_SIZE = 6;

type Props = {
  locale: Locale;
};

export async function HomePromoOffersSection({ locale }: Props) {
  const [t, tCard, preferences, ratesRows, listing] = await Promise.all([
    getTranslations("layout.home"),
    getTranslations("layout.villaCard"),
    resolvePreferences(),
    getExchangeRates(),
    getOfferLandingVillas(locale, RAIL_SIZE),
  ]);

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

  const items = listing.rows.map((row) => ({
    key: String(row.id),
    hasActiveDiscount: row.hasActiveDiscount,
    appliedPromotions: row.appliedPromotions,
    card: {
      ...mapVillaCardRowToProps(row, locale, preferences.currency, rates, cardCopy),
      viewLabel: cardCopy.view,
      promoStatLabels: {
        guests: tCard("statGuests"),
        bedrooms: tCard("statBedrooms"),
        bathrooms: tCard("statBathrooms"),
      },
      promoRatingLabels: {
        noUserReviews: tCard("noUserReviews"),
        noUserReviewsAria: tCard("noUserReviewsAria"),
        editorScoreLabel: tCard("editorScoreLabel"),
      },
    },
  }));

  return (
    <PromoOffersRail
      items={items}
      carouselLabel={t("offersHeading")}
      sectionEmptyLabel={t("offersEmpty")}
    />
  );
}
