/**
 * Loads `.env.local` before any test module is imported, because `@/env` parses
 * `process.env` at import time and throws on a missing `DATABASE_URL`.
 */
import { config } from "dotenv";

config({ path: ".env.local" });

if (process.env.DATABASE_URL === undefined) {
  throw new Error(
    "The integration suite talks to a real database. Set DATABASE_URL in .env.local first.",
  );
}
