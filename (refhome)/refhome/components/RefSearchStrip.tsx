import {
  MapPinIcon,
  CalendarIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export default function RefSearchStrip() {
  return (
    <div className="relative w-full max-w-5xl z-100">
      <div className="flex items-center bg-white dark:bg-neutral-800 rounded-full shadow-2xl border border-neutral-100 dark:border-neutral-700 p-2">
        <div className="flex-[1.5] flex items-center gap-x-4 px-8 py-4 rounded-full">
          <MapPinIcon className="size-6 text-neutral-400" />
          <div className="flex flex-col flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Location</span>
            <span className="bg-transparent font-semibold text-neutral-400 text-base">Where are you going?</span>
          </div>
        </div>
        <div className="h-10 border-l border-neutral-100 dark:border-neutral-700" />
        <div className="flex-1 flex items-center gap-x-4 px-8 py-4 rounded-full">
          <CalendarIcon className="size-6 text-neutral-400" />
          <div className="flex flex-col flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Dates</span>
            <span className="font-semibold text-neutral-400 text-base">Add dates</span>
          </div>
        </div>
        <div className="h-10 border-l border-neutral-100 dark:border-neutral-700" />
        <div className="flex-1 flex items-center justify-between px-8 py-4 rounded-full">
          <div className="flex items-center gap-x-4">
            <UserPlusIcon className="size-6 text-neutral-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Guests</span>
              <span className="font-semibold text-neutral-800 dark:text-white text-base">1 Guest</span>
            </div>
          </div>
        </div>
        <span className="size-14 ml-2 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-lg">
          <MagnifyingGlassIcon className="size-6 stroke-[3]" />
        </span>
      </div>
    </div>
  );
}
