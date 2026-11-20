import { getTranslations } from "next-intl/server";

import type { BestValueVillaCardProps } from "@/components/villa/BestValueVillaCard";
import { getBestValueLandingVillas } from "@/db/queries/landing.queries";
import { getExchangeRates } from "@/db/queries/rates.queries";
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

  const statLabels = {
    guests: tCard("statGuests"),
    bedrooms: tCard("statBedrooms"),
    bathrooms: tCard("statBathrooms"),
  };

  const items: { key: string; card: BestValueVillaCardProps }[] = listing.rows.map((row) => {
    const cardProps = mapVillaCardRowToProps(
      row,
      locale,
      preferences.currency,
      rates,
      cardCopy,
    );

    const displayNightly = cardProps.nightlyPrice ?? cardProps.priceMain;
    const stayTotalLine =
      cardProps.priceMain !== "—" && cardProps.stayLabel
        ? `${cardProps.priceMain} ${cardProps.stayLabel}`
        : cardProps.stayLabel;

    const openRangeLabel = cardProps.cacheStayRangeLabel
      ? tCard("openStayRange", { range: cardProps.cacheStayRangeLabel })
      : cardProps.availabilityLabel;

    return {
      key: String(row.id),
      card: {
        slug: cardProps.slug,
        title: cardProps.title,
        location: cardProps.location,
        imageUrl: cardProps.imageUrl,
        imageAlt: cardProps.imageAlt,
        displayNightly,
        perNightLabel: cardProps.perNightLabel,
        openRangeLabel,
        stayTotalLine,
        priceWas: cardProps.priceWas,
        capacity: cardProps.capacity,
        bedrooms: cardProps.bedrooms,
        bathrooms: cardProps.bathrooms,
        statLabels,
        promotionBadges: formatPromotionBadges(
          row.appliedPromotions,
          locale,
          preferences.currency,
          rates,
        ),
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