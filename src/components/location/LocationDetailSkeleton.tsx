export function LocationDetailSkeleton() {
  return (
    <main className="flex flex-1 flex-col bg-stone-50/90 dark:bg-zinc-950" aria-busy="true">
      <div className="min-h-[28rem] animate-pulse bg-stone-300 dark:bg-stone-800 sm:min-h-[32rem] lg:min-h-[36rem]" />
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-16 sm:px-6 lg:px-8">
        <div className="h-4 w-48 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
        <div className="h-32 w-full max-w-3xl animate-pulse rounded bg-stone-100 dark:bg-stone-900" />
        <div className="grid gap-8 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800"
            />
          ))}
        </div>
      </div>
    </main>
  );
}