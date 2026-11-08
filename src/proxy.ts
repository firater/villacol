/**
 * Request pre-processing: locale routing plus the two cookies the app assumes
 * exist by the time any page or action runs.
 *
 * Lives in `src/` rather than the repo root because the convention is "beside
 * `app`", and `app` is at `src/app`.
 *
 * Three jobs, in order:
 *
 * 1. next-intl resolves the locale — `villa_locale` cookie first, then
 *    `Accept-Language`, then `en` — and redirects or rewrites to the prefixed,
 *    localized path. Configured in `src/i18n/routing.ts`; `localeDetection`
 *    defaults to true, which is what reads the cookie and the header.
 * 2. `villa_currency` is ensured, defaulting to EUR, so SSR renders prices in
 *    the right currency on the very first paint instead of correcting itself
 *    after hydration.
 * 3. `villa_visitor` is minted as an httpOnly UUID. Deals read receipts, exit
 *    intent codes, and contact-form rate limiting are all keyed by it, and all
 *    three treat a missing id as "no identity" rather than erroring — but they
 *    only work if something issues one, and this is that something.
 *
 * Per the Next.js proxy docs this runs apart from render code, so it stays on
 * constants and `NextRequest`/`NextResponse` and shares no module state.
 */
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import {
  COOKIE_MAX_AGE,
  CURRENCY_COOKIE,
  VISITOR_COOKIE,
} from "@/lib/cookie-names";
import { DEFAULT_CURRENCY, isCurrency } from "@/lib/locales";

const handleI18nRouting = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  // `handleI18nRouting` may return a redirect. Cookies set on a redirect are
  // still delivered, and the follow-up request will carry them, so there is no
  // need to special-case it.
  // Re-validated rather than merely checked for presence, so a hand-edited
  // `villa_currency=XYZ` is corrected instead of being read as unknown later.
  const currency = request.cookies.get(CURRENCY_COOKIE)?.value;
  if (!isCurrency(currency)) {
    response.cookies.set(CURRENCY_COOKIE, DEFAULT_CURRENCY, {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
      // Readable by client code: the currency switcher shows the current
      // selection, and it is a display preference, not a credential.
      httpOnly: false,
    });
  }

  const visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  if (visitorId === undefined || visitorId.length === 0) {
    response.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
      // httpOnly, unlike the two preference cookies: this one is an identity
      // that gates exit-intent codes and rate limits, so client script must not
      // be able to read or forge it.
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export const config = {
  /**
   * Everything except API routes, Next internals, and anything with a file
   * extension. Without the extension exclusion the locale redirect would also
   * fire for `/favicon.ico` and `/next.svg`.
   *
   * `/api` is excluded because the cron and auth handlers are not localized.
   * Server Actions are POSTs to the page route they are used from, so they stay
   * covered and still receive the visitor cookie.
   */
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
