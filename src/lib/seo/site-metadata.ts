import type { Metadata } from "next";

import {
  DEFAULT_LOCALE,
  INTL_LOCALE_TAGS,
  LOCALES,
  type Locale,
} from "@/lib/locales";

import { absoluteHomeUrl } from "./urls";
import { getSiteOrigin } from "./site-url";

export const SITE_NAME = "Villa Collection";

const ROOT_COPY: Record<
  Locale,
  { title: string; description: string; ogAlt: string }
> = {
  en: {
    title: "Luxury villas in Kalkan & Kaş",
    description:
      "Curated Mediterranean villas in Kalkan, Kaş and İslamlar. Live pricing, direct booking savings, and concierge support in English, German, and Russian.",
    ogAlt: "Luxury villa terrace overlooking the Turkish Mediterranean",
  },
  de: {
    title: "Luxusvillen in Kalkan & Kaş",
    description:
      "Kuratierte Villen an der lykischen Küste — Kalkan, Kaş und İslamlar. Live-Preise, Direktbuchungsvorteile und Concierge auf Deutsch, Englisch und Russisch.",
    ogAlt: "Luxusvilla mit Blick auf das Mittelmeer bei Kalkan",
  },
  ru: {
    title: "Люксовые виллы в Калкане и Каше",
    description:
      "Отобранные виллы на Средиземном море — Калкан, Каш, Исламлар. Актуальные цены, выгода при прямом бронировании, консьерж на русском, английском и немецком.",
    ogAlt: "Терраса люксовой виллы с видом на Средиземное море",
  },
};

const OG_IMAGE_PATH = "/best.png";

export function buildRootMetadata(locale: Locale): Metadata {
  const origin = getSiteOrigin();
  const copy = ROOT_COPY[locale];
  const canonical = absoluteHomeUrl(locale);

  const languageAlternates = Object.fromEntries(
    LOCALES.map((code) => [code, absoluteHomeUrl(code)]),
  ) as Record<string, string>;

  languageAlternates["x-default"] = absoluteHomeUrl(DEFAULT_LOCALE);

  const alternateLocales = LOCALES.filter((code) => code !== locale).map(
    (code) => INTL_LOCALE_TAGS[code],
  );

  const ogImage = {
    url: OG_IMAGE_PATH,
    width: 1200,
    height: 630,
    alt: copy.ogAlt,
  };

  return {
    metadataBase: new URL(origin),
    title: {
      default: `${copy.title} | ${SITE_NAME}`,
      template: `%s | ${SITE_NAME}`,
    },
    description: copy.description,
    alternates: {
      canonical,
      languages: languageAlternates,
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_NAME,
      locale: INTL_LOCALE_TAGS[locale],
      alternateLocale: alternateLocales,
      title: copy.title,
      description: copy.description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [OG_IMAGE_PATH],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
