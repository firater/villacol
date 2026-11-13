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

/** Sharp, magazine-style editorial badge beside the title block. */
export function VillaEditorScore({ rating, label }: Props) {
  if (!Number.isFinite(rating) || rating < 1 || rating > 10) {
    return null;
  }

  const score = formatEditorScore(rating);

  return (
    <div
      className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 border border-stone-900 bg-stone-900 px-3 py-2 text-stone-50 shadow-sm dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
      aria-label={`${label}: ${score} out of 10`}
    >
      <span className="text-sm leading-none" aria-hidden>
        💎
      </span>
      <span className="font-serif text-lg font-medium leading-none tracking-tight">
        {score}
        <span className="font-sans text-sm font-normal text-stone-400 dark:text-stone-600">
          /10
        </span>
      </span>
      <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-400 dark:text-stone-600">
        {label}
      </span>
    </div>
  );
}
