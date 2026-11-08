/**
 * Cookie-backed visitor preferences.
 *
 * Cookies rather than localStorage, read on the server, so the SSR output
 * already carries the right language and currency and nothing shifts after
 * hydration.
 *
 * Phase 8's `proxy.ts` is what mints `villa_visitor` for first-time visitors.
 * The readers here tolerate its absence so an action can tell "no visitor yet"
 * apart from a real id instead of inventing one.
 */
import { cookies } from "next/headers";

import {
  BOOKING_ACCESS_COOKIE,
  COOKIE_MAX_AGE,
  CURRENCY_COOKIE,
  LOCALE_COOKIE,
  VISITOR_COOKIE,
} from "@/lib/cookie-names";
import {
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  isCurrency,
  isLocale,
  type Currency,
  type Locale,
} from "@/lib/locales";

export {
  BOOKING_ACCESS_COOKIE,
  COOKIE_MAX_AGE,
  CURRENCY_COOKIE,
  LOCALE_COOKIE,
  VISITOR_COOKIE,
};

export type VisitorPreferences = {
  locale: Locale;
  currency: Currency;
  /** `null` until `proxy.ts` has issued one. */
  visitorId: string | null;
};

export async function resolvePreferences(): Promise<VisitorPreferences> {
  const store = await cookies();

  const locale = store.get(LOCALE_COOKIE)?.value;
  const currency = store.get(CURRENCY_COOKIE)?.value;
  const visitorId = store.get(VISITOR_COOKIE)?.value;

  return {
    locale: isLocale(locale) ? locale : DEFAULT_LOCALE,
    currency: isCurrency(currency) ? currency : DEFAULT_CURRENCY,
    visitorId: visitorId !== undefined && visitorId.length > 0 ? visitorId : null,
  };
}

export async function getVisitorId(): Promise<string | null> {
  return (await resolvePreferences()).visitorId;
}
