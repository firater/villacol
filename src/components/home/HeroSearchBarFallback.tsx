export function HeroSearchBarFallback() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="flex gap-2">
        {[1, 2, 3].map((key) => (
          <div key={key} className="h-9 w-24 animate-pulse rounded-full bg-zinc-200" />
        ))}
      </div>
      <div className="grid gap-0 overflow-hidden rounded-2xl border border-stone-200/60 bg-white md:grid-cols-[1.35fr_1.85fr_0.95fr_auto] md:rounded-full">
        {[1, 2, 3].map((key) => (
          <div
            key={key}
            className="min-h-[4.5rem] border-b border-zinc-100 px-4 py-3 md:border-b-0 md:border-r"
          >
            <div className="h-3 w-16 animate-pulse rounded bg-zinc-200" />
            <div className="mt-2 h-4 w-28 animate-pulse rounded bg-zinc-100" />
          </div>
        ))}
        <div className="min-h-[4.5rem] animate-pulse bg-zinc-200 md:min-w-[4.5rem]" />
      </div>
    </div>
  );
}
