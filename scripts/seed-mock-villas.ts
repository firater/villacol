/**
 * `npm run db:seed-mock-villas` — bulk mock catalogue for QA.
 */
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { seedMockVillas, MOCK_VILLA_COUNT } = await import(
    "@/db/seed-mock-villas"
  );
  const { getPool } = await import("@/db/pool");

  const started = Date.now();
  const result = await seedMockVillas();

  console.log(`\nMock villas seeded in ${Date.now() - started}ms\n`);
  console.log(`today              ${result.today}`);
  console.log(`villas upserted    ${result.villaCount} (MOCK-001 … MOCK-${String(MOCK_VILLA_COUNT).padStart(3, "0")})`);
  console.log(`calendar nights    ${result.calendarRowCount}`);
  console.log(`villa ids          ${result.villaIds.length} (price cache + search rebuilt)\n`);

  await getPool().end();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});