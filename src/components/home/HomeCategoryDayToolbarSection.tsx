import { getLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";

import { routing } from "@/i18n/routing";
import { getCategoryOfTheDayLocalized } from "@/lib/category-of-the-day";
import { getBusinessToday } from "@/lib/dates";
import type { Locale } from "@/lib/locales";

import { CategoryDayToolbar } from "./CategoryDayToolbar";

export async function HomeCategoryDayToolbarSection() {
  const localeRaw = await getLocale();
  const locale = (
    hasLocale(routing.locales, localeRaw) ? localeRaw : routing.defaultLocale
  ) as Locale;
  const today = getBusinessToday();
  const [t, categoryOfTheDay] = await Promise.all([
    getTranslations("layout.home"),
    getCategoryOfTheDayLocalized(locale, today),
  ]);

  return (
    <section className="w-full bg-white" aria-label={t("categoriesOfTheDay")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <CategoryDayToolbar
          categoryOfTheDay={{ slug: categoryOfTheDay.slug, label: categoryOfTheDay.label }}
          categoryOfTheDayLabel={t("categoriesOfTheDay")}
          categoryOfTheDayName={categoryOfTheDay.label}
          bestPriceGuaranteeLabel={t("categoriesBestPriceGuarantee")}
          viewAllLabel={t("viewAllVillas")}
        />
      </div>
    </section>
  );
}