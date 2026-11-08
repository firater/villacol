/** Admin contact inbox (uncached). */
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { contactMessages } from "@/db/schema";

export type AdminContactListRow = {
  id: number;
  name: string;
  email: string;
  messageSnippet: string;
  status: string;
  createdAt: Date;
};

export async function listAdminContactMessages(): Promise<AdminContactListRow[]> {
  const rows = await db
    .select({
      id: contactMessages.id,
      name: contactMessages.name,
      email: contactMessages.email,
      message: contactMessages.message,
      status: contactMessages.status,
      createdAt: contactMessages.createdAt,
    })
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    messageSnippet:
      r.message.length > 80 ? `${r.message.slice(0, 80)}…` : r.message,
    status: r.status,
    createdAt: r.createdAt,
  }));
}
