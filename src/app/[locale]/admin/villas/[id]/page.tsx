import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { VillaAdminForm } from "@/components/admin/VillaAdminForm";
import { routing } from "@/i18n/routing";
import {
  getAdminVillaForEdit,
  listAdminLocationOptions,
} from "@/db/queries/admin.villas.queries";
import {
  getPromotionIdsAttachedToVilla,
  listActivePromotionsForVillaLink,
} from "@/db/queries/admin.promotions.queries";
import {
  getVillaAmenityLinks,
  getVillaCategoryIds,
  getVillaFeatureLinks,
  listAdminAmenityOptions,
  listAdminCategoryOptions,
  listAdminFeatureOptions,
} from "@/db/queries/admin.taxonomy.queries";
import type { Locale } from "@/lib/locales";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminVillaEditPage({ params }: PageProps) {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  return (
    <Suspense fallback={<VillaFormSkeleton />}>
      <VillaFormLoader params={params} locale={locale} />
    </Suspense>
  );
}

async function VillaFormLoader({
  params,
  locale,
}: {
  params: Promise<{ id: string }>;
  locale: Locale;
}) {
  const { id: rawId } = await params;
  const isNew = rawId === "new";

  const [locations] = await Promise.all([listAdminLocationOptions()]);

  if (isNew) {
    return (
      <VillaAdminForm mode="create" locale={locale} locations={locations} />
    );
  }

  const numericId = Number(rawId);
  if (!Number.isInteger(numericId) || numericId < 1) {
    notFound();
  }

  const [
    villa,
    activePromotions,
    attachedPromotionIds,
    amenityOptions,
    featureOptions,
    categoryOptions,
    villaAmenities,
    villaFeatures,
    villaCategoryIds,
  ] = await Promise.all([
    getAdminVillaForEdit(numericId),
    listActivePromotionsForVillaLink(),
    getPromotionIdsAttachedToVilla(numericId),
    listAdminAmenityOptions(),
    listAdminFeatureOptions(),
    listAdminCategoryOptions(),
    getVillaAmenityLinks(numericId),
    getVillaFeatureLinks(numericId),
    getVillaCategoryIds(numericId),
  ]);
  if (villa === null) {
    notFound();
  }

  return (
    <VillaAdminForm
      mode="edit"
      locale={locale}
      locations={locations}
      villa={villa}
      activePromotions={activePromotions}
      attachedPromotionIds={attachedPromotionIds}
      amenityOptions={amenityOptions}
      featureOptions={featureOptions}
      categoryOptions={categoryOptions}
      villaAmenities={villaAmenities}
      villaFeatures={villaFeatures}
      villaCategoryIds={villaCategoryIds}
    />
  );
}

function VillaFormSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-6">
      <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-64 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}
