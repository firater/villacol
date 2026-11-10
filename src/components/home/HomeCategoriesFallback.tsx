export function HomeCategoriesFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-hidden>
      <div className="mb-8 block max-w-3xl space-y-2 md:mb-10">
        <div className="h-3 w-16 animate-pulse rounded-sm bg-stone-200/80" />
        <div className="h-10 w-56 animate-pulse rounded-sm bg-stone-200/80 md:h-12 md:w-64" />
        <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded-sm bg-stone-200/70" />
        <div className="mt-3 h-7 w-[min(100%,20rem)] animate-pulse rounded-full border border-stone-200/80 bg-transparent" />
      </div>
      <ul className="no-scrollbar flex gap-8 overflow-hidden pt-4 pb-[18px]">
        {[1, 2, 3, 4, 5, 6].map((key) => (
          <li key={key} className="shrink-0">
            <div className="relative aspect-[3/5] w-[210px] overflow-hidden rounded-[2.25rem] bg-stone-800/90 sm:w-[236px]">
                <div className="absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-stone-300/90 via-stone-200/50 to-transparent px-3.5 pt-12 pb-4">
                  <div className="h-6 w-4/5 rounded bg-stone-100/80" />
                  <div className="h-3.5 w-1/3 rounded bg-stone-100/60" />
                  <div className="mt-1 h-10 w-full rounded-full bg-stone-100/70" />
                </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
