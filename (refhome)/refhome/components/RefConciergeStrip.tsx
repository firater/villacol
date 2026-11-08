import { Phone, MessageCircle, ArrowUpRight } from "lucide-react";

export default function RefConciergeStrip() {
  return (
    <section className="w-full pb-28 pt-25 mb-10 mt-8 bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-900 relative">
      <div className="mx-auto flex flex-col md:flex-row items-center justify-around gap-2">
        <div className="flex flex-col text-center md:text-left">
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-2">
            <span className="text-rose-600 tracking-[0.1em]">%100!</span> En İyi Fiyat Garantisi
          </h3>
          <h2 className="text-3xl md:text-6xl font-bold text-orange-600 dark:text-white tracking-tighter leading-tight uppercase">
            İndirim Alın <br />
          </h2>
          <p className="mt-4 text-sm md:text-base text-neutral-500 max-w-md">
            Size en uygun villayı bulmak ve özel taleplerinizi karşılamak için concierge ekibimiz bir telefon uzağınızda.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="group relative flex items-center justify-between gap-8 bg-[#25D366]/5 hover:bg-[#25D366]/10 border border-[#25D366]/20 p-6 rounded-2xl transition-all duration-500">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#25D366]/20">
                <MessageCircle size={24} fill="currentColor" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#25D366] mb-1">WhatsApp</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-white leading-none">Hızlı Mesaj</p>
              </div>
            </div>
            <div className="size-10 rounded-full dark:border-neutral-800 flex items-center justify-center group-hover:border-orange-100 transition-all">
              <ArrowUpRight
                size={20}
                className="text-neutral-300 group-hover:text-[#25D366] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all"
              />
            </div>
          </div>
          <div className="group relative flex items-center justify-between gap-8 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-6 rounded-2xl transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-orange-50 dark:bg-orange-500/10 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-500 transition-colors group-hover:bg-orange-600 group-hover:text-white">
                <Phone size={20} fill="currentColor" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-1.5 group-hover:text-orange-600 transition-colors">
                  Bizi Arayın
                </p>
                <p className="text-xl font-black text-neutral-900 dark:text-white leading-none tracking-tight">
                  +90 242 844 00 12
                </p>
              </div>
            </div>
            <div className="size-10 rounded-full dark:border-neutral-800 flex items-center justify-center group-hover:border-orange-100 transition-all">
              <ArrowUpRight
                size={20}
                className="text-neutral-300 group-hover:text-orange-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 bottom-12 pointer-events-none select-none overflow-hidden h-32 w-full flex justify-center opacity-[0.02] dark:opacity-[0.05]">
        <span className="text-[120px] font-black uppercase tracking-tighter leading-none">CANLI DESTEK</span>
      </div>
    </section>
  );
}
