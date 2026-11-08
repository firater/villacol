export function HomeCategoriesFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-hidden>
      <div className="mb-8 space-y-2 md:mb-10">
        <div className="h-3 w-16 animate-pulse rounded bg-stone-200/80" />
        <div className="h-9 w-48 animate-pulse rounded bg-stone-200/80 md:h-10 md:w-56" />
      </div>
      <ul className="no-scrollbar flex gap-6 overflow-hidden pb-2">
        {[1, 2, 3, 4, 5, 6].map((key) => (
          <li key={key} className="shrink-0">
            <div className="flex h-full w-[240px] flex-col rounded-none border border-stone-200/80 bg-stone-50 px-3 pb-3 pt-0 sm:w-[272px] sm:px-4 sm:pb-4">
              <div className="relative -mx-3 aspect-[4/5] animate-pulse bg-stone-200/90 sm:-mx-4">
                <div className="absolute top-2.5 left-2.5 h-5 w-14 rounded-full bg-white/80" />
              </div>
              <div className="flex flex-1 flex-col space-y-3 pt-4">
                <div className="h-[2.375rem] w-4/5 rounded bg-stone-200/80 sm:h-[2.875rem]" />
                <div className="space-y-2 border-t border-stone-200/60 pt-3">
                  <div className="h-3.5 w-28 rounded bg-stone-200/70" />
                  <div className="h-[2.75rem] w-32 rounded bg-stone-200/50" />
                  <div className="h-2.5 w-14 rounded bg-stone-200/60" />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
