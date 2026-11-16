export function ConciergeResultsSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true">
      <div className="max-w-3xl space-y-4">
        <div className="h-3 w-28 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
        <div className="h-10 w-4/5 max-w-md animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
        <div className="h-5 w-full max-w-lg animate-pulse rounded bg-stone-100 dark:bg-stone-900" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="h-80 animate-pulse rounded-3xl bg-stone-200 dark:bg-stone-800"
          />
        ))}
      </div>
    </div>
  );
}