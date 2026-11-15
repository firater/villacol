import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { FeatureAdminForm } from "@/components/admin/FeatureAdminForm";
import { routing } from "@/i18n/routing";
import { getAdminFeatureForEdit } from "@/db/queries/admin.features.queries";
import type { Locale } from "@/lib/locales";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminFeatureEditPage({ params }: PageProps) {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  return (
    <Suspense
      fallback={
        <div className="animate-pulse h-40 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
      }
    >
      <FeatureLoader params={params} locale={locale} />
    </Suspense>
  );
}

async function FeatureLoader({
  params,
  locale,
}: {
  params: Promise<{ id: string }>;
  locale: Locale;
}) {
  const { id: raw } = await params;
  if (raw === "new") {
    return <FeatureAdminForm mode="create" locale={locale} />;
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) notFound();
  const feature = await getAdminFeatureForEdit(id);
  if (feature === null) notFound();
  return <FeatureAdminForm mode="edit" locale={locale} feature={feature} />;
}