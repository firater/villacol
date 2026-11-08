import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";

import { ContactMessageRow } from "@/components/admin/ContactMessageRow";
import { routing } from "@/i18n/routing";
import { listAdminContactMessages } from "@/db/queries/admin.contact.queries";

export default async function AdminMessagesPage() {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }

  const rows = await listAdminContactMessages();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Messages
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Contact form inbox.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-zinc-500">
                  No messages yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <ContactMessageRow key={row.id} row={row} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
