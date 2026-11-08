"use server";

import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { dbPool } from "@/db/pool";
import { contactMessages } from "@/db/schema";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { resolvePreferences } from "@/lib/preferences";
import { localeSchema } from "@/lib/validation";

/** Submissions allowed per visitor per window. */
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const submitContactFormSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(5).max(40).nullish(),
  message: z.string().trim().min(10).max(4_000),
  locale: localeSchema.optional(),
});

/**
 * Counts recent rows for this visitor.
 *
 * `contact_messages` is the rate-limit store rather than a separate counter
 * table: the thing being limited is exactly the thing being written, so the
 * count cannot disagree with reality.
 */
async function isRateLimited(visitorId: string, now: Date): Promise<boolean> {
  const since = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contactMessages)
    .where(
      and(
        eq(contactMessages.visitorId, visitorId),
        gte(contactMessages.createdAt, since),
      ),
    );

  return (row?.count ?? 0) >= RATE_LIMIT_MAX;
}

export async function submitContactForm(
  input: z.input<typeof submitContactFormSchema>,
): Promise<ActionResult<{ messageId: number }>> {
  try {
    const parsed = submitContactFormSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const preferences = await resolvePreferences();
    const locale = parsed.data.locale ?? preferences.locale;
    const now = new Date();

    // No visitor cookie means no way to attribute submissions, so the limit
    // cannot be enforced. Rather than refuse the message, it is accepted and
    // left unattributed; `proxy.ts` mints the cookie on any normal page view,
    // so this is the hand-crafted-request case.
    if (
      preferences.visitorId !== null &&
      (await isRateLimited(preferences.visitorId, now))
    ) {
      return {
        ok: false,
        error:
          "You have sent several messages recently. Please wait a while before sending another.",
      };
    }

    const [created] = await dbPool
      .insert(contactMessages)
      .values({
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        phone: parsed.data.phone ?? null,
        message: parsed.data.message,
        locale,
        visitorId: preferences.visitorId,
      })
      .returning({ id: contactMessages.id });

    // No cache invalidation: the admin inbox reads uncached, the same way the
    // admin contact actions leave it. Tagging here would invent a cache nothing
    // claims.
    return ok({ messageId: created.id });
  } catch (error) {
    return toActionError(error);
  }
}
