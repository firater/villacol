import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";

import { VillaListingLayout } from "@/components/villa/VillaListingLayout";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/locales";
import type { SearchParamsInput } from "@/lib/search-params";

type PageProps = {
  searchParams: Promise<SearchParamsInput>;
};

export default async function VillaOffersListingPage({
  searchParams,
}: PageProps) {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  return (
    <VillaListingLayout
      locale={locale}
      searchParams={searchParams}
      lockOffersOnly
      titleKey="offers"
    />
  );
}
