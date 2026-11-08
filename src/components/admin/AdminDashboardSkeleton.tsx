/** Reserved layout for dashboard cards and tables (CLS-safe). */
export function AdminDashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-72 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((key) => (
          <div
            key={key}
            className="min-h-[7.5rem] animate-pulse rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-4 h-9 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>

      <div className="min-h-[14rem] animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40" />
      <div className="min-h-[18rem] animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40" />
    </div>
  );
}
