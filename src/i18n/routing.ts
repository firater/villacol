/**
 * The routing contract: which locales exist, and what every static route is
 * called in each of them.
 *
 * Two rules from the plan are encoded here. First, `localePrefix: "always"`, so
 * `/en/villas` and `/de/villen` are both explicit and there is no ambiguous
 * un-prefixed root to reason about. Second, **only path segments are
 * localized** — filters stay universal English query parameters (see
 * `src/lib/search-params.ts`), so `?bedrooms=3` reads the same on every locale.
 */
import { defineRouting } from "next-intl/routing";
import type { Pathnames } from "next-intl/routing";

import {
  COOKIE_MAX_AGE,
  LOCALE_COOKIE,
} from "@/lib/cookie-names";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/locales";

/**
 * Keys are the canonical internal pathnames used in code; values are what the
 * guest sees. A bare string means the path is identical in every locale.
 *
 * The internal key never changes, so `Link href="/villas"` keeps working no
 * matter how the German or Russian slug is later reworded for SEO.
 */
export const pathnames = {
  "/": "/",

  // Catalogue.
  "/villas": {
    en: "/villas",
    de: "/villen",
    ru: "/villy",
  },
  "/villas/[slug]": {
    en: "/villas/[slug]",
    de: "/villen/[slug]",
    ru: "/villy/[slug]",
  },
  "/villa-offers": {
    en: "/villa-offers",
    de: "/villa-angebote",
    ru: "/predlozheniya",
  },
  "/promotions": {
    en: "/promotions",
    de: "/promotionen",
    ru: "/akcii",
  },
  "/find-villa": {
    en: "/find-villa",
    de: "/villa-finden",
    ru: "/podobrat-villu",
  },

  // Landing pages.
  "/locations/[slug]": {
    en: "/locations/[slug]",
    de: "/regionen/[slug]",
    ru: "/napravleniya/[slug]",
  },
  "/categories/[slug]": {
    en: "/categories/[slug]",
    de: "/kategorien/[slug]",
    ru: "/kategorii/[slug]",
  },

  // Booking funnel.
  "/booking/[villaSlug]": {
    en: "/booking/[villaSlug]",
    de: "/buchung/[villaSlug]",
    ru: "/bronirovanie/[villaSlug]",
  },
  /** Where a guest's confirmation link lands; gated by the email OTP. */
  "/my-booking/[token]": {
    en: "/my-booking/[token]",
    de: "/meine-buchung/[token]",
    ru: "/moe-bronirovanie/[token]",
  },
  "/booking-status": {
    en: "/booking-status",
    de: "/buchungsstatus",
    ru: "/status-bronirovaniya",
  },
  "/booking-success": {
    en: "/booking-success",
    de: "/buchung-erfolg",
    ru: "/bronirovanie-uspeshno",
  },

  // Content.
  "/contact": {
    en: "/contact",
    de: "/kontakt",
    ru: "/kontakty",
  },
  "/about": {
    en: "/about",
    de: "/ueber-uns",
    ru: "/o-nas",
  },
  "/terms": {
    en: "/terms",
    de: "/agb",
    ru: "/usloviya",
  },
  "/privacy": {
    en: "/privacy",
    de: "/datenschutz",
    ru: "/konfidencialnost",
  },

  // Admin (same visible path in every locale; editor UI is English-centric).
  "/admin": "/admin",
  "/admin/villas": "/admin/villas",
  "/admin/villas/[id]": "/admin/villas/[id]",
  "/admin/villas/[id]/calendar": "/admin/villas/[id]/calendar",
  "/admin/promotions": "/admin/promotions",
  "/admin/deals": "/admin/deals",
  "/admin/deals/[id]": "/admin/deals/[id]",
  "/admin/messages": "/admin/messages",
  "/admin/bookings": "/admin/bookings",
  "/admin/promotions/[id]": "/admin/promotions/[id]",

  "/login": "/login",

  /** Static UI preview (mock data only). */
  "/refhome": "/refhome",
} satisfies Pathnames<typeof LOCALES>;

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",

  /**
   * next-intl writes its own locale cookie after a language switch. Pointing it
   * at `villa_locale` means there is exactly one cookie carrying the language —
   * the one `resolvePreferences()` and `setLocalePreference()` already use —
   * rather than next-intl's default `NEXT_LOCALE` drifting beside it.
   */
  localeCookie: {
    name: LOCALE_COOKIE,
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
    path: "/",
  },

  pathnames,
});

export type AppPathname = keyof typeof pathnames;
