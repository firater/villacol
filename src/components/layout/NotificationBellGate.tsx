import { connection } from "next/server";

import { getUnreadDeals, type UnreadDeal } from "@/actions/public/deal.actions";
import { getActiveDeals } from "@/db/queries/deals.queries";
import { localize } from "@/lib/locales";
import { resolvePreferences } from "@/lib/preferences";

import { NotificationBellDropdown } from "./NotificationBellDropdown";

export async function NotificationBellGate() {
  await connection();

  const [{ locale }, activeRows, unreadResult] = await Promise.all([
    resolvePreferences(),
    getActiveDeals(),
    getUnreadDeals(),
  ]);

  const deals: UnreadDeal[] = activeRows.map((row) => ({
    id: row.id,
    title: localize(row.titleI18n, locale),
    body: localize(row.bodyI18n, locale),
    link: row.link,
    endsAt: row.endsAt,
  }));

  const unreadCount = unreadResult.ok ? unreadResult.data.unreadCount : 0;

  return (
    <NotificationBellDropdown initialDeals={deals} initialUnreadCount={unreadCount} />
  );
}
