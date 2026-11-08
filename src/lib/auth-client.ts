import { createAuthClient } from "better-auth/client";

/**
 * Browser client for Better Auth — talks to {@link auth} via `/api/auth`.
 */
export const authClient = createAuthClient({
  basePath: "/api/auth",
});
