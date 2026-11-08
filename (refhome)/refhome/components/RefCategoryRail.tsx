import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { railItems } from "./placeholders";

export default function RefCategoryRail() {
  return (
    <section className="w-full py-6 md:py-16 md:mt-16 group/section">
      <header className="mb-6">
        <div className="flex justify-between items-end">
          <h2 className="text-2xl md:text-5xl font-black text-neutral-950 dark:text-white tracking-tighter uppercase">
            Villa Kategorileri
          </h2>
          <span className="text-xs font-medium text-neutral-400">Tümü →</span>
        </div>
      </header>
      <div className="relative">
        <span className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 size-10 bg-white dark:bg-neutral-800 rounded-full shadow-lg hidden md:flex items-center justify-center border border-neutral-100 dark:border-neutral-700 opacity-80">
          <ChevronLeftIcon className="size-5" />
        </span>
        <div
          className="flex gap-3 overflow-x-auto ref-scrollbar-hide snap-x snap-mandatory px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {railItems.map((item, idx) => (
            <div key={idx} className="group/card relative w-[44%] md:w-[200px] shrink-0 snap-start flex flex-col">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
                <img
                  alt={item.label}
                  src={item.visual}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                />
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md border border-white/20 shadow-sm">
                    <span className="text-[9px] font-bold text-neutral-800 dark:text-white uppercase tracking-tighter">
                      {item.tally} Villas
                    </span>
                  </span>
                </div>
              </div>
              <div className="mt-2.5">
                <h3 className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 leading-tight line-clamp-1">
                  {item.label}
                </h3>
              </div>
            </div>
          ))}
        </div>
        <span className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 size-10 bg-white dark:bg-neutral-800 rounded-full shadow-lg hidden md:flex items-center justify-center border border-neutral-100 dark:border-neutral-700 opacity-80">
          <ChevronRightIcon className="size-5" />
        </span>
      </div>
      <div className="flex md:hidden justify-center gap-1.5 mt-4">
        {railItems.map((_, index) => (
          <div
            key={index}
            className={`h-0.5 rounded-full transition-all duration-600 ${
              index === 0 ? "w-3 bg-neutral-800 dark:bg-white" : "w-1 bg-neutral-300 dark:bg-neutral-700"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
