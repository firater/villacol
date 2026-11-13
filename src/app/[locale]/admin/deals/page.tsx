import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { listAdminDeals } from "@/db/queries/admin.deals.queries";
import type { Locale } from "@/lib/locales";

function fmt(d: Date | null) {
  if (!d) return "—";
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export default function AdminDealsPage() {
  return (
    <Suspense fallback={<AdminDealsPageFallback />}>
      <AdminDealsPageContent />
    </Suspense>
  );
}

async function AdminDealsPageContent() {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  const rows = await listAdminDeals();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Deals
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Notification bell offers.
          </p>
        </div>
        <Link
          href={{ pathname: "/admin/deals/[id]", params: { id: "new" } }}
          locale={locale}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          New deal
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Starts</th>
              <th className="px-4 py-3">Ends</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  No deals yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-medium">{row.titleEn}</td>
                  <td className="px-4 py-3">
                    {row.isActive ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
                        Yes
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {fmt(row.startsAt)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {fmt(row.endsAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={{
                        pathname: "/admin/deals/[id]",
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

function AdminDealsPageFallback() {
  return (
    <div className="mx-auto max-w-5xl space-y-6" aria-busy="true">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="h-8 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        </div>
        <div className="h-9 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
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
