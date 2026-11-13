/**
 * `npm run db:seed` entry point.
 *
 * The seed itself lives in `src/db/seed.ts` so the price-cache drift check can
 * import and run it. This file only loads `.env.local` and prints the result —
 * and it has to load the env before importing anything that reaches `@/env`,
 * which is why the import below is dynamic.
 */
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { seed } = await import("@/db/seed");
  const { getPool } = await import("@/db/pool");
  const { rebuildVillaSearchDocuments } = await import("@/lib/search/indexer");

  const started = Date.now();
  const result = await seed();

  // The seed writes villa and taxonomy text directly, bypassing the admin
  // actions that would normally enqueue a reindex, so search would come back
  // empty until the nightly cron ran.
  const indexed = await rebuildVillaSearchDocuments();

  const lines = [
    `today              ${result.today}`,
    `admin              ${result.adminEmail}`,
    `locations          ${result.locationCount}`,
    `categories         ${result.categoryCount}`,
    `amenities          ${result.amenityCount}`,
    `features           ${result.featureCount}`,
    `villa rules        ${result.ruleCount}`,
    `villas             ${result.villaCount}`,
    `calendar nights    ${result.calendarRowCount}`,
    `promotions         ${result.promotionCount} (${result.activePromotionCount} active)`,
    `villa promotions   ${result.villaPromotionLinkCount} links`,
    `search synonyms    ${result.synonymCount}`,
    `deals              ${result.dealCount}`,
    `guest reviews      ${result.reviewCount}`,
    `search documents   ${indexed.processedCount} written, ${indexed.failedCount} failed`,
  ];

  console.log(`\nSeeded in ${Date.now() - started}ms\n`);
  console.log(lines.join("\n"));
  const inactive = result.promotionCount - result.activePromotionCount;
  console.log(
    `\nThe ${inactive} inactive promotions cover the remaining discount_type x trigger_type\n` +
      "pairs. Flip is_active and attach one to a villa to exercise those branches;\n" +
      "they are off by default so the stackable ones do not compound a seeded stay\n" +
      "down to nothing.\n",
  );

  await getPool().end();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
