import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { LocationAdminForm } from "@/components/admin/LocationAdminForm";
import { routing } from "@/i18n/routing";
import { getAdminLocationForEdit } from "@/db/queries/admin.locations.queries";
import type { Locale } from "@/lib/locales";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminLocationEditPage({ params }: PageProps) {
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
      <LocationLoader params={params} locale={locale} />
    </Suspense>
  );
}

async function LocationLoader({
  params,
  locale,
}: {
  params: Promise<{ id: string }>;
  locale: Locale;
}) {
  const { id: raw } = await params;
  if (raw === "new") {
    return <LocationAdminForm mode="create" locale={locale} />;
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) notFound();
  const location = await getAdminLocationForEdit(id);
  if (location === null) notFound();
  return (
    <LocationAdminForm mode="edit" locale={locale} location={location} />
  );
}