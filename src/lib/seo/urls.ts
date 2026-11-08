import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/lib/locales";

import { toAbsoluteUrl } from "./site-url";

type LocalizedHref = Parameters<typeof getPathname>[0]["href"];

/**
 * Builds a fully qualified URL for a locale-aware pathname from `routing.pathnames`.
 */
export function absoluteLocalizedUrl(locale: Locale, href: LocalizedHref): string {
  const path = getPathname({ locale, href });
  return toAbsoluteUrl(path);
}

export function absoluteHomeUrl(locale: Locale): string {
  return absoluteLocalizedUrl(locale, "/");
}
