export function ContactPageFallback() {
  return (
    <main className="flex flex-1 flex-col animate-pulse bg-stone-50/90 dark:bg-zinc-950">
      <SkeletonBar className="min-h-[12rem] w-full border-b border-stone-200 dark:border-zinc-800" />
      <div className="mx-auto grid w-full max-w-6xl gap-14 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <SkeletonBar className="min-h-[24rem] w-full" />
        <SkeletonBar className="min-h-[24rem] w-full" />
      </div>
    </main>
  );
}

function SkeletonBar({ className }: { className: string }) {
  return <div className={`rounded-lg bg-stone-100 dark:bg-zinc-900 ${className}`} />;
}
