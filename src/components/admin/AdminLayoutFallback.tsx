/** Placeholder while session resolution runs inside Suspense. */
export function AdminLayoutFallback() {
  return (
    <div
      className="flex min-h-[calc(100vh-0px)] flex-col bg-zinc-50 dark:bg-zinc-950"
      aria-busy="true"
    >
      <div className="h-14 animate-pulse border-b border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 md:block">
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="h-8 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900"
              />
            ))}
          </div>
        </aside>
        <div className="min-w-0 flex-1 p-6">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
          <div className="mt-6 h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
        </div>
      </div>
    </div>
  );
}
