import type { Metadata } from "next";
import type { Locale } from "@/lib/locales";
import { isLocale } from "@/lib/locales";
import { buildRootMetadata } from "@/lib/seo/site-metadata";
import { SiteRootJsonLd } from "@/components/seo/SiteRootJsonLd";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { Suspense, type ReactNode } from "react";

import { HeaderFallback } from "@/components/layout/HeaderFallback";
import {
  PublicSiteFooter,
  PublicSiteHeader,
} from "@/components/layout/PublicSiteChrome";
import { routing } from "@/i18n/routing";
import "../globals.css";

/**
 * UI sans: Inter. Display / luxury accent: Cormorant Garamond for headings and brand.
 */
const inter = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Pick<LayoutProps, "params">): Promise<Metadata> {
  const { locale: localeRaw } = await params;
  if (!isLocale(localeRaw)) return {};
  return buildRootMetadata(localeRaw);
}

/**
 * Required by Cache Components: every root parameter must have at least one
 * value at build time or the build fails. Listing all three also lets each
 * locale shell prerender instead of being resolved per request.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children }: { children: ReactNode }) {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  // Pins the locale for static rendering and for `NextIntlClientProvider` children.
  setRequestLocale(locale);

  // Static import per locale keeps prerender cacheable — `getMessages()` reads
  // request config and blocks Cache Components builds (Next 16.4).
  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <head>
        <SiteRootJsonLd locale={locale} />
      </head>
      <body className="font-sans min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Istanbul">
          <Suspense fallback={<HeaderFallback />}>
            <PublicSiteHeader locale={locale} />
          </Suspense>
          <div className="flex flex-1 flex-col">{children}</div>
          <Suspense fallback={null}>
            <PublicSiteFooter />
          </Suspense>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
