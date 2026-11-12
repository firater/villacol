import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import type { Locale } from "@/lib/locales";

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
    <section className="relative flex w-full flex-col pb-20 pt-12 sm:pt-14 sm:pb-28 lg:pb-36 lg:pt-16">
      <HomeHeroBackdrop />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col overflow-visible px-4 sm:px-6 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-x-10 lg:px-8 xl:gap-x-12">
        <div className="relative z-10 flex w-full min-w-0 flex-col items-start pb-4 lg:pe-2 xl:pe-4">
          <header className="w-full max-w-3xl pr-[30px] text-left lg:max-w-none lg:pr-10">
            <h1 className="text-pretty font-serif text-[clamp(3.25rem,7.75vw,5.125rem)] font-normal leading-[0.95] tracking-[-0.02em] text-stone-900">
              {t("heroTitleLine1")}
              <br />
              {t("heroTitleLine2")}
            </h1>
            <p className="mt-6 max-w-xl font-serif text-xl font-normal leading-[1.65] tracking-[-0.02em] text-stone-600 sm:text-2xl">
              {t("heroSubtitle")}
            </p>
          </header>

          <div className="mt-[80px] w-full">
            <div className="relative w-full min-h-[11.5rem] lg:min-h-[10.5rem]">
              <div className="relative z-30 w-full max-w-5xl lg:absolute lg:left-0 lg:top-0 lg:w-[min(56rem,calc(100%+13rem))] xl:w-[min(56rem,calc(100%+17rem))]">
                <div className="hidden lg:block">
                  <Suspense fallback={<HeroSearchBarFallback />}>
                    <HeroSearchGate locale={locale} layout="desktop" />
                  </Suspense>
                </div>
              </div>
              <div className="relative z-30 w-full max-w-5xl lg:hidden">
                <Suspense fallback={<HeroSearchBarFallback />}>
                  <HeroSearchGate locale={locale} layout="mobile" />
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-[1] hidden mt-6 w-4/5 sm:ms-auto sm:block lg:mt-0 lg:min-h-0 lg:w-full lg:max-w-full lg:self-stretch">
          <div className="relative w-full max-w-full lg:h-full lg:min-h-[17.5rem]">
            <div
              className="relative ms-auto aspect-[5/5] w-full max-w-full overflow-hidden bg-stone-100 sm:w-[92%] lg:absolute lg:inset-x-0 lg:top-0 lg:bottom-[5.25rem] lg:ms-0 lg:aspect-auto lg:h-auto lg:w-full"
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
              <div className="absolute right-5 top-[46%] z-10">
                <div
                  className="relative overflow-hidden border-[5px] border-white bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
                  style={{ width: "10.2rem", height: "8.5rem" }}
                >
                  <Image src={HERO_SIDE_A} alt="" fill className="object-cover" sizes="170px" />
                </div>
              </div>
              <div className="absolute -right-6 -top-4 z-10">
                <div className="relative h-[6.8rem] w-[6.8rem] border-[5px] border-white bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
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
                  className="relative overflow-hidden border-[5px] border-white bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
                  style={{ width: "11.05rem", height: "11.9rem" }}
                >
                  <Image src={HERO_SIDE_B} alt="" fill className="object-cover" sizes="190px" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
