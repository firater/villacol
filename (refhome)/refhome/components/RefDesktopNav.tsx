import { ChatBubbleLeftEllipsisIcon, MapIcon, ChevronDownIcon, BellIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { Bars4Icon } from "@heroicons/react/20/solid";

export default function RefDesktopNav() {
  return (
    <div>
      <div className="pt-5 pb-6">
        <div className="flex flex-wrap border-b border-gray-200 pb-3">
          <span className="h-[48px] text-orange-600 font-black rounded p-3 pr-5 mr-4 text-black cursor-default">
            .cimrivilla
          </span>
          <div className="mt-2 mb-2 border-r border-gray-200" />

          <span className="me-auto ml-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-neutral-700">
            <MapIcon className="h-5 w-5 text-neutral-500" aria-hidden />
            <span className="text-md font-medium">Konumlar</span>
          </span>

          <span className="inline-flex items-center gap-2 h-[48px] px-4 py-1.5 text-md font-medium text-neutral-700">
            <Bars4Icon className="h-4 w-4" />
            Menü
          </span>

          <span className="ml-4 inline-flex items-center gap-2 h-[48px] px-3 py-1.5 text-sm font-black rounded-full">
            <GlobeAltIcon className="h-[18px] w-[18px] opacity-80" />
            <span className="uppercase tracking-widest text-[11px]">TRY</span>
            <ChevronDownIcon className="h-4 w-4" />
          </span>

          <span className="ml-1 relative mt-1 p-2 rounded-full">
            <BellIcon className="h-5 w-5 text-neutral-500" />
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          </span>

          <span className="ml-4 inline-flex items-center gap-2 h-[48px] px-4 py-1.5 text-md font-medium text-neutral-700">
            <span>Konumlar</span>
            <ChevronDownIcon className="h-4 w-4" />
          </span>

          <span className="ml-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-neutral-700">
            <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-neutral-500" aria-hidden />
            <span className="text-sm font-medium">Contact Support</span>
          </span>
        </div>
      </div>
    </div>
  );
}
