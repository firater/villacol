import { Waves, Sun, Shield, Car, SlidersHorizontal } from "lucide-react";

const quickRows = [
  { caption: "Infinity Pool", Icon: Waves, lit: true },
  { caption: "Sea View", Icon: Sun, lit: false },
  { caption: "Secluded", Icon: Shield, lit: false },
  { caption: "Walking Distance", Icon: Car, lit: false },
];

export default function RefExtraTags() {
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {quickRows.map((row) => {
            const Icon = row.Icon;
            return (
              <span
                key={row.caption}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium transition-all ${
                  row.lit
                    ? "bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-200"
                    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                <Icon className={`size-4 ${row.lit ? "text-white" : "text-orange-500"}`} />
                {row.caption}
              </span>
            );
          })}
        </div>
        <span className="relative flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-transparent rounded-full">
          <SlidersHorizontal className="size-4 text-neutral-600 dark:text-neutral-300" />
          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">More</span>
        </span>
      </div>
    </div>
  );
}
