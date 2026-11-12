import { getTranslations } from "next-intl/server";

import { CategoryDayToolbar } from "./CategoryDayToolbar";
import {
  HOME_CATEGORIES_MOCK,
  HOME_CATEGORY_OF_THE_DAY_INDEX,
} from "./homeCategoriesMock";

export async function HomeCategoryDayToolbarSection() {
  const t = await getTranslations("layout.home");
  const categoryOfTheDay = HOME_CATEGORIES_MOCK[HOME_CATEGORY_OF_THE_DAY_INDEX];

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
