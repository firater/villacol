import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { LocationDetailSkeleton } from "@/components/location/LocationDetailSkeleton";
import { LocationDetailView } from "@/components/location/LocationDetailView";
import {
  getLocationBySlug,
  getLocationSlugAlternates,
} from "@/db/queries/locations.queries";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { LOCALES, type Locale } from "@/lib/locales";
import { SITE_NAME } from "@/lib/seo/site-metadata";
import { toAbsoluteUrl } from "@/lib/seo/site-url";
import { absoluteLocalizedUrl } from "@/lib/seo/urls";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function metadataDescription(
  metaDescription: string | null,
  description: string | null,
): string | undefined {
  const meta = metaDescription?.trim();
  if (meta) return meta;
  const body = description?.trim();
  if (!body) return undefined;
  const first = body.split(/\n+/)[0]?.trim() ?? "";
  return first.length > 320 ? `${first.slice(0, 317)}…` : first;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) return {};

  const locale = localeRaw as Locale;
  const { slug } = await params;
  const location = await getLocationBySlug(slug, locale);
  if (location === null) return {};

  const titleRaw = location.metaTitle?.trim() || location.name;
  const title = titleRaw.includes(SITE_NAME)
    ? titleRaw
    : `${titleRaw} | ${SITE_NAME}`;

  const description = metadataDescription(
    location.metaDescription,
    location.description,
  );

  const canonical = absoluteLocalizedUrl(locale, {
    pathname: "/locations/[slug]",
    params: { slug: location.slug },
  });

  const slugAlternates = await getLocationSlugAlternates(location.id);
  const languages = Object.fromEntries(
    LOCALES.map((code) => {
      const altSlug = slugAlternates[code];
      if (altSlug === undefined) return [code, canonical];
      const path = getPathname({
        locale: code,
        href: { pathname: "/locations/[slug]", params: { slug: altSlug } },
      });
      return [code, toAbsoluteUrl(path)];
    }),
  ) as Record<string, string>;

  const defaultSlug = slugAlternates.en ?? location.slug;
  languages["x-default"] = toAbsoluteUrl(
    getPathname({
      locale: "en",
      href: { pathname: "/locations/[slug]", params: { slug: defaultSlug } },
    }),
  );

  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: titleRaw,
      description,
      url: canonical,
      type: "website",
    },
  };
}

export default async function LocationDetailPage({ params }: PageProps) {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  return (
    <Suspense fallback={<LocationDetailSkeleton />}>
      <LocationPageContent params={params} locale={locale} />
    </Suspense>
  );
}

async function LocationPageContent({
  params,
  locale,
}: {
  params: Promise<{ slug: string }>;
  locale: Locale;
}) {
  const { slug } = await params;
  const location = await getLocationBySlug(slug, locale);
  if (location === null) notFound();

  return <LocationDetailView location={location} locale={locale} />;
}