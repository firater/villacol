"use client";

import { Gem } from "lucide-react";

type Props = {
  editorBadgeLabel: string;
  editorScore: string;
  editorScoreLabel: string;
  imageRatingAria: string | null;
  popoverTitle: string;
  popoverBody: string;
};

/** Promo image editor score with hover tooltip (matches savings pill pattern). */
export function PromoEditorRatingBadge({
  editorBadgeLabel,
  editorScore,
  editorScoreLabel,
  imageRatingAria,
  popoverTitle,
  popoverBody,
}: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-start p-2.5 md:p-3">
      <span className="group/editor relative max-w-full shrink cursor-default pointer-events-auto">
        <span
          className="inline-flex items-center gap-1 rounded-sm bg-white/92 px-2 py-1 shadow-sm backdrop-blur-[2px]"
          aria-label={imageRatingAria ?? undefined}
          tabIndex={0}
        >
          <Gem
            className="size-3.5 shrink-0 fill-amber-400/90 text-amber-500"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="font-sans text-[10px] font-semibold text-stone-600">
            {editorBadgeLabel}:
          </span>
          <span className="font-sans text-[11px] font-bold tracking-tight text-stone-900">
            {editorScore}
            <span className="font-semibold text-stone-600">/10</span>
          </span>
          <span className="sr-only">{editorScoreLabel}</span>
        </span>

        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-0 z-30 mb-1.5 w-max max-w-[11rem] rounded-lg border border-stone-200/90 bg-white px-2.5 py-2 text-left font-serif text-xs leading-snug text-stone-700 opacity-0 shadow-md transition-opacity duration-150 group-hover/editor:opacity-100 group-focus-within/editor:opacity-100"
        >
          <span className="block text-sm font-semibold text-stone-900">{popoverTitle}</span>
          <span className="mt-1 block text-xs text-stone-500">{popoverBody}</span>
        </span>
      </span>
    </div>
  );
}