"use client";

import { markContactRead } from "@/actions/admin/contact.actions";
import type { AdminContactListRow } from "@/db/queries/admin.contact.queries";
import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";

export function ContactMessageRow({ row }: { row: AdminContactListRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(row.status);

  function openMarkRead() {
    if (status === "read" || status === "archived") return;
    startTransition(async () => {
      const out = await markContactRead({ messageId: row.id });
      if (out.ok) {
        setStatus("read");
        router.refresh();
      }
    });
  }

  return (
    <tr
      className={`cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 ${
        status === "new" ? "bg-amber-50/50 dark:bg-amber-950/20" : ""
      }`}
      onClick={openMarkRead}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") openMarkRead();
      }}
      tabIndex={0}
      role="button"
    >
      <td className="px-4 py-3 font-medium">{row.name}</td>
      <td className="px-4 py-3">
        <a
          href={`mailto:${row.email}`}
          onClick={(e) => e.stopPropagation()}
          className="text-amber-800 hover:underline dark:text-amber-200"
        >
          {row.email}
        </a>
      </td>
      <td className="max-w-xs px-4 py-3 text-zinc-600 dark:text-zinc-400">
        {row.messageSnippet}
      </td>
      <td className="px-4 py-3">
        <span
          className={
            status === "new"
              ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-950 dark:bg-amber-950/50 dark:text-amber-100"
              : "rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700"
          }
        >
          {pending ? "…" : status}
        </span>
      </td>
    </tr>
  );
}
