/**
 * Prints which category is "of the day" for the business calendar.
 *
 *   npx tsx scripts/cotd-dry-run.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { getBusinessToday } = await import("@/lib/dates");
  const {
    CATEGORY_OF_THE_DAY_PROMOTION_CODE,
    getCategoryOfTheDay,
    getCategoryOfTheDayLocalized,
    getCategoryOfTheDayPromotionId,
  } = await import("@/lib/category-of-the-day");
  const { dayOfYearFromDateString } = await import(
    "@/lib/category-of-the-day-rotation"
  );
  const { DEFAULT_LOCALE } = await import("@/lib/locales");

  const today = getBusinessToday();
  const [core, localized, promotionId] = await Promise.all([
    getCategoryOfTheDay(today),
    getCategoryOfTheDayLocalized(DEFAULT_LOCALE, today),
    getCategoryOfTheDayPromotionId(),
  ]);

  const { dbPool } = await import("@/db/pool");
  const { promotions } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const [promotionRow] = await dbPool
    .select({ id: promotions.id, code: promotions.code, name: promotions.name })
    .from(promotions)
    .where(eq(promotions.id, promotionId))
    .limit(1);

  console.log(
    JSON.stringify(
      {
        today,
        dayOfYear: dayOfYearFromDateString(today),
        categoryId: core.id,
        orderValue: core.orderValue,
        slug: localized.slug,
        label: localized.label,
        promotionCode: CATEGORY_OF_THE_DAY_PROMOTION_CODE,
        promotionId,
        promotionDbCode: promotionRow?.code ?? null,
        promotionDbName: promotionRow?.name ?? null,
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