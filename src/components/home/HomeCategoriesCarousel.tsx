"use client";

import Image from "next/image";
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

import { CarouselArrow } from "./CarouselArrow";
import { HOME_CATEGORY_OF_THE_DAY_INDEX } from "./homeCategoryConstants";

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
  locale: Locale;
};

/** Card width (256px) + gap-6. */
const SCROLL_STEP_PX = 280;

const CARD_SHELL_CLASS = "w-[216px] sm:w-[256px]";
const CARD_IMAGE_HEIGHT_CLASS = "h-[336px] sm:h-[376px]";

export function HomeCategoriesCarousel({
  editorsChoice,
  categories,
  heading,
  subtitle,
  locale,
}: Props) {
  const t = useTranslations("layout.home");
  const railRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [sectionDateLabel, setSectionDateLabel] = useState("");
  const exploreLabel = t("categoriesCardExplore");

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

    rail.scrollLeft = 0;
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

  const villaCountBadge = (count: number) => t("categoriesVillaCount", { count });

  return (
    <div>
      <header className="mb-8 lg:mb-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
          <div>
            <p
              className="mb-5 font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-stone-400"
              suppressHydrationWarning
            >
              {sectionDateLabel}
            </p>
            <h2 className="font-serif text-[clamp(2.75rem,6.5vw,4.25rem)] font-normal leading-[0.95] tracking-[-0.02em] text-stone-900">
              {heading}
            </h2>
            <p className="mt-5 max-w-md font-sans text-[15px] leading-[1.65] text-stone-600">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3 lg:pb-1">
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
        className="no-scrollbar flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto overscroll-x-contain scroll-smooth scroll-pl-0 pb-1 sm:gap-6"
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
            exploreLabel={exploreLabel}
            variant="lead"
          />
        </li>
        {categoryOfTheDay ? (
          <li key={categoryOfTheDay.slug} className="flex shrink-0 snap-start">
            <CategoryCarouselCard
              href={{ pathname: "/villas", query: { category: categoryOfTheDay.slug } }}
              label={categoryOfTheDay.label}
              image={categoryOfTheDay.image}
              countLabel={villaCountBadge(categoryOfTheDay.villaCount)}
              priceFormatted={categoryOfTheDay.priceFormatted}
              isGoodDeal={categoryOfTheDay.isGoodDeal}
              exploreLabel={exploreLabel}
              variant="day"
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
              exploreLabel={exploreLabel}
              variant="standard"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

type CategoryCarouselCardProps = {
  href: ComponentProps<typeof Link>["href"];
  label: string;
  image: string;
  countLabel: string;
  priceFormatted: string;
  isGoodDeal: boolean;
  exploreLabel: string;
  variant: "lead" | "day" | "standard";
  highlighted?: boolean;
};

function CategoryCarouselCard({
  href,
  label,
  image,
  countLabel,
  priceFormatted,
  isGoodDeal,
  exploreLabel,
  variant,
  highlighted = false,
}: CategoryCarouselCardProps) {
  const t = useTranslations("layout.home");
  const perNight = t("categoriesPerNight");

  const imageSizes = "(max-width: 640px) 216px, 256px";

  return (
    <Link
      href={href}
      className={`group flex h-full ${CARD_SHELL_CLASS} flex-col ${highlighted ? "category-card-breathe" : ""}`}
    >
      <article className="flex h-full flex-col">
        <div className={`relative shrink-0 overflow-hidden bg-stone-100 ${CARD_IMAGE_HEIGHT_CLASS}`}>
          <Image
            src={image}
            alt=""
            fill
            sizes={imageSizes}
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/35 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          <span className="absolute top-0 left-0 bg-white px-2.5 py-1.5 font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-stone-600">
            {countLabel}
          </span>
        </div>

        <div className="mt-4 flex min-h-[9.5rem] flex-1 flex-col space-y-2">
          {variant === "day" ? (
            <p className="font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand">
              {t("categoriesOfTheDay")}
            </p>
          ) : null}

          <div className="flex items-baseline justify-between gap-3">
            <h3 className="min-w-0 font-serif text-lg leading-tight text-stone-900 sm:text-xl">{label}</h3>
          </div>

          <p className="font-serif text-base text-stone-800 sm:text-lg">
            {t.rich("categoriesStartingFrom", {
              amount: () => (
                <span className={isGoodDeal ? "font-semibold text-stone-900" : "font-medium"}>
                  {priceFormatted}
                </span>
              ),
            })}
            <span className="font-sans text-xs text-stone-500">{perNight}</span>
          </p>

          <p className="pt-1 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400 transition group-hover:text-brand">
            {exploreLabel}
          </p>
        </div>
      </article>
    </Link>
  );
}

