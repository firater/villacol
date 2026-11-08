import { dealTabs, dealTiles } from "./placeholders";
import RefDealCard from "./RefDealCard";

export default function RefDealsBlock() {
  return (
    <section aria-labelledby="ref-deals-title" className="w-full py-12 md:py-16">
      <header className="max-w-2xl md:mb-4">
        <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-2 md:mb-3 block italic">
          8 Kasım 2026
        </span>
        <h2 id="ref-deals-title" className="text-2xl md:text-5xl font-black text-neutral-950 dark:text-white tracking-tighter uppercase italic">
          Promosyonlar <span className="text-rose-500">.</span>
        </h2>
        <p className="text-neutral-400 text-xs md:text-base mt-1 md:mt-3 mb-1 md:mb-3 font-medium">
          Sizin için seçtiğimiz en özel fırsat ve kampanyalar.
        </p>
      </header>
      <div className="relative w-full mb-8 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex gap-2 overflow-x-auto ref-scrollbar-hide py-4 items-center">
          {dealTabs.map((tab, i) => (
            <span key={tab.key} className="relative px-6 py-2">
              <span
                className={`relative z-10 text-[10px] md:text-xs font-black uppercase tracking-widest ${
                  i === 0 ? "text-white" : "text-neutral-400"
                }`}
              >
                {tab.caption}
              </span>
              {i === 0 && (
                <span className="absolute inset-0 bg-black dark:bg-neutral-100 rounded-full" aria-hidden />
              )}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 min-h-[400px]">
        {dealTiles.map((tile, index) => (
          <RefDealCard key={index} tile={tile} />
        ))}
      </div>
    </section>
  );
}
