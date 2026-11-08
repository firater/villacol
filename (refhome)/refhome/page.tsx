import Image from "next/image";
import { refMedia } from "./media";
import RefDailyPromo from "./components/RefDailyPromo";
import RefExtraTags from "./components/RefExtraTags";
import RefSearchStrip from "./components/RefSearchStrip";
import RefCategoryRail from "./components/RefCategoryRail";
import RefDealsBlock from "./components/RefDealsBlock";
import RefPicksBlock from "./components/RefPicksBlock";
import RefAdvantages from "./components/RefAdvantages";
import RefTrustPill from "./components/RefTrustPill";
import RefQuestions from "./components/RefQuestions";
import RefConciergeStrip from "./components/RefConciergeStrip";

export default function RefHomePage() {
  return (
    <div className="relative flex flex-col sm:pt-10 lg:flex-col lg:pt-12 w-full">
      <div className="hidden md:block absolute inset-x-0 -top-10 md:top-10 -left-15 md:left-0 xl:top-20 min-h-0 pl-20 py-24 flex overflow-hidden -z-10">
        <span className="block h-72 w-72 rounded-full bg-[#ef233c] opacity-15 md:opacity-10 mix-blend-multiply blur-3xl filter lg:h-96 lg:w-96" />
        <span className="ref-blur-delay mt-40 -ml-20 block h-72 w-72 rounded-full bg-[#fff] opacity-10 mix-blend-multiply blur-3xl filter lg:h-96 lg:w-96" />
      </div>

      <div className="flex flex-col lg:flex-row">
        <div className="relative flex w-full flex-col items-start pb-4 lg:pe-10 lg:pt-12 lg:pb-60 xl:gap-y-10 xl:pe-14">
          <header className="text-left pt-1 pb-5">
            <h1 className="text-lg sm:text-5xl/[1.15] font-bold sm:font-black tracking-tight text-pretty xl:text-7xl/[1.1] text-neutral-900 dark:text-white">
              <span>En İyi Fiyat Garantisi</span>
              <span className="sr-only">Cimri Villa Türkiye&apos;nin En Ekonomik Villa Kiralama Platformu</span>
            </h1>
            <p className="max-w-xl text-[3vw] xs:text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              İndirim alın. Tatilinize daha çok para ayırın.
            </p>
          </header>

          <RefDailyPromo />
          <div className="absolute start-0 bottom-4 hidden w-screen max-w-4xl lg:block xl:max-w-6xl">
            <div className="mb-3">
              <RefExtraTags />
            </div>
            <RefSearchStrip />
          </div>
        </div>

        <div className="w-4/5 hidden sm:block">
          <div className="relative flex-grow lg:mt-0 z-0">
            <div className="relative aspect-[4/3] lg:aspect-auto overflow-hidden rounded-3xl lg:h-[600px]">
              <Image
                src={refMedia.heroMain}
                alt="Lüks Otel"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="absolute right-4 top-2/4 xl:block z-10">
              <div className="relative h-40 w-48 overflow-hidden rounded-2xl shadow-2xl ring-4 ring-white dark:ring-neutral-800">
                <Image src={refMedia.heroSideA} alt="Deneyim" fill className="object-cover" sizes="200px" />
              </div>
            </div>
            <div className="absolute -right-10 -top-6 xl:block z-20">
              <div className="relative h-32 w-32">
                <Image src={refMedia.badgeBest} alt="En İyi Seçim" fill className="object-contain" sizes="130px" />
              </div>
            </div>
            <div className="absolute top-12 -left-20 hidden lg:block z-10">
              <div className="relative h-56 w-52 overflow-hidden rounded-2xl shadow-2xl ring-4 ring-white dark:ring-neutral-800">
                <Image src={refMedia.heroSideB} alt="Araç Kiralama" fill className="object-cover" sizes="220px" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <RefCategoryRail />
      <RefDealsBlock />
      <RefPicksBlock />
      <RefAdvantages />
      <RefTrustPill />
      <RefQuestions />
      <RefConciergeStrip />
    </div>
  );
}
