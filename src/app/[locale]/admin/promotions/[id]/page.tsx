import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { PromotionAdminForm } from "@/components/admin/PromotionAdminForm";
import { routing } from "@/i18n/routing";
import { getAdminPromotionForEdit } from "@/db/queries/admin.promotions.queries";
import type { Locale } from "@/lib/locales";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminPromotionEditPage({ params }: PageProps) {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  return (
    <Suspense fallback={<PromotionFormSkeleton />}>
      <PromotionFormLoader params={params} locale={locale} />
    </Suspense>
  );
}

async function PromotionFormLoader({
  params,
  locale,
}: {
  params: Promise<{ id: string }>;
  locale: Locale;
}) {
  const { id: rawId } = await params;
  const isNew = rawId === "new";

  if (isNew) {
    return <PromotionAdminForm mode="create" locale={locale} />;
  }

  const numericId = Number(rawId);
  if (!Number.isInteger(numericId) || numericId < 1) {
    notFound();
  }

  const promotion = await getAdminPromotionForEdit(numericId);
  if (promotion === null) {
    notFound();
  }

  return <PromotionAdminForm mode="edit" locale={locale} promotion={promotion} />;
}

function PromotionFormSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-6">
      <div className="h-8 w-56 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-72 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}
