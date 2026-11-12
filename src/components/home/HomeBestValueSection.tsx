import { getTranslations } from "next-intl/server";

import { VillaCard } from "@/components/villa/VillaCard";
import { getBestValueLandingVillas } from "@/db/queries/landing.queries";
import { getExchangeRates } from "@/db/queries/rates.queries";
import { toDisplayAmount } from "@/lib/currency";
import type { Locale } from "@/lib/locales";
import { resolvePreferences } from "@/lib/preferences";
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

    let { priceMain, stayLabel } = cardProps;
    const nights =
      row.cacheNightCount !== null && row.cacheNightCount > 0
        ? row.cacheNightCount
        : 3 + (row.id % 3);

    if (stayLabel === null) {
      stayLabel = cardCopy.perStay({ nights });
    }

    if (priceMain === "—" || row.priceFromCents === null) {
      const nightlyCents = row.avgNightlyCents ?? 18_500 + (row.id % 11) * 1_275;
      const mockTotalCents = nightlyCents * nights;
      priceMain = toDisplayAmount(
        mockTotalCents,
        preferences.currency,
        locale,
        rates,
      ).formatted;
    }

    return {
      key: String(row.id),
      card: {
        ...cardProps,
        priceMain,
        stayLabel,
        layout: "recommended" as const,
        viewLabel: cardCopy.view,
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
