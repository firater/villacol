/**
 * Ties next-intl's types to the actual dictionaries.
 *
 * With this in place `useTranslations("filters")` only accepts keys that exist
 * in `messages/en.json`, and `t("labels.bedrooms")` is checked rather than
 * being an untyped string. English is the reference because it is the required
 * fallback locale, so a key missing from German or Russian is a runtime
 * fallback rather than a type error.
 */
import type en from "../../messages/en.json";

import type { Locale } from "@/lib/locales";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof en;
  }
}
