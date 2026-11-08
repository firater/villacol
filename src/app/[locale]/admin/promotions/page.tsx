import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";

import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { listAdminPromotions } from "@/db/queries/admin.promotions.queries";
import { fromCents } from "@/lib/money";
import type { Locale } from "@/lib/locales";

function formatValue(row: Awaited<ReturnType<typeof listAdminPromotions>>[0]) {
  if (row.discountType === "percentage" && row.percentBp != null) {
    const pct = row.percentBp / 100;
    return `${pct.toFixed(2)}%`;
  }
  if (row.discountType === "fixed_amount" && row.fixedAmountCents != null) {
    return `€${fromCents(row.fixedAmountCents).toFixed(2)}`;
  }
  if (
    row.discountType === "free_days" &&
    row.freeNights != null &&
    row.freeNightsThreshold != null
  ) {
    return `${row.freeNights} free / pay ${row.freeNightsThreshold}+ nights`;
  }
  return "—";
}

export default async function AdminPromotionsPage() {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  const rows = await listAdminPromotions();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Promotions
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Discount rules — villa attachments come later.
          </p>
        </div>
        <Link
          href={{ pathname: "/admin/promotions/[id]", params: { id: "new" } }}
          locale={locale}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          New promotion
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                  No promotions yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="bg-white dark:bg-zinc-950/40">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {row.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    <span className="block text-xs text-zinc-500">{row.triggerType}</span>
                    {row.discountType}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {formatValue(row)}
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
                    {row.priorityOrder}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={{
                        pathname: "/admin/promotions/[id]",
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
