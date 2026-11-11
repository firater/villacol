import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import type { Locale } from "@/lib/locales";

import { HomeDailyPromo } from "./HomeDailyPromo";
import { HomeHeroBackdrop } from "./HomeHeroBackdrop";
import { HeroSearchBarFallback } from "./HeroSearchBarFallback";
import { HeroSearchGate } from "./HeroSearchGate";

const HERO_MAIN =
  "/smr3.jpg";
const HERO_SIDE_A =
  "/smr2.webp";
const HERO_SIDE_B =
  "/smr4.webp";
const HERO_BADGE =
  "/best.png";

type Props = {
  locale: Locale;
};

export async function HomeHero({ locale }: Props) {
  const t = await getTranslations("layout.home");

  return (
    <section className="relative flex w-full flex-col pb-20 pt-8 sm:pb-28 lg:pb-36">
      <HomeHeroBackdrop />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 sm:px-6 lg:flex-row lg:px-8">
        <div className="relative z-10 flex w-full flex-col items-start pb-4 lg:pe-10 xl:gap-y-10 xl:pe-14">
          <header className="pb-8 pr-[30px] text-left">
            <h1 className="text-pretty font-serif text-[clamp(3rem,7.25vw,4.75rem)] font-normal leading-[0.95] tracking-[-0.02em] text-stone-900">
              {t("heroTitleLine1")}
              <br />
              {t("heroTitleLine2")}
            </h1>
            <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-stone-600 sm:text-xl">
              {t("heroSubtitle")}
            </p>
          </header>

          <HomeDailyPromo />
        </div>

        <div className="relative z-10 hidden mt-6 w-4/5 sm:block">
          <div className="relative flex-grow lg:mt-0">
            <div
              className="relative ms-auto aspect-[5/5] w-full overflow-hidden border border-stone-200/60 lg:aspect-auto lg:h-[610px] lg:w-[calc(100%-70px)]"
              style={{ aspectRatio: "5 / 5" }}
            >
              <Image
                src={HERO_MAIN}
                alt=""
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="absolute right-5 top-[46%] z-10 xl:block">
              <div
                className="relative overflow-hidden border border-stone-200/60 bg-white"
                style={{ width: "10.2rem", height: "8.5rem" }}
              >
                <Image src={HERO_SIDE_A} alt="" fill className="object-cover" sizes="170px" />
              </div>
            </div>
            <div className="absolute -right-6 -top-4 z-10 xl:block">
              <div className="relative h-[6.8rem] w-[6.8rem]">
                <Image
                  src={HERO_BADGE}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="110px"
                />
              </div>
            </div>
            <div className="absolute -left-14 top-10 z-10 hidden lg:block">
              <div
                className="relative overflow-hidden border border-stone-200/60 bg-white"
                style={{ width: "11.05rem", height: "11.9rem" }}
              >
                <Image src={HERO_SIDE_B} alt="" fill className="object-cover" sizes="190px" />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-[50px] left-4 z-20 hidden w-[calc(100%-2rem)] max-w-5xl translate-y-1/2 sm:left-6 sm:w-[calc(100%-3rem)] lg:left-8 lg:block lg:w-[min(56rem,calc(100%-4rem))]">
          <Suspense fallback={<HeroSearchBarFallback />}>
            <HeroSearchGate locale={locale} layout="desktop" />
          </Suspense>
        </div>
      </div>

      <div className="relative z-20 -mt-10 px-4 pb-4 sm:-mt-14 sm:px-6 lg:hidden">
        <div className="w-full max-w-5xl">
          <Suspense fallback={<HeroSearchBarFallback />}>
            <HeroSearchGate locale={locale} layout="mobile" />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
