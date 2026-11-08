/**
 * Bell deals: active rows ordered for the UI.
 */
import { and, asc, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { deals } from "@/db/schema";
import type { LocalizedText } from "@/lib/locales";

export type DealRow = {
  id: number;
  titleI18n: LocalizedText;
  bodyI18n: LocalizedText;
  link: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  orderValue: number;
};

/**
 * A deal is "active" when `is_active` is true and the optional window contains
 * "now". Rows without windows never expire.
 */
export async function getActiveDeals(now: Date = new Date()): Promise<DealRow[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("deals");

  return db
    .select({
      id: deals.id,
      titleI18n: deals.titleI18n,
      bodyI18n: deals.bodyI18n,
      link: deals.link,
      startsAt: deals.startsAt,
      endsAt: deals.endsAt,
      orderValue: deals.orderValue,
    })
    .from(deals)
    .where(
      and(
        eq(deals.isActive, true),
        or(isNull(deals.startsAt), lte(deals.startsAt, now)),
        or(isNull(deals.endsAt), gte(deals.endsAt, now)),
      ),
    )
    .orderBy(desc(deals.orderValue), asc(deals.id));
}
