/**
 * Cookie names and lifetimes, with zero imports.
 *
 * Split out of `preferences.ts` so `proxy.ts` and `i18n/routing.ts` can name
 * the same cookies without pulling in `next/headers`, which is unavailable in
 * the proxy. `preferences.ts` re-exports all of this, so application code can
 * keep importing from there.
 */

export const LOCALE_COOKIE = "villa_locale";
export const CURRENCY_COOKIE = "villa_currency";
export const VISITOR_COOKIE = "villa_visitor";
export const BOOKING_ACCESS_COOKIE = "villa_booking_access";

/** One year. */
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
