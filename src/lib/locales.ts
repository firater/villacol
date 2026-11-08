export const LOCALES = ["en", "de", "ru"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const CURRENCIES = ["EUR", "GBP", "RUB"] as const;

export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "EUR";

/**
 * Short labels stored inline as jsonb. English is required so there is always a
 * fallback; German and Russian may be filled in later by an editor.
 */
export type LocalizedText = { en: string } & Partial<Record<Locale, string>>;

/** `Intl` locale tags keyed by the app's own locale codes. */
export const INTL_LOCALE_TAGS: Record<Locale, string> = {
  en: "en-GB",
  de: "de-DE",
  ru: "ru-RU",
};

/** Postgres full-text search configuration per locale. */
export const TEXT_SEARCH_CONFIG: Record<Locale, string> = {
  en: "english",
  de: "german",
  ru: "russian",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.includes(value as Locale);
}

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && CURRENCIES.includes(value as Currency);
}

export function localize(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.en;
}
