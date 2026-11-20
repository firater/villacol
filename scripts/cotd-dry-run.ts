/**
 * Prints which category is "of the day" for the business calendar.
 *
 *   npx tsx scripts/cotd-dry-run.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { getBusinessToday } = await import("@/lib/dates");
  const { getCategoryOfTheDay, getCategoryOfTheDayLocalized } = await import(
    "@/lib/category-of-the-day"
  );
  const { dayOfYearFromDateString } = await import(
    "@/lib/category-of-the-day-rotation"
  );
  const { DEFAULT_LOCALE } = await import("@/lib/locales");

  const today = getBusinessToday();
  const core = await getCategoryOfTheDay(today);
  const localized = await getCategoryOfTheDayLocalized(DEFAULT_LOCALE, today);

  console.log(
    JSON.stringify(
      {
        today,
        dayOfYear: dayOfYearFromDateString(today),
        categoryId: core.id,
        orderValue: core.orderValue,
        slug: localized.slug,
        label: localized.label,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});