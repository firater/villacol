import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { AmenityAdminForm } from "@/components/admin/AmenityAdminForm";
import { routing } from "@/i18n/routing";
import { getAdminAmenityForEdit } from "@/db/queries/admin.amenities.queries";
import type { Locale } from "@/lib/locales";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminAmenityEditPage({ params }: PageProps) {
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
      <AmenityLoader params={params} locale={locale} />
    </Suspense>
  );
}

async function AmenityLoader({
  params,
  locale,
}: {
  params: Promise<{ id: string }>;
  locale: Locale;
}) {
  const { id: raw } = await params;
  if (raw === "new") {
    return <AmenityAdminForm mode="create" locale={locale} />;
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) notFound();
  const amenity = await getAdminAmenityForEdit(id);
  if (amenity === null) notFound();
  return <AmenityAdminForm mode="edit" locale={locale} amenity={amenity} />;
}