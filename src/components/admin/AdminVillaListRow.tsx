"use client";

import Image from "next/image";
import { useState, useTransition } from "react";

import { deleteVilla, setVillaActive } from "@/actions/admin/villa.actions";
import type { AdminVillaListRow } from "@/db/queries/admin.villas.queries";
import { Link, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/lib/locales";

type Props = {
  row: AdminVillaListRow;
  locale: Locale;
};

export function AdminVillaListRow({ row, locale }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isActive, setIsActive] = useState(row.isActive);
  const [error, setError] = useState<string | null>(null);

  function toggleActive() {
    const nextActive = !isActive;
    const prompt = nextActive
      ? `Restore “${row.titleEn}” and make it visible on the site?`
      : `Archive “${row.titleEn}”? It will be hidden from listings but bookings are kept.`;

    if (!window.confirm(prompt)) return;

    setError(null);
    startTransition(async () => {
      const previous = isActive;
      setIsActive(nextActive);
      const result = await setVillaActive({
        villaId: row.id,
        isActive: nextActive,
      });
      if (!result.ok) {
        setIsActive(previous);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function removeVilla() {
    const prompt = `Permanently delete “${row.titleEn}”? This cannot be undone.`;
    if (!window.confirm(prompt)) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteVilla({ villaId: row.id });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <tr className="bg-white dark:bg-zinc-950/40">
      <td className="px-4 py-3">
        <div
          className="relative h-12 w-16 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
          style={{ aspectRatio: "4 / 3" }}
        >
          {row.thumbUrl ? (
            <Image
              src={row.thumbUrl}
              alt=""
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-zinc-400">
              —
            </div>
          )}
        </div>
      </td>
      <td className="max-w-xs px-4 py-3">
        <div className="font-medium text-zinc-900 dark:text-zinc-100">
          {row.titleEn}
        </div>
        <div className="text-xs text-zinc-500">{row.refCode}</div>
      </td>
      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
        {row.locationName ?? "—"}
      </td>
      <td className="px-4 py-3">
        <span
          className={
            isActive
              ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
              : "rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-600 dark:text-zinc-100"
          }
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
        {row.orderValue}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href={{ pathname: "/admin/villas/[id]", params: { id: String(row.id) } }}
            locale={locale}
            className="font-medium text-amber-800 hover:underline dark:text-amber-200"
          >
            Edit
          </Link>
          <button
            type="button"
            disabled={pending}
            onClick={toggleActive}
            className="text-sm font-medium text-zinc-700 hover:underline disabled:opacity-50 dark:text-zinc-300"
          >
            {isActive ? "Archive" : "Restore"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={removeVilla}
            className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50 dark:text-red-400"
          >
            Delete
          </button>
        </div>
        {error !== null ? (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </td>
    </tr>
  );
}