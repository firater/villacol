export function HomeCategoriesFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-hidden>
      <header className="mb-12 lg:mb-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-4">
            <div className="h-3 w-40 animate-pulse bg-stone-200" />
            <div className="h-14 w-48 animate-pulse bg-stone-200 sm:w-64" />
            <div className="h-4 w-full max-w-sm animate-pulse bg-stone-200/80" />
          </div>
          <div className="flex gap-3">
            <div className="size-11 animate-pulse border border-stone-300 bg-stone-100" />
            <div className="size-11 animate-pulse border border-stone-300 bg-stone-100" />
          </div>
        </div>
        <div className="mt-10 flex justify-between border-y border-stone-200/45 py-5">
          <div className="h-8 w-56 animate-pulse bg-stone-200/80" />
          <div className="h-4 w-28 animate-pulse bg-stone-200/60" />
        </div>
      </header>
      <ul className="no-scrollbar flex gap-5 overflow-hidden sm:gap-6">
        {[1, 2, 3, 4, 5, 6].map((key) => (
          <li key={key} className="shrink-0">
            <div className="w-[216px] sm:w-[256px]">
              <div className="relative h-[336px] bg-stone-200 sm:h-[376px]">
                <div className="absolute top-0 left-0 h-6 w-16 animate-pulse bg-white" />
              </div>
              <div className="mt-4 min-h-[9.5rem] space-y-2">
                <div className="h-5 w-4/5 animate-pulse bg-stone-200/80" />
                <div className="h-4 w-2/3 animate-pulse bg-stone-200/70" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
