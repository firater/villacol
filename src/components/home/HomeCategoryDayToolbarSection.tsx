import { getLocale, getTranslations } from "next-intl/server";

import { getHomeCategoriesCarouselData } from "@/db/queries/home-categories.queries";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/locales";

import { CategoryDayToolbar } from "./CategoryDayToolbar";
import { HOME_CATEGORY_OF_THE_DAY_INDEX } from "./homeCategoryConstants";

export async function HomeCategoryDayToolbarSection() {
  const localeRaw = await getLocale();
  const locale = (
    hasLocale(routing.locales, localeRaw) ? localeRaw : routing.defaultLocale
  ) as Locale;
  const [t, carouselData] = await Promise.all([
    getTranslations("layout.home"),
    getHomeCategoriesCarouselData(locale),
  ]);
  const categoryOfTheDay = carouselData.categories[HOME_CATEGORY_OF_THE_DAY_INDEX];

  return (
    <section className="w-full bg-white" aria-label={t("categoriesOfTheDay")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <CategoryDayToolbar
          categoryOfTheDay={
            categoryOfTheDay
              ? { slug: categoryOfTheDay.slug, label: categoryOfTheDay.label }
              : undefined
          }
          categoryOfTheDayLabel={t("categoriesOfTheDay")}
          categoryOfTheDayName={categoryOfTheDay?.label ?? ""}
          bestPriceGuaranteeLabel={t("categoriesBestPriceGuarantee")}
          viewAllLabel={t("viewAllVillas")}
        />
      </div>
    </section>
  );
}
