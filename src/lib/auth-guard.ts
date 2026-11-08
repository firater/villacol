import { APIError } from "@better-auth/core/error";
import { headers } from "next/headers";

import type { UserRole } from "@/db/tables/enums";

import { auth, type SessionPayload } from "@/lib/auth";

type AuthUser = SessionPayload["user"];
type AuthSession = SessionPayload["session"];

export type AuthContext = {
  session: AuthSession;
  user: AuthUser & { role: UserRole };
};

function parseRole(role: unknown): UserRole {
  if (role === "admin" || role === "editor" || role === "guest") return role;
  return "guest";
}

/**
 * Current session + user from the incoming request cookies, or `null` when
 * unauthenticated. Server actions and route handlers call this first.
 */
export async function getCurrentUser(): Promise<AuthContext | null> {
  const requestHeaders = await headers();
  const forwarded = new Headers();
  requestHeaders.forEach((value, key) => {
    forwarded.set(key, value);
  });

  const data = await auth.api.getSession({ headers: forwarded });
  if (!data?.session || !data.user) return null;

  return {
    session: data.session as AuthSession,
    user: { ...data.user, role: parseRole(data.user.role) } as AuthContext["user"],
  };
}

/**
 * Throws when there is no session. Use at the top of protected server actions.
 */
export async function requireUser(): Promise<AuthContext> {
  const ctx = await getCurrentUser();
  if (!ctx) {
    throw new APIError("UNAUTHORIZED", {
      message: "You must be signed in.",
    });
  }
  return ctx;
}

/**
 * Throws when the signed-in user is neither `admin` nor `editor`.
 */
export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await requireUser();
  if (ctx.user.role !== "admin" && ctx.user.role !== "editor") {
    throw new APIError("FORBIDDEN", {
      message: "Admin access required.",
    });
  }
  return ctx;
}
