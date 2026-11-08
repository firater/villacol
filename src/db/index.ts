import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "@/env";

import * as schema from "./schema";

/**
 * Read-path client. Uses Neon's HTTP driver: one round trip per statement, no
 * connection to keep alive, which is what you want for cached page reads.
 *
 * It cannot run transactions — `drizzle-orm/neon-http` throws
 * "No transactions support in neon-http driver". Anything that writes more than
 * one table must use `dbPool` from `@/db/pool` instead.
 */
const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, { schema, casing: "snake_case" });

export type Database = typeof db;
