import { MoveRight, Star } from "lucide-react";

export default function RefTrustPill() {
  return (
    <div className="flex justify-center pt-2 pb-12">
      <div className="inline-flex items-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-1.5 pr-4 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
        <div className="flex items-center justify-center size-8 md:size-9 bg-neutral-50 dark:bg-neutral-800 rounded-full">
          <div className="relative">
            <Star size={16} fill="#fbbf24" className="text-amber-400" />
            <div className="absolute inset-0 bg-amber-400 blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className="text-sm md:text-base font-black text-neutral-900 dark:text-white leading-none">4.9/5</span>
            <div className="flex -space-x-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={10} fill="currentColor" className="text-amber-400" />
              ))}
            </div>
          </div>
          <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-neutral-400 leading-none mt-1">
            Google & Trustpilot <span className="text-green-500">Doğrulanmış</span>
          </p>
        </div>
        <div className="ml-2 pl-3 border-l border-neutral-100 dark:border-neutral-800">
          <div className="-rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
            <MoveRight className="w-3 text-amber-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
