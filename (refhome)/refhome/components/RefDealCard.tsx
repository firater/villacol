import {
  MapPinIcon,
  StarIcon,
  UsersIcon,
  Square2StackIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";

type Tile = {
  title: string;
  area: string;
  badge: string;
  snaps: string[];
  nightly: string;
  score: string;
  guests: number;
  beds: number;
  sq: number;
  when: string;
};

export default function RefDealCard({ tile }: { tile: Tile }) {
  return (
    <div className="group relative flex flex-col md:flex-row overflow-hidden rounded-[1.5rem] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-500 p-2 md:max-h-[320px]">
      <div className="relative w-full md:w-[40%] aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800 rounded-[1.2rem]">
        <img
          src={tile.snaps[0]}
          alt={tile.title}
          className="h-full w-full object-cover select-none transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80 pointer-events-none" />
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 backdrop-blur-xl rounded-full shadow-sm">
            <span className="text-[9px] font-black tracking-widest uppercase text-white">{tile.badge}</span>
          </div>
        </div>
        <div className="absolute bottom-5 left-6 z-20 flex gap-1 pointer-events-none">
          {tile.snaps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${i === 0 ? "bg-white w-6" : "bg-white/40 w-1"}`}
            />
          ))}
        </div>
      </div>
      <div className="px-2 pt-4 md:pt-6 pb-3 md:px-8 flex flex-col flex-grow justify-between">
        <div>
          <div className="flex gap-2 mb-3">
            <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-500">4 Network</span>
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-700">Family</span>
          </div>
          <div className="flex gap-2 items-bottom mb-2">
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white line-clamp-1">{tile.title}</h3>
            <div className="flex items-center gap-0.5 text-md font-semibold text-neutral-400 dark:text-white line-clamp-1">
              <MapPinIcon className="h-3.5 w-3.5 text-neutral-400" />
              {tile.area}
            </div>
            <div className="ml-auto flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md">
              <StarIcon className="h-3 w-3 text-amber-500 fill-amber-500" />
              <span className="text-xs font-black text-amber-700 dark:text-amber-400">{tile.score}</span>
            </div>
          </div>
          <div className="flex items-center gap-5 pt-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-1.5">
              <UsersIcon className="h-4 w-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-600">{tile.guests}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HomeIcon className="h-4 w-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-600">{tile.beds}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Square2StackIcon className="h-3.5 w-3.5 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-600">{tile.sq}m²</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3">
          <div>
            <p className="text-xs font-medium text-neutral-400 tracking-tighter mb-0.5">Price starting at</p>
            <p className="text-xl font-semibold tracking-tighter text-orange-500 dark:text-white">
              ${tile.nightly}
              <span className="text-[10px] font-bold opacity-60"> /night</span>
            </p>
          </div>
        </div>
        <div className="absolute top-4 left-4 z-20 md:left-auto md:right-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md rounded-full border border-white/20 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-tighter">İlk Müsaitlik</span>
              <span className="text-[11px] font-black text-neutral-950 dark:text-white">{tile.when}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
