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
import { HomeBestValueFallback } from "@/components/home/HomeBestValueFallback";
import { HomeBestValueSection } from "@/components/home/HomeBestValueSection";
import { HomeFeaturedBestValueBridge } from "@/components/home/HomeFeaturedBestValueBridge";
import { HomePromotionsElegantBridge } from "@/components/home/HomePromotionsElegantBridge";
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

  return (
    <>
      <JsonLd data={generateWebsiteJsonLd(locale)} />
      <main className="relative flex flex-1 flex-col overflow-x-clip bg-white">
        <HomeExitIntent />
        <HomeHero locale={locale} />

        <section className="w-full bg-white pb-8 pt-2 lg:pb-10 lg:pt-3">
          <Suspense fallback={<HomeCategoriesFallback />}>
            <HomeCategoriesSection locale={locale} />
          </Suspense>
        </section>

        <section className="w-full bg-white pb-16 pt-8 lg:pb-20 lg:pt-10">
          <div className={sectionInner}>
            <HomeSectionHeader
              layout="split"
              leadingGradientRule
              kicker={t("offersKicker")}
              title={t("offersHeading")}
              subtitle={t("offersSubtitle")}
              action={
                <Link
                  href="/villa-offers"
                  className="group inline-flex shrink-0 items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-900 underline-offset-4 transition hover:text-brand hover:underline"
                >
                  {t("viewAllOffers")}
                  <span
                    aria-hidden
                    className="text-xs font-normal normal-case tracking-normal transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
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

        <HomePromotionsElegantBridge />

        <section className="w-full bg-white py-16 lg:py-20">
          <div className={sectionInner}>
            <HomeSectionHeader
              layout="split"
              kicker={t("featuredKicker")}
              title={t("featuredHeading")}
              subtitle={t("featuredSubtitle")}
              action={
                <Link
                  href="/villas"
                  className="group inline-flex shrink-0 items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-900 underline-offset-4 transition hover:text-brand hover:underline"
                >
                  {t("viewAllVillas")}
                  <span
                    aria-hidden
                    className="text-xs font-normal normal-case tracking-normal transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
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

        <section className="w-full bg-white pb-16 pt-10 lg:pb-20 lg:pt-12">
          <div className={sectionInner}>
            <Suspense fallback={<HomeBestValueFallback />}>
              <HomeBestValueSection locale={locale} />
            </Suspense>
          </div>
        </section>

        <section className="w-full bg-white py-16 lg:py-20" aria-labelledby="home-advantages-title">
          <WhyUsSection />
        </section>

        <section className="w-full bg-white py-16 lg:py-20">
          <HomeDiscountCta />
        </section>

        <section className="w-full bg-stone-50/80 py-16 lg:py-20">
          <HelpFaqSection />
        </section>

        <HomeFeaturedBestValueBridge instanceId="featured-best-value" />
      </main>
    </>
  );
}
