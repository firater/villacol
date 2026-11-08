import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { env } from "@/env";

import * as schema from "./schema";

/**
 * Transactional write-path client, over Neon's WebSocket pool.
 *
 * Every cron job and every admin mutation that touches more than one table goes
 * through `dbPool.transaction(...)`. The HTTP client in `@/db` cannot do this:
 * it throws "No transactions support in neon-http driver".
 */
const pool = new Pool({ connectionString: env.DATABASE_URL });

export const dbPool = drizzle(pool, { schema, casing: "snake_case" });

export type PooledDatabase = typeof dbPool;

export type Transaction = Parameters<
  Parameters<PooledDatabase["transaction"]>[0]
>[0];

/** Raw pool access, for `pg_try_advisory_lock` which must pin one connection. */
export function getPool(): Pool {
  return pool;
}
