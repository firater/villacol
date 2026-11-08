import { perkSlides } from "./placeholders";

export default function RefAdvantages() {
  return (
    <section aria-labelledby="ref-advantages-title" className="nc-SectionExploreNearby mx-auto pt-16 md:pt-20 pb-14 w-full max-w-7xl">
      <header className="mb-6 md:mb-8 text-center">
        <span className="text-orange-600 text-[10px] font-bold uppercase tracking-[0.3em] mb-2 md:mb-3 block">
          Cimri Villa Avantajları
        </span>
        <h2 id="ref-advantages-title" className="text-2xl md:text-5xl font-black text-neutral-950 dark:text-white tracking-tighter italic uppercase">
          Neden Cimri Villa?
        </h2>
        <p className="text-neutral-400 text-xs md:text-base mt-1 md:mt-3 mb-1 md:mb-3">
          İyi bir tatil pahalı olmak zorunda değil, <br /> Bunu garanti ediyoruz.
        </p>
      </header>
      <div
        className="ref-no-scrollbar flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 sm:grid sm:grid-cols-2 sm:gap-6 md:gap-8 lg:grid-cols-3 xl:grid-cols-4 sm:overflow-visible sm:pb-8"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {perkSlides.map((item, index) => (
          <div
            key={index}
            className="group relative flex items-center p-4 rounded-3xl border border-neutral-200 bg-white transition-all shrink-0 w-[85vw] snap-start sm:w-auto sm:shrink hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
          >
            <div className="relative size-16 sm:size-20 shrink-0 overflow-hidden rounded-full shadow-inner bg-neutral-100">
              <img
                alt={item.heading}
                src={item.visual}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="ms-4 grow overflow-hidden">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white line-clamp-1">{item.heading}</h3>
              <p className="mt-1 block text-xs text-neutral-500 dark:text-neutral-400">{item.blurb}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2 pb-4 sm:hidden">
        {perkSlides.map((_, index) => (
          <div
            key={index}
            className={`h-0.5 rounded-full transition-all duration-600 ${
              index === 0 ? "w-3 bg-neutral-800" : "w-1 bg-neutral-300 dark:bg-neutral-700"
            }`}
          />
        ))}
      </div>
      <div className="flex justify-center pt-8">
        <div className="max-w-3xl">
          <h3 className="text-xl font-bold mb-4">Güvenilir ve Ekonomik Villa Kiralama Süreci</h3>
          <div className="space-y-4 text-neutral-600 text-sm leading-relaxed">
            <p>
              Türkiye&apos;nin en popüler tatil rotaları olan <strong>Kaş, Kalkan ve Fethiye</strong> bölgelerinde, her
              bütçeye uygun lüks konaklama çözümleri sunuyoruz. <strong>Cimri Villa</strong> olarak temel misyonumuz,
              kalite standartlarından ödün vermeden &quot;en iyi fiyat garantisi&quot; ile hayalinizdeki tatili ulaşılabilir
              kılmaktır.
            </p>
            <p>
              Portföyümüzdeki tüm <strong>muhafazakar villalar</strong>, balayı seçenekleri ve geniş aile villaları
              ekibimiz tarafından yerinde kontrol edilerek doğrulanmaktadır. Rezervasyon sürecinden konaklama sonuna
              kadar kesintisiz destek sunarak, villa kiralama deneyiminizi kusursuz hale getiriyoruz.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
