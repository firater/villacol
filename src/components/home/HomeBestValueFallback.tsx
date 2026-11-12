export function HomeBestValueFallback() {
  return (
    <div>
      <div className="relative flex min-h-11 animate-pulse items-center justify-end gap-3 border-b border-stone-200 py-2.5 lg:py-3">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-40 -translate-x-1/2 -translate-y-1/2 bg-stone-200" />
        <div className="flex gap-3">
          <div className="size-11 border border-stone-200 bg-stone-100" />
          <div className="size-11 border border-stone-200 bg-stone-100" />
        </div>
      </div>
      <ul
        className="no-scrollbar mt-8 flex gap-5 overflow-hidden pb-1 lg:mt-10"
        aria-hidden
      >
        {[1, 2, 3].map((key) => (
          <li key={key} className="w-[17rem] shrink-0 sm:w-[18.5rem]">
            <div className="overflow-hidden border border-stone-200/60 bg-white">
              <div className="aspect-[4/3] w-full animate-pulse bg-stone-200" />
              <div className="space-y-2 p-6">
                <div className="h-5 w-3/4 animate-pulse rounded bg-stone-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-stone-100" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
