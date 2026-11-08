"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
} from "react";

import { Link } from "@/i18n/navigation";

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
  viewAllLabel: string;
  kicker: string;
};

/** One card width (228px) + gap-4 (16px). */
const SCROLL_STEP_PX = 244;

export function HomeCategoriesCarousel({
  editorsChoice,
  categories,
  heading,
  viewAllLabel,
  kicker,
}: Props) {
  const t = useTranslations("layout.home");
  const railRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  const villaCountBadge = (count: number) => t("categoriesVillaCount", { count });

  return (
    <>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-10">
        <div>
          <p className="mb-2 font-sans text-[10px] tracking-[0.22em] text-stone-400 uppercase">{kicker}</p>
          <h2 className="font-serif text-3xl font-normal tracking-tight text-stone-900 md:text-4xl">{heading}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Link
            href="/villas"
            className="font-sans text-sm text-stone-500 underline-offset-4 hover:text-stone-900 hover:underline"
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
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-2"
        aria-label={heading}
      >
        <li className="shrink-0 snap-start">
          <CategoryCarouselCard
            href="/villas"
            label={editorsChoice.label}
            image={editorsChoice.image}
            countLabel={villaCountBadge(editorsChoice.villaCount)}
            priceFormatted={editorsChoice.priceFormatted}
            isGoodDeal={editorsChoice.isGoodDeal}
            kicker={kicker}
          />
        </li>
        {categories.map((category, index) => (
          <li key={category.slug} className="shrink-0 snap-start">
            <CategoryCarouselCard
              href={{ pathname: "/villas", query: { category: category.slug } }}
              label={category.label}
              image={category.image}
              countLabel={villaCountBadge(category.villaCount)}
              priceFormatted={category.priceFormatted}
              isGoodDeal={category.isGoodDeal}
              kicker={kicker}
              showCategoryOfDayBadge={index === 1}
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
  kicker: string;
  showCategoryOfDayBadge?: boolean;
};

function CategoryCarouselCard({
  href,
  label,
  image,
  countLabel,
  priceFormatted,
  isGoodDeal,
  kicker,
  showCategoryOfDayBadge = false,
}: CategoryCarouselCardProps) {
  const t = useTranslations("layout.home");

  const perNight = t("categoriesPerNight");

  return (
    <Link href={href} className="group block w-[200px] sm:w-[228px]">
      <div className="relative overflow-visible">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-stone-200 ring-1 ring-stone-200/90 ring-inset">
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 640px) 200px, 228px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          {!showCategoryOfDayBadge ? (
            <span className="absolute top-2.5 left-2.5 z-10 inline-flex max-w-[calc(100%-1.25rem)] items-center rounded-full border border-white/30 bg-white/92 px-2 py-1 font-sans text-[9px] font-medium tracking-tight text-stone-800 uppercase backdrop-blur-md shadow-sm">
              {countLabel}
            </span>
          ) : null}
          <div
            className={`pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t via-transparent to-transparent transition-opacity duration-500 ${
              showCategoryOfDayBadge
                ? "from-stone-950/75 via-stone-900/15 opacity-100 group-hover:from-stone-950/85"
                : "from-stone-900/30 opacity-80 group-hover:opacity-100"
            }`}
            aria-hidden
          />
          {showCategoryOfDayBadge ? <CategoryOfDayBadge /> : null}
        </div>
      </div>
      <div className="mt-3">
        <h3 className="font-serif text-lg leading-snug text-stone-900">{label}</h3>
        <p className="mt-1.5 font-sans text-xs leading-snug text-stone-500">
          <span>
            {t.rich("categoriesStartingFrom", {
              amount: () => (
                <span
                  className={
                    isGoodDeal ? "font-semibold text-brand" : "font-medium text-stone-800"
                  }
                >
                  {priceFormatted}
                </span>
              ),
            })}
          </span>
          <span className="text-stone-400">{perNight}</span>
          {showCategoryOfDayBadge ? (
            <span className="mt-1.5 block max-w-[13.5rem] font-serif text-base leading-snug text-brand">
              {t("categoriesNoFeeRental")}
            </span>
          ) : isGoodDeal ? (
            <span className="mt-1.5 block max-w-[13.5rem] font-serif text-base leading-snug text-brand">
              {t("categoriesPromotionsStack")}
            </span>
          ) : null}
        </p>
        <p className="mt-1 font-sans text-[10px] tracking-[0.18em] text-stone-400 uppercase transition-colors group-hover:text-stone-600">
          {kicker}
        </p>
      </div>
    </Link>
  );
}

const CATEGORY_OF_DAY_TOOLTIP =
  "By booking direct, you skip the standard 20% agency commission. We pass this saving directly to you, guaranteeing the best price. Please note: This exclusive 20% direct booking discount cannot be combined with any other promotions or promo codes.";

function CategoryOfDayBadge() {
  const tooltipId = useId();
  const labelId = `${tooltipId}-label`;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 w-full overflow-visible"
      aria-labelledby={labelId}
    >
      <div className="pointer-events-auto relative w-full border-t border-white/10 bg-stone-950/82 px-3 py-2.5 backdrop-blur-md sm:py-3">
        <span
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-brand/70 to-transparent"
          aria-hidden
        />
        <span className="group/info pointer-events-auto absolute top-2 right-2 z-30">
          <button
            type="button"
            className="flex size-5 items-center justify-center rounded-full border border-stone-500/40 bg-white/95 p-0 text-stone-800 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="How the direct booking discount works"
            aria-describedby={tooltipId}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M8 7.25V11M8 5.5h.01"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <span
            id={tooltipId}
            role="tooltip"
            className="absolute bottom-[calc(100%+0.4rem)] right-0 z-50 w-[13.5rem] rounded-lg border border-stone-700/50 bg-stone-900/95 px-3 py-2.5 text-left font-sans text-[11px] leading-snug font-normal tracking-normal text-stone-100 shadow-xl opacity-0 transition-opacity duration-200 pointer-events-none group-hover/info:opacity-100 group-focus-within/info:opacity-100"
          >
            {CATEGORY_OF_DAY_TOOLTIP}
          </span>
        </span>
        <div className="relative px-6 text-center">
          <p className="font-sans text-[8px] font-medium tracking-[0.22em] text-stone-400 uppercase">
            Category of the day
          </p>
          <p id={labelId} className="mt-1 font-serif text-sm leading-tight tracking-tight text-white">
            <span className="text-brand">%20</span> Direct Discount
          </p>
          <div className="mx-auto mt-1 h-px w-7 bg-white/20" aria-hidden />
          <p className="mt-1 font-sans text-[8px] font-medium tracking-[0.18em] text-stone-300 uppercase">
            Best price guarantee
          </p>
        </div>
      </div>
    </div>
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
      className="flex size-9 items-center justify-center rounded-full border border-stone-200/80 bg-white text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:pointer-events-none disabled:opacity-35"
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
