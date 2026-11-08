import {
  Search,
  MapPin,
  Phone,
  ArrowUpRight,
  MessageCircle,
  Calendar,
  Users,
  SlidersHorizontal,
} from "lucide-react";

export default function RefMobileSearchBar() {
  return (
    <>
      <div className="fixed top-0 left-0 w-full z-[100] bg-gradient-to-t from-neutral-200/85 via-white/85 to-white/85 border-b border-gray-200/50 backdrop-blur-md shadow-md pt-4 py-2">
        <div className="max-w-7xl mx-auto px-4 overflow-hidden">
          <div className="flex items-center justify-between h-10 opacity-100 mb-2.5">
            <div className="flex flex-col pt-1" />
            <div className="flex items-center gap-2">
              <span className="relative size-8 flex items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 shadow-sm">
                <MessageCircle className="size-4 text-emerald-600" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </span>
              <span className="px-4 py-1.5 flex items-center gap-2 rounded-full bg-white border border-orange-200/50 shadow-sm">
                <span className="size-4 rounded-full bg-orange-100 flex items-center justify-center">
                  <Phone className="size-2 text-orange-600" />
                </span>
                <span className="text-[9px] font-black text-neutral-800 uppercase tracking-widest">Contact</span>
                <ArrowUpRight className="size-2.5 text-orange-500" />
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <span className="group relative bg-white flex items-center w-full shadow-md rounded-full border border-neutral-200 p-1 mb-3">
              <span className="flex flex-col flex-[1.2] pl-4 text-left">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-2.5 text-orange-400" />
                  <span className="text-[10px] font-bold text-neutral-900">Konum</span>
                </span>
              </span>
              <span className="h-6 w-px bg-neutral-200 mx-1" />
              <span className="flex flex-col flex-1 px-2 text-left">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-2.5 text-orange-400" />
                  <span className="text-[10px] font-bold text-neutral-900">Tarihler</span>
                </span>
              </span>
              <span className="h-6 w-px bg-neutral-200 mx-1" />
              <span className="flex flex-col flex-1 px-2 text-left">
                <span className="flex items-center gap-1.5">
                  <Users className="size-2.5 text-orange-400" />
                  <span className="text-[10px] font-bold text-neutral-900">Misafirler</span>
                </span>
              </span>
              <span className="flex items-center gap-1 ml-auto">
                <span className="hidden sm:flex size-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-400">
                  <SlidersHorizontal className="size-3.5" />
                </span>
                <span className="size-8 sm:size-10 bg-orange-600 rounded-full flex items-center justify-center text-white">
                  <Search className="size-4" strokeWidth={2} />
                </span>
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className="h-[130px] pointer-events-none md:hidden" aria-hidden />
    </>
  );
}
