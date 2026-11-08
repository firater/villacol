import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/env";

/**
 * Better Auth instance for server-side use (route handlers, server actions).
 *
 * - Database: same Drizzle `db` instance the rest of the app reads through
 *   (`neon-http`). The adapter sets `transaction: false` because that driver
 *   cannot run `BEGIN`/`COMMIT`; multi-step writes run sequentially instead.
 * - Email + password: enabled; outbound verification email is not configured in
 *   Phase 2.
 * - `user.additionalFields.role` mirrors {@link schema.user}'s `role` column so
 *   session payloads include it.
 */
export const auth = betterAuth({
  appName: "Villa",
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
    transaction: false,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        fieldName: "role",
        required: false,
        defaultValue: "guest",
        input: false,
        returned: true,
      },
    },
  },
  plugins: [nextCookies()],
});

export type SessionPayload = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;
