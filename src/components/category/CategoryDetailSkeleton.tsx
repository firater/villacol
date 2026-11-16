export function CategoryDetailSkeleton() {
  return (
    <main className="flex flex-1 flex-col bg-stone-50/90 dark:bg-zinc-950" aria-busy="true">
      <div className="border-b border-stone-200/80 bg-white px-4 py-12 dark:border-zinc-800 dark:bg-zinc-900/40 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="h-3 w-24 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
          <div className="h-10 w-2/3 max-w-md animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
          <div className="h-20 w-full max-w-2xl animate-pulse rounded bg-stone-100 dark:bg-stone-900" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-3xl bg-stone-200 dark:bg-stone-800"
            />
          ))}
        </div>
      </div>
    </main>
  );
}