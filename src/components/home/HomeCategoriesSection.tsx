import { getTranslations } from "next-intl/server";

import { getHomeCategoriesCarouselData } from "@/db/queries/home-categories.queries";
import { getExchangeRates } from "@/db/queries/rates.queries";
import { toDisplayAmount } from "@/lib/currency";
import type { Locale } from "@/lib/locales";
import { resolvePreferences } from "@/lib/preferences";
import { buildExchangeRateMap } from "@/lib/villa-listing-cards";

import { HomeFeaturedBestValueBridge } from "./HomeFeaturedBestValueBridge";
import { HomeCategoriesCarousel } from "./HomeCategoriesCarousel";

type Props = {
  locale: Locale;
};

export async function HomeCategoriesSection({ locale }: Props) {
  const [t, preferences, ratesRows, carouselData] = await Promise.all([
    getTranslations("layout.home"),
    resolvePreferences(),
    getExchangeRates(),
    getHomeCategoriesCarouselData(locale),
  ]);

  const rates = buildExchangeRateMap(ratesRows);
  const { currency } = preferences;

  const formatFromEur = (eurCents: number | null) => {
    if (eurCents === null) return "—";
    return toDisplayAmount(eurCents, currency, locale, rates).formatted;
  };

  const editorsChoice = {
    label: t("categoriesEditorsChoice"),
    image: carouselData.editorsChoice.image,
    villaCount: carouselData.editorsChoice.villaCount,
    priceFormatted: formatFromEur(carouselData.editorsChoice.startingFromEurCents),
    isGoodDeal: carouselData.editorsChoice.isGoodDeal,
  };

  const categories = carouselData.categories.map((category) => ({
    slug: category.slug,
    label: category.label,
    image: category.image,
    villaCount: category.villaCount,
    priceFormatted: formatFromEur(category.startingFromEurCents),
    isGoodDeal: category.isGoodDeal,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8 lg:mb-10">
        <HomeFeaturedBestValueBridge instanceId="categories" embedded />
      </div>

      <HomeCategoriesCarousel
        editorsChoice={editorsChoice}
        categories={categories}
        heading={t("categoriesHeading")}
        subtitle={t("categoriesSubtitle")}
        locale={locale}
      />
    </div>
  );
}
