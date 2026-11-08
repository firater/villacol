/**
 * One-off script: creates the default admin user without seeding anything else.
 *
 * The implementation lives in `src/db/seed.ts` as `ensureAdminUser()` — the seed
 * needs the same bootstrap, and two copies of "how do we create a user through
 * Better Auth" would drift the moment its hashing or account-row shape changes.
 *
 * Run: `npm run create-admin` (requires `.env.local` with DATABASE_URL and
 * BETTER_AUTH_* — same as the app).
 */
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { ensureAdminUser } = await import("@/db/seed");
  const { getPool } = await import("@/db/pool");

  const admin = await ensureAdminUser();
  console.log(`Set role=admin for ${admin.email} (id ${admin.id}).`);

  await getPool().end();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
