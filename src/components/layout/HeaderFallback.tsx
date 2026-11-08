/**
 * Placeholder while `resolvePreferences()` reads cookies. Matches the real header height.
 */
export function HeaderFallback() {
  return (
    <header className="relative z-30 w-full border-b border-transparent bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="flex min-h-[5.5rem] flex-wrap items-center gap-y-4 border-b border-stone-200/90 py-6 lg:min-h-[6.5rem] lg:py-8">
          <div className="flex items-center gap-6">
            <div className="h-8 w-36 animate-pulse rounded bg-neutral-200" />
            <div className="hidden h-6 w-28 animate-pulse rounded bg-neutral-100 sm:block" />
            <div className="h-10 w-24 animate-pulse rounded-full border border-neutral-200 bg-neutral-50" />
          </div>
          <div className="ms-auto flex gap-6">
            <div className="h-10 w-[7.5rem] animate-pulse rounded-full border border-neutral-200 bg-neutral-50" />
            <div className="size-10 animate-pulse rounded-full border border-neutral-200 bg-neutral-50" />
          </div>
        </div>
      </div>
    </header>
  );
}
