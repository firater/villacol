import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { DealAdminForm } from "@/components/admin/DealAdminForm";
import { routing } from "@/i18n/routing";
import { getAdminDealForEdit } from "@/db/queries/admin.deals.queries";
import type { Locale } from "@/lib/locales";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminDealEditPage({ params }: PageProps) {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  return (
    <Suspense fallback={<div className="animate-pulse h-40 rounded-xl bg-zinc-100 dark:bg-zinc-900" />}>
      <DealLoader params={params} locale={locale} />
    </Suspense>
  );
}

async function DealLoader({
  params,
  locale,
}: {
  params: Promise<{ id: string }>;
  locale: Locale;
}) {
  const { id: raw } = await params;
  if (raw === "new") {
    return <DealAdminForm mode="create" locale={locale} />;
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) notFound();
  const deal = await getAdminDealForEdit(id);
  if (deal === null) notFound();
  return <DealAdminForm mode="edit" locale={locale} deal={deal} />;
}
