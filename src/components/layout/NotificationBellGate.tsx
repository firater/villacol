import { connection } from "next/server";

import { getUnreadDeals } from "@/actions/public/deal.actions";

import { NotificationBellDropdown } from "./NotificationBellDropdown";

export async function NotificationBellGate() {
  await connection();

  const result = await getUnreadDeals();
  const deals = result.ok ? result.data.deals : [];
  const unreadCount = result.ok ? result.data.unreadCount : 0;

  return (
    <NotificationBellDropdown initialDeals={deals} initialUnreadCount={unreadCount} />
  );
}
