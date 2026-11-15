import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { type ReactNode, Suspense } from "react";

import { AdminVillaListRow } from "@/components/admin/AdminVillaListRow";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  listAdminVillas,
  type AdminVillaListFilter,
} from "@/db/queries/admin.villas.queries";
import type { Locale } from "@/lib/locales";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default function AdminVillasPage(props: PageProps) {
  return (
    <Suspense fallback={<AdminVillasPageFallback />}>
      <AdminVillasPageContent {...props} />
    </Suspense>
  );
}

function parseVillaTab(raw: string | undefined): AdminVillaListFilter {
  if (raw === "inactive") return "inactive";
  return "active";
}

async function AdminVillasPageContent({ searchParams }: PageProps) {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  const resolved = await searchParams;
  const tab = parseVillaTab(resolved.tab);
  const rows = await listAdminVillas(tab);

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

      <nav
        aria-label="Villa visibility"
        className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800"
      >
        <TabLink locale={locale} tab="active" active={tab === "active"}>
          Active Villas
        </TabLink>
        <TabLink locale={locale} tab="inactive" active={tab === "inactive"}>
          Inactive / Drafts
        </TabLink>
      </nav>

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
                  {tab === "active"
                    ? "No active villas. Restore one from Inactive / Drafts."
                    : "No inactive villas."}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <AdminVillaListRow key={row.id} row={row} locale={locale} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabLink({
  locale,
  tab,
  active,
  children,
}: {
  locale: Locale;
  tab: AdminVillaListFilter;
  active: boolean;
  children: ReactNode;
}) {
  const href =
    tab === "active"
      ? ({ pathname: "/admin/villas" } as const)
      : ({
          pathname: "/admin/villas",
          query: { tab: "inactive" },
        } as const);

  return (
    <Link
      href={href}
      locale={locale}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      }`}
    >
      {children}
    </Link>
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
      <div className="h-10 w-72 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-900" />
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