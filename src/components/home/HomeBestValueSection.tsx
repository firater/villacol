import { getTranslations } from "next-intl/server";

import { VillaCard } from "@/components/villa/VillaCard";
import { getBestValueLandingVillas } from "@/db/queries/landing.queries";
import { getExchangeRates } from "@/db/queries/rates.queries";
import type { VillaCardRow } from "@/db/queries/villas.queries";
import type { Locale } from "@/lib/locales";
import { resolvePreferences } from "@/lib/preferences";
import { formatPromotionBadges } from "@/lib/promo-badge-labels";
import {
  buildExchangeRateMap,
  mapVillaCardRowToProps,
} from "@/lib/villa-listing-cards";

import { HomeBestValueRail } from "./HomeBestValueRail";

type Props = {
  locale: Locale;
};

export async function HomeBestValueSection({ locale }: Props) {
  const [t, tCard, tHome, preferences, ratesRows, listing] = await Promise.all([
    getTranslations("layout.home.bestValueStaysBanner"),
    getTranslations("layout.villaCard"),
    getTranslations("layout.home"),
    resolvePreferences(),
    getExchangeRates(),
    getBestValueLandingVillas(locale, 6),
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

  const items = listing.rows.map((row) => {
    const cardProps = mapVillaCardRowToProps(
      row,
      locale,
      preferences.currency,
      rates,
      cardCopy,
    );

    return {
      key: String(row.id),
      card: {
        ...cardProps,
        layout: "recommended" as const,
        viewLabel: cardCopy.view,
        promotionBadges: formatPromotionBadges(
          row.appliedPromotions,
          locale,
          preferences.currency,
          rates,
        ),
        editorRating: readEditorRating(row),
        promoStatLabels: {
          guests: tCard("statGuests"),
          bedrooms: tCard("statBedrooms"),
          bathrooms: tCard("statBathrooms"),
        },
      },
    };
  });

  return (
    <HomeBestValueRail
      bannerTitle={t("title")}
      carouselLabel={tHome("bestValueHeading")}
      emptyLabel={tHome("bestValueEmpty")}
      scrollLeftLabel={t("scrollLeft")}
      scrollRightLabel={t("scrollRight")}
      items={items}
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
