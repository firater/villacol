"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { Link } from "@/i18n/navigation";

import type { HOME_CATEGORIES_MOCK } from "./homeCategoriesMock";

export type HomeCategoryCard = (typeof HOME_CATEGORIES_MOCK)[number];

type Props = {
  categories: readonly HomeCategoryCard[];
  heading: string;
  viewAllLabel: string;
  kicker: string;
};

/** One card width (300px at sm+) + gap-6 (24px). */
const SCROLL_STEP_PX = 324;

export function HomeCategoriesCarousel({ categories, heading, viewAllLabel, kicker }: Props) {
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

  return (
    <>
      <header className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between md:mb-16">
        <h2 className="font-serif text-4xl font-normal tracking-tight text-stone-900 md:text-5xl">{heading}</h2>
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <Link href="/villas" className="font-sans text-sm text-stone-500 hover:text-stone-900">
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
        className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6"
        aria-label={heading}
      >
        {categories.map((category) => (
          <li key={category.slug} className="shrink-0 snap-start">
            <Link
              href={{ pathname: "/villas", query: { category: category.slug } }}
              className="group relative block h-[380px] w-[280px] overflow-hidden rounded-2xl bg-stone-200 sm:h-[400px] sm:w-[300px]"
            >
              <Image
                src={category.image}
                alt=""
                fill
                sizes="300px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-colors duration-500 group-hover:from-black/90"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <h3 className="font-serif text-2xl leading-tight text-white">{category.label}</h3>
                <p className="mt-3 flex items-center gap-3">
                  <span className="h-px w-6 shrink-0 bg-white/50" aria-hidden />
                  <span className="font-sans text-[10px] tracking-[0.2em] text-white/85 uppercase">{kicker}</span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
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
      className="flex size-10 items-center justify-center rounded-full border border-stone-200/80 bg-white text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:pointer-events-none disabled:opacity-35"
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
