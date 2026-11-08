import Image from "next/image";
import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { listAdminVillas } from "@/db/queries/admin.villas.queries";
import type { Locale } from "@/lib/locales";

export default function AdminVillasPage() {
  return (
    <Suspense fallback={<AdminVillasPageFallback />}>
      <AdminVillasPageContent />
    </Suspense>
  );
}

async function AdminVillasPageContent() {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  const rows = await listAdminVillas();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Villas
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage villa records and translations.
          </p>
        </div>
        <Link
          href={{ pathname: "/admin/villas/[id]", params: { id: "new" } }}
          locale={locale}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          New villa
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Thumbnail</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                  No villas yet. Create one to get started.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="bg-white dark:bg-zinc-950/40">
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
                        row.isActive
                          ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
                          : "rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-600 dark:text-zinc-100"
                      }
                    >
                      {row.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                    {row.orderValue}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={{ pathname: "/admin/villas/[id]", params: { id: String(row.id) } }}
                      locale={locale}
                      className="font-medium text-amber-800 hover:underline dark:text-amber-200"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminVillasPageFallback() {
  return (
    <div className="mx-auto max-w-7xl space-y-6" aria-busy="true">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="h-8 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="h-11 animate-pulse border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950" />
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="flex h-16 items-center gap-4 border-b border-zinc-100 px-4 dark:border-zinc-800"
          >
            <div className="h-12 w-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-4 flex-1 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
