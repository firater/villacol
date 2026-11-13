/** Placeholder while editorial / legal page copy streams in. */
export function EditorialPageFallback() {
  return (
    <main className="flex flex-1 flex-col animate-pulse bg-stone-50/90 dark:bg-zinc-950">
      <div className="border-b border-stone-200/80 bg-white/70 px-4 py-16 sm:px-6 lg:py-20 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-3xl space-y-4">
          <SkeletonBar className="h-8 w-2/3" />
          <SkeletonBar className="h-24 w-full" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-14 sm:px-6">
        <SkeletonBar className="h-24 w-full" />
        <SkeletonBar className="h-24 w-full" />
        <SkeletonBar className="h-24 w-full" />
      </div>
    </main>
  );
}

function SkeletonBar({ className }: { className: string }) {
  return <div className={`rounded bg-stone-100 dark:bg-zinc-900 ${className}`} />;
}
