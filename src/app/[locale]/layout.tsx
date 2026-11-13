import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { Suspense, type ReactNode } from "react";

import { Footer } from "@/components/layout/Footer";
import { HeaderFallback } from "@/components/layout/HeaderFallback";
import { HeaderWithPreferences } from "@/components/layout/HeaderWithPreferences";
import { PublicNavGate } from "@/components/layout/PublicNavGate";
import { TopAnnouncementBar } from "@/components/layout/TopAnnouncementBar";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/locales";

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

export const metadata: Metadata = {
  title: "Villa Collection",
  description: "Luxury villa rentals",
};

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
      <body className="font-sans min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Istanbul">
          <PublicNavGate>
            <TopAnnouncementBar />
            <Suspense fallback={<HeaderFallback />}>
              <HeaderWithPreferences locale={locale} />
            </Suspense>
          </PublicNavGate>
          <div className="flex flex-1 flex-col">{children}</div>
          <PublicNavGate>
            <Footer />
          </PublicNavGate>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
