import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { HelpFaqSection } from "@/components/home/HelpFaqSection";
import { HomeExitIntent } from "@/components/home/HomeExitIntent";
import { HomeCategoriesFallback } from "@/components/home/HomeCategoriesFallback";
import { HomeCategoriesSection } from "@/components/home/HomeCategoriesSection";
import { HomeDiscountCta } from "@/components/home/HomeDiscountCta";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HomeVillaSection } from "@/components/home/HomeVillaSection";
import { HomeVillaSectionFallback } from "@/components/home/HomeVillaSectionFallback";
import { HomePromoOffersSection } from "@/components/home/HomePromoOffersSection";
import { WhyUsSection } from "@/components/home/WhyUsSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/locales";
import { generateWebsiteJsonLd } from "@/lib/seo/json-ld";

const sectionShell = "w-full border-t border-stone-200/50 py-16 lg:py-20";
const sectionInner = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export default async function Home() {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  const t = await getTranslations("layout.home");

  const sectionLinkClass =
    "font-sans text-sm text-stone-500 underline-offset-4 hover:text-stone-900 hover:underline";

  return (
    <>
      <JsonLd data={generateWebsiteJsonLd(locale)} />
      <main className="relative flex flex-1 flex-col overflow-x-clip bg-white">
        <HomeExitIntent />
        <HomeHero locale={locale} />

        <section className={`${sectionShell} bg-stone-50`}>
          <Suspense fallback={<HomeCategoriesFallback />}>
            <HomeCategoriesSection locale={locale} />
          </Suspense>
        </section>

        <section className={`${sectionShell} bg-white`}>
          <div className={sectionInner}>
            <HomeSectionHeader
              layout="split"
              kicker={t("offersKicker")}
              title={t("offersHeading")}
              subtitle={t("offersSubtitle")}
              action={
                <Link
                  href="/villa-offers"
                  className="font-serif text-base text-brand underline-offset-4 transition-colors hover:text-brand-dark hover:underline md:text-lg"
                >
                  {t("viewAllOffers")} →
                </Link>
              }
            />
            <div className="min-h-[300px]">
              <Suspense fallback={<HomeVillaSectionFallback density="promo" />}>
                <HomePromoOffersSection locale={locale} />
              </Suspense>
            </div>
          </div>
        </section>

        <section className={`${sectionShell} bg-stone-50`}>
          <div className={sectionInner}>
            <HomeSectionHeader
              kicker={t("featuredKicker")}
              title={t("featuredHeading")}
              subtitle={t("featuredSubtitle")}
              action={
                <Link href="/villas" className={sectionLinkClass}>
                  {t("viewAllVillas")} →
                </Link>
              }
            />
            <div className="min-h-[500px]">
              <Suspense fallback={<HomeVillaSectionFallback />}>
                <HomeVillaSection
                  locale={locale}
                  variant="featured"
                  cardLayout="recommended"
                />
              </Suspense>
            </div>
          </div>
        </section>

        <section className={`${sectionShell} bg-white`}>
          <div className={sectionInner}>
            <HomeSectionHeader
              kicker={t("bestValueKicker")}
              title={t("bestValueHeading")}
              subtitle={t("bestValueSubtitle")}
            />
            <Suspense fallback={<HomeVillaSectionFallback />}>
              <HomeVillaSection locale={locale} variant="bestValue" cardLayout="recommended" />
            </Suspense>
          </div>
        </section>

        <section className={`${sectionShell} bg-stone-50`} aria-labelledby="home-advantages-title">
          <WhyUsSection />
        </section>

        <section className={`${sectionShell} bg-white`}>
          <HomeDiscountCta />
        </section>

        <section className={`${sectionShell} border-stone-200/50 bg-stone-50`}>
          <HelpFaqSection />
        </section>
      </main>
    </>
  );
}
