import { getTranslations } from "next-intl/server";

import type { Locale } from "@/lib/locales";

import { HomeCategoriesCarousel } from "./HomeCategoriesCarousel";
import { HOME_CATEGORIES_MOCK } from "./homeCategoriesMock";

type Props = {
  locale: Locale;
};

export async function HomeCategoriesSection({ locale: _locale }: Props) {
  const t = await getTranslations("layout.home");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <HomeCategoriesCarousel
        categories={HOME_CATEGORIES_MOCK}
        heading={t("categoriesHeading")}
        viewAllLabel={t("viewAllVillas")}
        kicker={t("categoriesBrowse")}
      />
    </div>
  );
}
