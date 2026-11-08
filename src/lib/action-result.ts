/**
 * The return contract for every server action.
 *
 * Actions return a discriminated result instead of throwing. A thrown error in
 * a Server Action reaches the client as an opaque "An error occurred in the
 * Server Components render" string with no field information, which is useless
 * for a form. Throwing is reserved for the auth guards, where the caller had no
 * business reaching the action at all.
 *
 * Not a `'use server'` module: it exports types and plain helpers, which that
 * directive forbids.
 */
import { APIError } from "@better-auth/core/error";
import type { z } from "zod";

/** Keyed by dotted field path; `_root` holds issues with no path. */
export type FieldErrors = Record<string, string[]>;

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export const ROOT_FIELD_KEY = "_root";

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T>(
  error: string,
  fieldErrors?: FieldErrors,
): ActionResult<T> {
  return fieldErrors === undefined
    ? { ok: false, error }
    : { ok: false, error, fieldErrors };
}

/**
 * Flattens a `ZodError` by hand rather than via `.flatten()`, so nested paths
 * like `translations.1.title` survive instead of collapsing into one bucket.
 */
export function invalid<T>(error: z.ZodError): ActionResult<T> {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const key =
      issue.path.length > 0
        ? issue.path.map((segment) => String(segment)).join(".")
        : ROOT_FIELD_KEY;

    (fieldErrors[key] ??= []).push(issue.message);
  }

  return { ok: false, error: "Validation failed.", fieldErrors };
}

/**
 * Converts whatever escaped an action body into a result.
 *
 * `requireAdmin()` throws a better-auth `APIError`, which carries a message
 * that is safe to show. Anything else is logged and reported generically, since
 * a raw Postgres error can leak column names and constraint definitions.
 */
export function toActionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof APIError) {
    return fail(error.message);
  }

  console.error("[action] unhandled error", error);
  return fail("Something went wrong. Please try again.");
}
