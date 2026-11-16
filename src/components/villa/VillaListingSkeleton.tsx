/**
 * Grid placeholder while listing queries and currency preferences resolve.
 * Mirrors `VillaListingGrid` layout (`min-w-0 flex-1`) so flex does not squeeze columns.
 */
export function VillaListingSkeleton() {
  return (
    <div className="min-w-0 w-full flex-1">
      <div
        className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
        aria-hidden
      />
      <div className="mt-6 grid w-full min-w-0 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <div
              className="aspect-[4/3] w-full animate-pulse bg-zinc-200 dark:bg-zinc-800"
              aria-hidden
            />
            <div className="space-y-3 p-5">
              <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-6 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800 pt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}