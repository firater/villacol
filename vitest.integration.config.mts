import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * The integration suite, which needs a real Postgres and writes to it. It is a
 * separate config rather than a flag on the main one so `npm run test` stays a
 * pure, offline, parallel-safe run of the engine and the other pure functions.
 */
export default defineConfig({
  resolve: {
    alias: {
      // Order matters: the more specific key has to win over "@".
      "next/cache": fileURLToPath(
        new URL("./tests/stubs/next-cache.ts", import.meta.url),
      ),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["./tests/integration/setup.ts"],
    // The suite seeds the database and then reads it back, so two files running
    // at once would be rewriting each other's fixture.
    fileParallelism: false,
    // Seeding three villas plus 540 calendar nights over a serverless
    // connection is slower than a unit test by an order of magnitude.
    testTimeout: 120_000,
    hookTimeout: 180_000,
  },
});
