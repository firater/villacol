import type { MetadataRoute } from "next";

import { LOCALES } from "@/lib/locales";
import { absoluteLocalizedUrl } from "@/lib/seo/urls";

/**
 * Indexable marketing routes only. Villa detail URLs are added in a later SEO step.
 */
const STATIC_PATHS = [
  "/",
  "/villas",
  "/villa-offers",
  "/promotions",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
  "/journal",
  "/journal/best-beaches",
  "/journal/travel-safety-guide",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const pathname of STATIC_PATHS) {
    for (const locale of LOCALES) {
      entries.push({
        url: absoluteLocalizedUrl(locale, pathname),
        changeFrequency: pathname === "/" ? "weekly" : "monthly",
        priority: pathname === "/" ? 1 : pathname === "/villas" ? 0.9 : 0.7,
      });
    }
  }

  return entries;
}
