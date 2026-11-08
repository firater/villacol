export function HomeCategoriesFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-hidden>
      <div className="mb-12 h-10 w-56 animate-pulse rounded bg-stone-200/80 md:mb-16" />
      <ul className="no-scrollbar flex gap-6 overflow-hidden pb-6">
        {[1, 2, 3, 4, 5].map((key) => (
          <li key={key} className="shrink-0">
            <div className="h-[380px] w-[280px] animate-pulse rounded-2xl bg-stone-200/90 sm:h-[400px] sm:w-[300px]" />
          </li>
        ))}
      </ul>
    </div>
  );
}
