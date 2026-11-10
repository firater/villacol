import { getTranslations } from "next-intl/server";

import { getExchangeRates } from "@/db/queries/rates.queries";
import { toDisplayAmount } from "@/lib/currency";
import type { Locale } from "@/lib/locales";
import { resolvePreferences } from "@/lib/preferences";
import { buildExchangeRateMap } from "@/lib/villa-listing-cards";

import { HomeCategoriesCarousel } from "./HomeCategoriesCarousel";
import {
  HOME_CATEGORIES_MOCK,
  HOME_CATEGORY_OF_THE_DAY_INDEX,
  HOME_EDITORS_CHOICE_LEAD,
} from "./homeCategoriesMock";

type Props = {
  locale: Locale;
};

export async function HomeCategoriesSection({ locale }: Props) {
  const [t, preferences, ratesRows] = await Promise.all([
    getTranslations("layout.home"),
    resolvePreferences(),
    getExchangeRates(),
  ]);

  const rates = buildExchangeRateMap(ratesRows);
  const { currency } = preferences;

  const formatFromEur = (eurCents: number) =>
    toDisplayAmount(eurCents, currency, locale, rates).formatted;

  const editorsChoice = {
    label: t("categoriesEditorsChoice"),
    image: HOME_EDITORS_CHOICE_LEAD.image,
    villaCount: HOME_EDITORS_CHOICE_LEAD.villaCount,
    priceFormatted: formatFromEur(HOME_EDITORS_CHOICE_LEAD.startingFromEurCents),
    isGoodDeal: HOME_EDITORS_CHOICE_LEAD.isGoodDeal,
  };

  const categories = HOME_CATEGORIES_MOCK.map((category) => ({
    slug: category.slug,
    label: category.label,
    image: category.image,
    villaCount: category.villaCount,
    priceFormatted: formatFromEur(category.startingFromEurCents),
    isGoodDeal: category.isGoodDeal,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <HomeCategoriesCarousel
        editorsChoice={editorsChoice}
        categories={categories}
        heading={t("categoriesHeading")}
        subtitle={t("categoriesSubtitle")}
        categoryOfTheDayLabel={t("categoriesOfTheDay")}
        categoryOfTheDayName={categories[HOME_CATEGORY_OF_THE_DAY_INDEX]?.label ?? ""}
        bestPriceGuaranteeLabel={t("categoriesBestPriceGuarantee")}
        viewAllLabel={t("viewAllVillas")}
        locale={locale}
      />
    </div>
  );
}
