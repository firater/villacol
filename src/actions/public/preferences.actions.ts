"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { CURRENCIES, type Currency, type Locale } from "@/lib/locales";
import {
  COOKIE_MAX_AGE,
  CURRENCY_COOKIE,
  LOCALE_COOKIE,
} from "@/lib/preferences";
import { localeSchema } from "@/lib/validation";

const currencySchema = z.enum(CURRENCIES);

/**
 * Readable by client code, unlike `villa_visitor`: the language and currency
 * switchers render the current selection without a round trip, and neither
 * value is a credential.
 */
const PREFERENCE_COOKIE_OPTIONS = {
  path: "/",
  maxAge: COOKIE_MAX_AGE,
  sameSite: "lax",
  httpOnly: false,
} as const;

export async function setLocalePreference(
  input: unknown,
): Promise<ActionResult<{ locale: Locale }>> {
  try {
    const parsed = localeSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const store = await cookies();
    store.set(LOCALE_COOKIE, parsed.data, PREFERENCE_COOKIE_OPTIONS);

    return ok({ locale: parsed.data });
  } catch (error) {
    return toActionError(error);
  }
}

export async function setCurrencyPreference(
  input: unknown,
): Promise<ActionResult<{ currency: Currency }>> {
  try {
    const parsed = currencySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const store = await cookies();
    store.set(CURRENCY_COOKIE, parsed.data, PREFERENCE_COOKIE_OPTIONS);

    return ok({ currency: parsed.data });
  } catch (error) {
    return toActionError(error);
  }
}
