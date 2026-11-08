import { config } from "dotenv";

config({ path: ".env.local" });

/**
 * Applies pending migrations from ./drizzle. Run with `npm run db:migrate`.
 *
 * Uses the pooled WebSocket client, not the HTTP one: the migrator wraps each
 * migration in a transaction, which `drizzle-orm/neon-http` cannot do.
 *
 * `drizzle-kit push` is deliberately not used anywhere — it diffs straight to
 * the database and leaves no reviewable history of how the schema got there.
 */
async function main() {
  const { migrate } = await import("drizzle-orm/neon-serverless/migrator");
  const { dbPool, getPool } = await import("./pool");

  console.log("Applying migrations from ./drizzle ...");
  await migrate(dbPool, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");

  await getPool().end();
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
