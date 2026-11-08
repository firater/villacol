/** Admin deal reads (uncached). */
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { deals } from "@/db/schema";
import type { LocalizedText } from "@/lib/locales";

export type AdminDealListRow = {
  id: number;
  titleEn: string;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

export async function listAdminDeals(): Promise<AdminDealListRow[]> {
  const rows = await db
    .select({
      id: deals.id,
      titleI18n: deals.titleI18n,
      isActive: deals.isActive,
      startsAt: deals.startsAt,
      endsAt: deals.endsAt,
    })
    .from(deals)
    .orderBy(desc(deals.orderValue), desc(deals.id));

  return rows.map((r) => ({
    id: r.id,
    titleEn: (r.titleI18n as LocalizedText).en ?? `#${r.id}`,
    isActive: r.isActive,
    startsAt: r.startsAt,
    endsAt: r.endsAt,
  }));
}

export type AdminDealEditRow = {
  id: number;
  titleI18n: LocalizedText;
  bodyI18n: LocalizedText;
  link: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  orderValue: number;
};

export async function getAdminDealForEdit(
  dealId: number,
): Promise<AdminDealEditRow | null> {
  const [row] = await db
    .select({
      id: deals.id,
      titleI18n: deals.titleI18n,
      bodyI18n: deals.bodyI18n,
      link: deals.link,
      startsAt: deals.startsAt,
      endsAt: deals.endsAt,
      isActive: deals.isActive,
      orderValue: deals.orderValue,
    })
    .from(deals)
    .where(eq(deals.id, dealId))
    .limit(1);

  if (row === undefined) return null;

  return {
    id: row.id,
    titleI18n: row.titleI18n as LocalizedText,
    bodyI18n: row.bodyI18n as LocalizedText,
    link: row.link,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    isActive: row.isActive,
    orderValue: row.orderValue,
  };
}
