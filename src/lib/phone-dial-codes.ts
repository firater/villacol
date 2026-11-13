import type { Locale } from "@/lib/locales";

export type PhoneDialOption = {
  code: string;
  label: string;
};

/** Agency home market; shown first and used when locale has no dedicated default. */
export const SITE_PHONE_DIAL_CODE = "+90";

const DEFAULT_DIAL_BY_LOCALE: Record<Locale, string> = {
  en: "+44",
  de: "+49",
  ru: "+7",
};

export const PHONE_DIAL_OPTIONS: PhoneDialOption[] = [
  { code: SITE_PHONE_DIAL_CODE, label: "TR +90" },
  { code: "+44", label: "UK +44" },
  { code: "+49", label: "DE +49" },
  { code: "+7", label: "RU +7" },
  { code: "+1", label: "US +1" },
  { code: "+33", label: "FR +33" },
  { code: "+39", label: "IT +39" },
  { code: "+971", label: "AE +971" },
];

export function defaultPhoneDialCode(locale: Locale): string {
  return DEFAULT_DIAL_BY_LOCALE[locale] ?? SITE_PHONE_DIAL_CODE;
}

export function formatGuestPhone(dialCode: string, national: string): string {
  const trimmed = national.replace(/[^\d\s()-]/g, "").trim();
  return `${dialCode} ${trimmed}`.trim();
}
