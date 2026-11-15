import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { listAdminLocations } from "@/db/queries/admin.locations.queries";
import type { Locale } from "@/lib/locales";

export default function AdminLocationsPage() {
  return (
    <Suspense fallback={<AdminLocationsPageFallback />}>
      <AdminLocationsPageContent />
    </Suspense>
  );
}

async function AdminLocationsPageContent() {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  const rows = await listAdminLocations();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Locations
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Flat list sorted by order. Villas use these in filters and detail
            pages.
          </p>
        </div>
        <Link
          href={{ pathname: "/admin/locations/[id]", params: { id: "new" } }}
          locale={locale}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          New location
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
            <tr>
              <th className="px-4 py-3">Name (EN)</th>
              <th className="px-4 py-3">Slug (EN)</th>
              <th className="px-4 py-3">Villas</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  No locations yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-medium">{row.nameEn}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.slugEn}
                  </td>
                  <td className="px-4 py-3">{row.villaCount}</td>
                  <td className="px-4 py-3">{row.orderValue}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={{
                        pathname: "/admin/locations/[id]",
                        params: { id: String(row.id) },
                      }}
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

function AdminLocationsPageFallback() {
  return (
    <div className="mx-auto max-w-5xl space-y-6" aria-busy="true">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="h-8 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="h-11 animate-pulse border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950" />
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/30"
          />
        ))}
      </div>
    </div>
  );
}