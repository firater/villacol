"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { FilterFacetOption } from "@/db/queries/filter-facets.queries";

const MAX_PILLS = 4;
const PANEL_MAX_WIDTH_PX = 520;
const VIEWPORT_MARGIN_PX = 16;
const GAP_BELOW_BUTTON_PX = 10;
const NEEDLE_SIZE_PX = 14;

type PanelAnchor = {
  panelTop: number;
  panelCenterX: number;
  buttonCenterX: number;
};

type Props = {
  amenities: FilterFacetOption[];
  selected: string[];
  onToggle: (value: string) => void;
};

function pillClassName(active: boolean) {
  return `flex items-center gap-2 border px-4 py-2 text-xs font-medium transition-colors ${
    active
      ? "border-brand bg-brand text-white"
      : "border-neutral-200 bg-white text-neutral-600 hover:border-orange-200 hover:text-neutral-800"
  }`;
}

function measurePanelAnchor(button: HTMLButtonElement): PanelAnchor {
  const rect = button.getBoundingClientRect();
  const panelWidth = Math.min(
    PANEL_MAX_WIDTH_PX,
    window.innerWidth - VIEWPORT_MARGIN_PX * 2,
  );
  const half = panelWidth / 2;
  const buttonCenterX = rect.left + rect.width / 2;
  const panelCenterX = Math.min(
    window.innerWidth - VIEWPORT_MARGIN_PX - half,
    Math.max(VIEWPORT_MARGIN_PX + half, buttonCenterX),
  );

  return {
    panelTop: rect.bottom + GAP_BELOW_BUTTON_PX,
    panelCenterX,
    buttonCenterX,
  };
}

export function HeroAmenityPills({ amenities, selected, onToggle }: Props) {
  const t = useTranslations("layout.home.amenityPills");
  const dialogTitleId = useId();
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [anchor, setAnchor] = useState<PanelAnchor | null>(null);
  const [mounted, setMounted] = useState(false);

  const visible = amenities.slice(0, MAX_PILLS);
  const hasMore = amenities.length > MAX_PILLS;

  const updateAnchor = useCallback(() => {
    const button = moreButtonRef.current;
    if (!button) return;
    setAnchor(measurePanelAnchor(button));
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    moreButtonRef.current?.focus();
  }, []);

  const openModal = useCallback(() => {
    updateAnchor();
    setModalOpen(true);
  }, [updateAnchor]);

  const toggleModal = useCallback(() => {
    if (modalOpen) {
      closeModal();
      return;
    }
    openModal();
  }, [closeModal, modalOpen, openModal]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!modalOpen) return;

    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, true);
    return () => {
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor, true);
    };
  }, [modalOpen, updateAnchor]);

  useEffect(() => {
    if (!modalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeModal, modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (dialogRef.current?.contains(target)) return;
      if (moreButtonRef.current?.contains(target)) return;
      closeModal();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [closeModal, modalOpen]);

  if (amenities.length === 0) return null;

  const portal =
    modalOpen && anchor && mounted
      ? createPortal(
          <>
            <div
              className="pointer-events-none fixed inset-0 z-[260] bg-stone-900/25 backdrop-blur-[1px]"
              aria-hidden
            />
            <div
              className="fixed z-[261] w-[min(32.5rem,calc(100vw-2rem))]"
              style={{
                top: anchor.panelTop,
                left: anchor.panelCenterX,
                transform: "translateX(-50%)",
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-[7px] z-20 -translate-x-1/2 rotate-45 border border-stone-200/90 bg-white shadow-[0_-1px_2px_rgba(28,25,23,0.06)]"
                style={{
                  left: `calc(50% + ${anchor.buttonCenterX - anchor.panelCenterX}px)`,
                  width: NEEDLE_SIZE_PX,
                  height: NEEDLE_SIZE_PX,
                }}
              />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={dialogTitleId}
                className="relative rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2
                    id={dialogTitleId}
                    className="font-serif text-lg font-normal tracking-tight text-stone-900"
                  >
                    {t("modalTitle")}
                  </h2>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="shrink-0 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500 transition hover:text-stone-900"
                  >
                    {t("modalDone")}
                  </button>
                </div>
                <p className="mt-1 text-sm font-light text-stone-600">{t("modalHint")}</p>
                <div className="mt-4 max-h-56 overflow-y-auto overscroll-contain pr-1">
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((item) => {
                      const active = selected.includes(item.value);
                      return (
                        <button
                          key={item.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => onToggle(item.value)}
                          className={pillClassName(active)}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <nav aria-label={t("aria")} className="w-full">
        <div className="flex flex-wrap items-center gap-3">
          {visible.map((item) => {
            const active = selected.includes(item.value);
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => onToggle(item.value)}
                className={pillClassName(active)}
              >
                {item.label}
              </button>
            );
          })}
          {hasMore ? (
            <button
              ref={moreButtonRef}
              type="button"
              aria-expanded={modalOpen}
              aria-haspopup="dialog"
              onClick={toggleModal}
              className={`relative flex items-center gap-2 border px-4 py-2 transition-colors ${
                modalOpen
                  ? "border-orange-300 bg-orange-50 text-orange-700"
                  : "border-transparent bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80"
              }`}
            >
              <span className="text-xs font-bold">{t("more")}</span>
              {selected.length > 0 ? (
                <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                  {selected.length}
                </span>
              ) : null}
            </button>
          ) : null}
        </div>
      </nav>
      {portal}
    </>
  );
}
