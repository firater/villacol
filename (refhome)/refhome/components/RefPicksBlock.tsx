import { pickTabs, pickTiles } from "./placeholders";
import RefPickCard from "./RefPickCard";

export default function RefPicksBlock() {
  return (
    <section className="w-full mx-auto py-16 px-4 md:px-0">
      <header className="max-w-2xl md:mb-4">
        <span className="text-neutral-500 text-[10px] font-medium uppercase tracking-[0.3em] mb-2 block">
          Ocak 2026 Seçkisi
        </span>
        <h2 className="text-2xl md:text-5xl font-black text-neutral-950 dark:text-white tracking-tighter uppercase leading-tight">
          Önerilen Villalar
        </h2>
        <p className="text-neutral-400 text-xs md:text-base mt-1 md:mt-3 mb-1 md:mb-3 font-medium">
          Editörlerimizin en iyiler arasından seçtiği avantajlı villaları keşfedin.
        </p>
      </header>
      <div className="relative w-full mb-12 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex gap-2 overflow-x-auto ref-scrollbar-hide py-4 items-center">
          {pickTabs.map((label, i) => (
            <span key={label} className="relative px-6 py-2">
              <span
                className={`relative z-10 text-xs md:text-sm font-bold tracking-tight ${
                  i === 0 ? "text-white" : "text-neutral-400"
                }`}
              >
                {label}
              </span>
              {i === 0 && <span className="absolute inset-0 bg-neutral-900 dark:bg-white rounded-full" aria-hidden />}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[500px]">
        {pickTiles.map((tile, index) => (
          <RefPickCard key={index} tile={tile} />
        ))}
      </div>
    </section>
  );
}
