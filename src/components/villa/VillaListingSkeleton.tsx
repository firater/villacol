/**
 * Grid placeholder while listing queries and currency preferences resolve.
 */
export function VillaListingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40"
        >
          <div className="aspect-[4/3] animate-pulse bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-6 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800 pt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
