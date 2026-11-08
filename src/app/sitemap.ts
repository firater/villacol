import type { MetadataRoute } from "next";

import {
  listSitemapCategories,
  listSitemapLocations,
  listSitemapVillas,
} from "@/db/queries/seo.queries";
import { LOCALES, type Locale } from "@/lib/locales";
import { absoluteLocalizedUrl } from "@/lib/seo/urls";

const STATIC_PATHS = [
  "/",
  "/villas",
  "/villa-offers",
  "/find-villa",
  "/contact",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [villas, locations, categories] = await Promise.all([
    listSitemapVillas(),
    listSitemapLocations(),
    listSitemapCategories(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const pathname of STATIC_PATHS) {
    for (const locale of LOCALES) {
      entries.push({
        url: absoluteLocalizedUrl(locale, pathname),
        lastModified: new Date(),
        changeFrequency: pathname === "/" ? "weekly" : "daily",
        priority: pathname === "/" ? 1 : 0.8,
      });
    }
  }

  const pushRows = (
    rows: { locale: Locale; slug: string; updatedAt: Date }[],
    pathname: "/villas/[slug]" | "/locations/[slug]" | "/categories/[slug]",
    priority: number,
  ) => {
    for (const row of rows) {
      entries.push({
        url: absoluteLocalizedUrl(row.locale, {
          pathname,
          params: { slug: row.slug },
        }),
        lastModified: row.updatedAt,
        changeFrequency: "weekly",
        priority,
      });
    }
  };

  pushRows(villas, "/villas/[slug]", 0.9);
  pushRows(locations, "/locations/[slug]", 0.7);
  pushRows(categories, "/categories/[slug]", 0.7);

  return entries;
}
