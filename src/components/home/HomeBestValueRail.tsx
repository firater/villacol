"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { VillaCard, type VillaCardProps } from "@/components/villa/VillaCard";

import { CarouselArrow } from "./CarouselArrow";

/** Recommended card width (~272px) + gap. */
const SCROLL_STEP_PX = 288;

export type HomeBestValueRailItem = {
  key: string;
  card: VillaCardProps;
};

type Props = {
  bannerTitle: string;
  carouselLabel: string;
  emptyLabel: string;
  items: HomeBestValueRailItem[];
  scrollLeftLabel: string;
  scrollRightLabel: string;
};

export function HomeBestValueRail({
  bannerTitle,
  carouselLabel,
  emptyLabel,
  items,
  scrollLeftLabel,
  scrollRightLabel,
}: Props) {
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

    rail.scrollLeft = 0;
    syncScrollEdges();
    rail.addEventListener("scroll", syncScrollEdges, { passive: true });
    const observer = new ResizeObserver(syncScrollEdges);
    observer.observe(rail);

    return () => {
      rail.removeEventListener("scroll", syncScrollEdges);
      observer.disconnect();
    };
  }, [syncScrollEdges, items.length]);

  const scrollByStep = (delta: number) => {
    railRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div>
      <div className="border-b border-stone-200 py-2.5 lg:py-3">
        <div className="relative flex min-h-11 items-center justify-end gap-3">
          <p className="pointer-events-none absolute left-1/2 top-1/2 w-full max-w-[min(100%,calc(100%-6.5rem))] -translate-x-1/2 -translate-y-1/2 px-2 text-center font-serif text-xl font-normal uppercase tracking-[0.14em] text-stone-950 sm:text-2xl">
            {bannerTitle}
          </p>
          <CarouselArrow
            label={scrollLeftLabel}
            direction="left"
            disabled={!canScrollLeft}
            onClick={() => scrollByStep(-SCROLL_STEP_PX)}
          />
          <CarouselArrow
            label={scrollRightLabel}
            direction="right"
            disabled={!canScrollRight}
            onClick={() => scrollByStep(SCROLL_STEP_PX)}
          />
        </div>
      </div>

      <div className="pt-8 lg:pt-10">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-6 py-12 text-center font-sans text-sm text-stone-600">
            {emptyLabel}
          </p>
        ) : (
          <ul
            ref={railRef}
            className="no-scrollbar flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto overscroll-x-contain scroll-smooth pb-1"
            aria-label={carouselLabel}
          >
            {items.map((item) => (
              <li key={item.key} className="w-[17rem] shrink-0 snap-start sm:w-[18.5rem]">
                <VillaCard layout="recommended" {...item.card} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
