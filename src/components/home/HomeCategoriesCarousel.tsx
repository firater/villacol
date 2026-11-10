"use client";

import Image from "next/image";
import { Heart, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";

import { Link } from "@/i18n/navigation";
import { formatBusinessLongDate } from "@/lib/dates";
import type { Locale } from "@/lib/locales";

import { HOME_CATEGORY_OF_THE_DAY_INDEX } from "./homeCategoriesMock";

export type HomeCategoryCarouselItem = {
  slug: string;
  label: string;
  image: string;
  villaCount: number;
  priceFormatted: string;
  isGoodDeal: boolean;
};

export type HomeEditorsChoiceCarouselItem = {
  label: string;
  image: string;
  villaCount: number;
  priceFormatted: string;
  isGoodDeal: boolean;
};

type Props = {
  editorsChoice: HomeEditorsChoiceCarouselItem;
  categories: readonly HomeCategoryCarouselItem[];
  heading: string;
  subtitle: string;
  categoryOfTheDayLabel: string;
  categoryOfTheDayName: string;
  bestPriceGuaranteeLabel: string;
  viewAllLabel: string;
  locale: Locale;
};

const HIGHLIGHT_DURATION_MS = 2_800;

/** Card width + gap-8 (32px) at sm+. */
const SCROLL_STEP_PX = 268;

const ISTANBUL_TZ = "Europe/Istanbul";

function getHoursMinutesUntilIstanbulMidnight(now = new Date()): { hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ISTANBUL_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const second = Number(parts.find((part) => part.type === "second")?.value ?? 0);

  const secondsLeft = 24 * 3600 - (hour * 3600 + minute * 60 + second);
  const clamped = Math.max(0, secondsLeft);

  return {
    hours: Math.floor(clamped / 3600),
    minutes: Math.floor((clamped % 3600) / 60),
  };
}

function CategoryOfDayTopBadges() {
  const t = useTranslations("layout.home");
  const [timeLeft, setTimeLeft] = useState(() => getHoursMinutesUntilIstanbulMidnight());

  useEffect(() => {
    const sync = () => setTimeLeft(getHoursMinutesUntilIstanbulMidnight());
    sync();
    const intervalId = window.setInterval(sync, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <span className="absolute top-3 left-3 z-10 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-white/20 bg-stone-950/55 px-2.5 py-1.5 text-white shadow-sm backdrop-blur-md">
      <span className="font-serif text-[11px] leading-tight text-white sm:text-xs">
        {t("categoriesOfTheDay")}
      </span>
      <span className="h-3 w-px shrink-0 bg-white/35" aria-hidden />
      <span className="shrink-0 font-sans text-[10px] font-medium tabular-nums text-white/95 sm:text-[11px]">
        {t("categoriesDayEndsTr", { hours: timeLeft.hours, minutes: timeLeft.minutes })}
      </span>
    </span>
  );
}

export function HomeCategoriesCarousel({
  editorsChoice,
  categories,
  heading,
  subtitle,
  categoryOfTheDayLabel,
  categoryOfTheDayName,
  bestPriceGuaranteeLabel,
  viewAllLabel,
  locale,
}: Props) {
  const t = useTranslations("layout.home");
  const railRef = useRef<HTMLUListElement>(null);
  const categoryOfDayCardRef = useRef<HTMLLIElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [highlightCategoryOfDay, setHighlightCategoryOfDay] = useState(false);
  const [sectionDateLabel, setSectionDateLabel] = useState("");

  useEffect(() => {
    setSectionDateLabel(formatBusinessLongDate(locale, new Date()));
  }, [locale]);

  const syncScrollEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    setCanScrollLeft(rail.scrollLeft > 4);
    setCanScrollRight(maxScroll > 4 && rail.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    syncScrollEdges();
    rail.addEventListener("scroll", syncScrollEdges, { passive: true });
    const observer = new ResizeObserver(syncScrollEdges);
    observer.observe(rail);

    return () => {
      rail.removeEventListener("scroll", syncScrollEdges);
      observer.disconnect();
    };
  }, [syncScrollEdges, categories.length]);

  const scrollByStep = (delta: number) => {
    railRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  const categoryOfTheDay = categories[HOME_CATEGORY_OF_THE_DAY_INDEX];
  const categoriesAfterDay = categories.filter(
    (_, index) => index !== HOME_CATEGORY_OF_THE_DAY_INDEX,
  );

  const focusCategoryOfDay = useCallback(() => {
    if (!categoryOfTheDay) return;
    categoryOfDayCardRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
    setHighlightCategoryOfDay(true);
  }, [categoryOfTheDay]);

  useEffect(() => {
    if (!highlightCategoryOfDay) return;
    const timeoutId = window.setTimeout(() => setHighlightCategoryOfDay(false), HIGHLIGHT_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [highlightCategoryOfDay]);

  const villaCountBadge = (count: number) => t("categoriesVillaCount", { count });

  return (
    <>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-10">
        <div className="block max-w-3xl">
          <p
            className="mb-2 min-h-[1.25rem] font-sans text-[11px] tracking-[0.18em] text-stone-400 uppercase sm:min-h-[1.375rem] sm:text-xs"
            suppressHydrationWarning
          >
            {sectionDateLabel}
          </p>
          <h2 className="font-serif text-4xl font-normal tracking-tight text-white md:text-5xl">{heading}</h2>
          <p className="mt-2 text-pretty font-sans text-sm leading-relaxed text-stone-300">{subtitle}</p>
          {categoryOfTheDay ? (
            <button
              type="button"
              onClick={focusCategoryOfDay}
              className="mt-3 inline-flex w-fit max-w-full flex-wrap items-center gap-x-1.5 rounded-full border border-stone-600/90 bg-stone-900/40 px-3 py-1.5 text-left font-sans text-[10px] font-medium tracking-wide text-stone-200 transition hover:border-stone-500 hover:bg-stone-900/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500"
              aria-label={`${categoryOfTheDayLabel} ${categoryOfTheDayName}`}
            >
              <span className="uppercase">{categoryOfTheDayLabel}</span>
              {categoryOfTheDayName ? (
                <>
                  <span className="text-stone-500" aria-hidden>
                    ·
                  </span>
                  <span className="font-serif text-sm font-bold normal-case text-white">
                    {categoryOfTheDayName}
                  </span>
                </>
              ) : null}
              <span className="font-light text-stone-500" aria-hidden>
                |
              </span>
              <span className="uppercase">{bestPriceGuaranteeLabel}</span>
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Link
            href="/villas"
            className="font-serif text-base text-stone-300 underline-offset-4 transition-colors hover:text-white hover:underline md:text-lg"
          >
            {viewAllLabel} →
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <CarouselArrow
              label="Scroll categories left"
              direction="left"
              disabled={!canScrollLeft}
              onClick={() => scrollByStep(-SCROLL_STEP_PX)}
            />
            <CarouselArrow
              label="Scroll categories right"
              direction="right"
              disabled={!canScrollRight}
              onClick={() => scrollByStep(SCROLL_STEP_PX)}
            />
          </div>
        </div>
      </header>
      <ul
        ref={railRef}
        className="no-scrollbar flex snap-x snap-mandatory items-stretch gap-8 overflow-x-auto overscroll-x-contain scroll-smooth pt-4 pb-[18px]"
        aria-label={heading}
      >
        <li className="flex shrink-0 snap-start">
          <CategoryCarouselCard
            href="/villas"
            label={editorsChoice.label}
            image={editorsChoice.image}
            countLabel={villaCountBadge(editorsChoice.villaCount)}
            priceFormatted={editorsChoice.priceFormatted}
            isGoodDeal={editorsChoice.isGoodDeal}
          />
        </li>
        {categoryOfTheDay ? (
          <li key={categoryOfTheDay.slug} ref={categoryOfDayCardRef} className="flex shrink-0 snap-start">
            <CategoryCarouselCard
              href={{ pathname: "/villas", query: { category: categoryOfTheDay.slug } }}
              label={categoryOfTheDay.label}
              image={categoryOfTheDay.image}
              countLabel={villaCountBadge(categoryOfTheDay.villaCount)}
              priceFormatted={categoryOfTheDay.priceFormatted}
              isGoodDeal={categoryOfTheDay.isGoodDeal}
              showCategoryOfDayBadge
              highlighted={highlightCategoryOfDay}
            />
          </li>
        ) : null}
        {categoriesAfterDay.map((category) => (
          <li key={category.slug} className="flex shrink-0 snap-start">
            <CategoryCarouselCard
              href={{ pathname: "/villas", query: { category: category.slug } }}
              label={category.label}
              image={category.image}
              countLabel={villaCountBadge(category.villaCount)}
              priceFormatted={category.priceFormatted}
              isGoodDeal={category.isGoodDeal}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

type CategoryCarouselCardProps = {
  href: ComponentProps<typeof Link>["href"];
  label: string;
  image: string;
  countLabel: string;
  priceFormatted: string;
  isGoodDeal: boolean;
  showCategoryOfDayBadge?: boolean;
  highlighted?: boolean;
};

function CategoryCarouselCard({
  href,
  label,
  image,
  countLabel,
  priceFormatted,
  isGoodDeal,
  showCategoryOfDayBadge = false,
  highlighted = false,
}: CategoryCarouselCardProps) {
  const t = useTranslations("layout.home");

  const perNight = t("categoriesPerNight");

  return (
    <Link
      href={href}
      className={`group flex h-full w-[210px] flex-col sm:w-[236px] ${highlighted ? "category-card-breathe" : ""}`}
    >
      <div className="relative aspect-[3/5] w-full overflow-hidden rounded-[2.25rem] bg-stone-800">
        <Image
          src={image}
          alt=""
          fill
          sizes="(max-width: 640px) 210px, 236px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {showCategoryOfDayBadge ? <CategoryOfDayTopBadges /> : null}

        {!showCategoryOfDayBadge ? (
          <button
            type="button"
            className="absolute top-3 right-3 z-20 flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white shadow-sm backdrop-blur-md transition hover:bg-white/25"
            aria-label="Save category"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <Heart className="size-[18px]" strokeWidth={2} aria-hidden />
          </button>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="bg-gradient-to-t from-stone-950/92 via-stone-950/55 to-transparent px-3.5 pt-14 pb-3.5 sm:px-4 sm:pb-4">
            <p className="font-serif text-lg font-semibold leading-tight text-white sm:text-xl">
              {t.rich("categoriesStartingFrom", {
                amount: () => (
                  <span className={isGoodDeal ? "font-semibold text-white" : "font-medium text-stone-100"}>
                    {priceFormatted}
                  </span>
                ),
              })}
              <span className="font-sans text-base font-normal text-stone-300 sm:text-lg">{perNight}</span>
            </p>

            <div className="mt-1.5 flex items-center gap-1.5 text-stone-200">
              <Home className="size-3.5 shrink-0 text-stone-400" strokeWidth={2} aria-hidden />
              <span className="font-sans text-xs font-medium leading-snug text-stone-300">{countLabel}</span>
            </div>

            <span className="mt-3 block w-full truncate rounded-full border border-white/60 bg-white px-4 py-2.5 text-center font-sans text-sm font-semibold text-stone-900 shadow-sm transition group-hover:border-white group-hover:bg-white">
              {label}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CarouselArrow({
  direction,
  disabled,
  onClick,
  label,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-full border border-stone-200/80 bg-white text-stone-700 transition hover:border-stone-300 hover:bg-white disabled:pointer-events-none disabled:opacity-35"
    >
      <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
        {direction === "left" ? (
          <path d="M10 3.5 5.5 8 10 12.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}
