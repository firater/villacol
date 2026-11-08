export function HomeCategoriesFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-hidden>
      <div className="mb-8 space-y-2 md:mb-10">
        <div className="h-3 w-16 animate-pulse rounded bg-stone-200/80" />
        <div className="h-9 w-48 animate-pulse rounded bg-stone-200/80 md:h-10 md:w-56" />
      </div>
      <ul className="no-scrollbar flex gap-4 overflow-hidden pb-2">
        {[1, 2, 3, 4, 5, 6].map((key) => (
          <li key={key} className="shrink-0">
            <div className="w-[200px] animate-pulse sm:w-[228px]">
              <div className="relative aspect-[4/5] rounded-xl bg-stone-200/90">
                <div className="absolute top-2.5 left-2.5 h-5 w-14 rounded-full bg-white/80" />
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-5 w-3/4 rounded bg-stone-200/80" />
                <div className="h-3.5 w-28 rounded bg-stone-200/70" />
                <div className="h-2.5 w-14 rounded bg-stone-200/60" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
