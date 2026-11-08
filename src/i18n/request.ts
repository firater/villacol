/**
 * Per-request i18n config, read by `next-intl/server` and the `[locale]` tree.
 *
 * Deliberately uses `requestLocale` rather than `next/root-params`. Root params
 * are unavailable in Server Actions and Route Handlers, and Phase 7's public
 * actions call `getTranslations` for validation and email copy, so the segment
 * value is the only source that works everywhere.
 */
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { BUSINESS_TIMEZONE } from "@/lib/dates";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  // The `[locale]` segment is effectively a catch-all, so `/unknown.txt` can
  // land here. Falling back keeps `useTranslations` from throwing on junk URLs.
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    // Pinned to the business timezone so a date formatted on the server and the
    // same date formatted in the browser agree, regardless of the visitor's own
    // clock. This is the timezone the calendar and pricing engine think in.
    timeZone: BUSINESS_TIMEZONE,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
