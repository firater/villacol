/** Minimal ornament between homepage editorial sections. */
export function HomeSectionDivider() {
  return (
    <div className="mx-auto flex w-full max-w-7xl items-center px-4 py-2 sm:px-6 lg:px-8" aria-hidden>
      <div className="h-px flex-1 bg-stone-200" />
      <span className="px-4 font-serif text-sm text-stone-400">·</span>
      <div className="h-px flex-1 bg-stone-200" />
    </div>
  );
}
