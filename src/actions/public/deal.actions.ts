"use server";

import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { getActiveDeals } from "@/db/queries/deals.queries";
import { dbPool } from "@/db/pool";
import { dealReads } from "@/db/schema";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { localize, type Locale } from "@/lib/locales";
import { resolvePreferences } from "@/lib/preferences";
import { idSchema } from "@/lib/validation";

const markDealsReadSchema = z.object({
  dealIds: z.array(idSchema).min(1).max(100),
});

export type UnreadDeal = {
  id: number;
  title: string;
  body: string;
  link: string | null;
  endsAt: Date | null;
};

export type UnreadDealsResult = {
  deals: UnreadDeal[];
  unreadCount: number;
  locale: Locale;
};

/**
 * The bell's contents: active deals the visitor has no `deal_reads` row for.
 *
 * The active set comes from the shared cache; only the read receipts are read
 * per visitor. Caching the whole thing per visitor would multiply one cache
 * entry by the number of visitors for the sake of a tiny join.
 */
export async function getUnreadDeals(): Promise<ActionResult<UnreadDealsResult>> {
  try {
    const { locale, visitorId } = await resolvePreferences();
    const active = await getActiveDeals();

    const toUnread = (row: (typeof active)[number]): UnreadDeal => ({
      id: row.id,
      title: localize(row.titleI18n, locale),
      body: localize(row.bodyI18n, locale),
      link: row.link,
      endsAt: row.endsAt,
    });

    // Without a visitor cookie there are no receipts, so everything is unread.
    if (visitorId === null || active.length === 0) {
      return ok({
        deals: active.map(toUnread),
        unreadCount: active.length,
        locale,
      });
    }

    const readRows = await db
      .select({ dealId: dealReads.dealId })
      .from(dealReads)
      .where(
        and(
          eq(dealReads.visitorId, visitorId),
          inArray(
            dealReads.dealId,
            active.map((row) => row.id),
          ),
        ),
      );

    const readIds = new Set(readRows.map((row) => row.dealId));
    const unread = active
      .filter((row) => !readIds.has(row.id))
      .map(toUnread);

    return ok({ deals: unread, unreadCount: unread.length, locale });
  } catch (error) {
    return toActionError(error);
  }
}

export async function markDealsRead(
  input: z.input<typeof markDealsReadSchema>,
): Promise<ActionResult<{ dealIds: number[] }>> {
  try {
    const parsed = markDealsReadSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { visitorId } = await resolvePreferences();
    if (visitorId === null) {
      return {
        ok: false,
        error: "No visitor session. Reload the page and try again.",
      };
    }

    // Only ids that are actually active deals: an arbitrary id would otherwise
    // reach the foreign key and surface as a 500 instead of being ignored.
    const activeIds = new Set((await getActiveDeals()).map((row) => row.id));
    const dealIds = parsed.data.dealIds.filter((dealId) =>
      activeIds.has(dealId),
    );

    if (dealIds.length === 0) return ok({ dealIds: [] });

    // Idempotent: the bell marks the same deals read on every open, and a
    // second click must not fail on the composite primary key.
    await dbPool
      .insert(dealReads)
      .values(dealIds.map((dealId) => ({ dealId, visitorId })))
      .onConflictDoNothing({
        target: [dealReads.dealId, dealReads.visitorId],
      });

    return ok({ dealIds });
  } catch (error) {
    return toActionError(error);
  }
}
