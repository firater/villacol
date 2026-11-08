import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { refMedia } from "../media";

export default function RefDailyPromo() {
  return (
    <div className="w-full max-w-[420px] pb-6 relative group cursor-pointer">
      <div className="h-[140px] relative overflow-hidden rounded-2xl bg-neutral-900 shadow-xl">
        <Image
          src={refMedia.promoBg}
          alt="Luxury Villa"
          fill
          className="object-cover object-[25%_65%] transition-transform duration-1000 group-hover:scale-110"
        />
        <div className="absolute top-5 right-0 z-30">
          <span className="flex items-center gap-2 px-4 py-2 bg-white border border-white/20 rounded-l-3xl transition-all duration-300 group/btn shadow-xl">
            <span className="text-[10px] font-black uppercase tracking-widest">Villa Promosyonları</span>
            <div className="bg-white rounded-full p-0.5 group-hover/btn:rotate-45 transition-transform">
              <ArrowUpRight className="size-3 text-orange-600" />
            </div>
          </span>
        </div>
        <div className="absolute bottom-6 left-7 z-30 flex flex-col gap-1">
          <p className="text-white text-xl font-bold tracking-tighter">Bugüne Özel</p>
          <p className="text-xs font-bold text-white">Cimri Villa&apos;ya Özel Promosyon Listesi</p>
          <span className="text-[8px] font-regular text-white">17 Ocak 2026&apos;da Güncellendi</span>
        </div>
        <div className="absolute inset-0 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transform transition-transform" />
      </div>
      <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-full text-center">
        <span className="text-[8px] font-black text-orange-500/80 uppercase tracking-[0.6em] opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 inline-block">
          Elit Villalara Uygun Fiyata Ulaşın!
        </span>
      </div>
    </div>
  );
}
