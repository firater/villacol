import {
  MapPinIcon,
  StarIcon,
  UsersIcon,
  Square2StackIcon,
  HomeIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { CalendarCheck, ArrowRight, Sparkles } from "lucide-react";

type Tile = {
  title: string;
  area: string;
  snaps: string[];
  nightly: string;
  unit: string;
  people: number;
  rooms: number;
  chipA: string | null;
  chipB: string | null;
};

export default function RefPickCard({ tile }: { tile: Tile }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[2.5rem] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-2xl transition-all duration-500">
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <img src={tile.snaps[0]} alt={tile.title} className="h-full w-full object-cover select-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 pointer-events-none" />
        <div className="absolute top-6 left-6 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-xl rounded-full shadow-sm">
            <ShieldCheckIcon className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-[10px] font-black tracking-widest uppercase text-neutral-800">Onaylı Villa</span>
          </div>
        </div>
        <div className="absolute top-6 right-6 z-30 flex flex-col items-end gap-2">
          {tile.chipA && (
            <div className="px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-xl bg-emerald-600/95 border-emerald-400 text-white">
              <span className="text-[10px] font-black uppercase tracking-tight">{tile.chipA}</span>
            </div>
          )}
          {tile.chipB && (
            <div className="px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-xl bg-rose-600/95 border-rose-500 text-white">
              <span className="text-[10px] font-black uppercase tracking-tight">{tile.chipB}</span>
            </div>
          )}
        </div>
        <div className="absolute bottom-8 inset-x-8 flex justify-between items-end z-20 pointer-events-none">
          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5">
              {tile.snaps.map((_, i) => (
                <div key={i} className={`h-1 rounded-full ${i === 0 ? "bg-white w-6" : "bg-white/40 w-1.5"}`} />
              ))}
            </div>
            <p className="text-white text-2xl font-black tracking-tighter">
              {tile.nightly} {tile.unit}
              <span className="text-sm font-medium opacity-70">/gece</span>
            </p>
          </div>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight leading-none mb-2 uppercase italic truncate">
          {tile.title}
        </h3>
        <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-bold uppercase tracking-[0.15em] mb-3">
          <MapPinIcon className="h-4 w-4 text-neutral-500" />
          {tile.area}
          <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg">
            <StarIcon className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">4.9</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 py-3 border-y border-neutral-100 dark:border-neutral-800">
          <RefStatRow icon={<UsersIcon className="h-4 w-4 text-neutral-600" />} label={`${tile.people} Kişi`} />
          <RefStatRow icon={<HomeIcon className="h-4 w-4 text-neutral-600" />} label={`${tile.rooms} Yatak Odası`} />
          <RefStatRow icon={<Square2StackIcon className="h-4 w-4 text-neutral-600" />} label="Private Pool" />
          <RefStatRow icon={<ShieldCheckIcon className="h-4 w-4 text-neutral-600" />} label="Tam Korunaklı" />
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-8 rounded-full border-2 border-white dark:border-neutral-900 bg-neutral-200" />
            ))}
            <div className="h-8 flex items-center pl-4">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">12 Rezervasyon</span>
            </div>
          </div>
          <span className="px-6 py-3 bg-neutral-900 text-white rounded-2xl text-[10px] font-black uppercase">İncele</span>
        </div>
        <div className="w-full border rounded-2xl p-3 mt-2 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-neutral-500">
              <CalendarCheck size={12} className="text-rose-600" />
              <span className="text-[10px] font-bold">10 Şub - 17 Şub</span>
            </div>
            <div className="flex items-center gap-1 bg-rose-600 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">
              <Sparkles size={8} />
              7 AL 6 ÖDE
            </div>
          </div>
          <div className="flex justify-between items-end p-2 mt-2 rounded-xl border bg-white dark:bg-neutral-800 border-rose-100 dark:border-rose-900/30">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-neutral-400 uppercase">7 GECE TOPLAM</span>
              <span className="text-sm font-black text-rose-600">35,000 ₺</span>
            </div>
            <span className="h-7 px-3 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 bg-rose-600 text-white shadow-md">
              SEÇ
              <ArrowRight size={10} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RefStatRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-xl">{icon}</div>
      <span className="text-xs font-black">{label}</span>
    </div>
  );
}
