/**
 * One-off: convert the legacy DIRECT20 coupon row into the Category of the Day
 * always-on 20% waiver and remove every villa link (cron repopulates daily).
 *
 *   npx tsx scripts/migrate-cotd-promotion.ts
 */
import { config } from "dotenv";
import { eq, inArray, or, sql } from "drizzle-orm";

config({ path: ".env.local" });

async function main() {
  const { dbPool } = await import("@/db/pool");
  const { promotions, villaPromotions } = await import("@/db/schema");
  const {
    CATEGORY_OF_THE_DAY_PROMOTION_NAME,
    LEGACY_COTD_PROMOTION_NAME,
  } = await import("@/lib/category-of-the-day");

  const [row] = await dbPool
    .select({ id: promotions.id, name: promotions.name })
    .from(promotions)
    .where(
      or(
        eq(promotions.name, LEGACY_COTD_PROMOTION_NAME),
        eq(promotions.name, CATEGORY_OF_THE_DAY_PROMOTION_NAME),
      ),
    )
    .limit(1);

  if (row === undefined) {
    throw new Error(
      `No promotion named "${LEGACY_COTD_PROMOTION_NAME}" or "${CATEGORY_OF_THE_DAY_PROMOTION_NAME}"`,
    );
  }

  await dbPool
    .update(promotions)
    .set({
      name: CATEGORY_OF_THE_DAY_PROMOTION_NAME,
      displayNameI18n: {
        en: "Category of the day — 20% commission waived",
        de: "Kategorie des Tages — 20 % Provision erlassen",
        ru: "Категория дня — комиссия 20% не взимается",
      },
      discountType: "commission_waiver",
      triggerType: "always",
      percentBp: 2_000,
      fixedAmountCents: null,
      freeNights: null,
      freeNightsThreshold: null,
      code: null,
      priorityOrder: -1_000,
      isStackable: false,
      isActive: true,
      updatedAt: new Date(),
    })
    .where(eq(promotions.id, row.id));

  const removed = await dbPool
    .delete(villaPromotions)
    .where(eq(villaPromotions.promotionId, row.id));

  console.log(
    JSON.stringify(
      {
        promotionId: row.id,
        previousName: row.name,
        villaLinksRemoved: removed.rowCount ?? 0,
      },
      null,
      2,
    ),
  );

  await dbPool.execute(sql`SELECT 1`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});