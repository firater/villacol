import { Gem } from "lucide-react";

type Props = {
  rating: number;
  label: string;
};

function formatEditorScore(rating: number): string {
  return rating.toLocaleString(undefined, {
    minimumFractionDigits: rating % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

/** Magazine-style editorial score beside the villa title. */
export function VillaEditorScore({ rating, label }: Props) {
  if (!Number.isFinite(rating) || rating < 1 || rating > 10) {
    return null;
  }

  const score = formatEditorScore(rating);

  return (
    <div
      className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-amber-200/80 bg-amber-50/90 px-3 py-1.5 dark:border-amber-900/50 dark:bg-amber-950/30"
      aria-label={`${label}: ${score} out of 10`}
    >
      <Gem
        className="size-3.5 shrink-0 fill-amber-400/90 text-amber-600 dark:text-amber-400"
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="font-sans text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100">
        {score}
        <span className="font-medium text-stone-600 dark:text-stone-400">/10</span>
      </span>
      <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
        {label}
      </span>
    </div>
  );
}
