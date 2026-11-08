import { Search, Heart, User, Home, Map } from "lucide-react";

const items = [
  { label: "Explore", Icon: Search, active: true },
  { label: "Villas", Icon: Home, active: false },
  { label: "Wishlist", Icon: Heart, active: false, dot: true },
  { label: "Kalkan", Icon: Map, active: false },
  { label: "Log In", Icon: User, active: false },
];

export default function RefMobileBottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 ref-pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        {items.map((item) => {
          const Icon = item.Icon;
          return (
            <span
              key={item.label}
              className="flex flex-col items-center justify-center gap-1 min-w-[64px]"
            >
              <span className={`relative ${item.active ? "text-orange-600" : "text-neutral-400"}`}>
                <Icon className={`size-6 ${item.active ? "scale-110" : ""}`} />
                {item.dot && (
                  <span className="absolute -top-1 -right-1 size-2 bg-orange-600 rounded-full border-2 border-white dark:border-neutral-950" />
                )}
              </span>
              <span
                className={`text-[10px] font-bold tracking-tight ${
                  item.active ? "text-neutral-900 dark:text-white" : "text-neutral-400"
                }`}
              >
                {item.label}
              </span>
            </span>
          );
        })}
      </div>
    </nav>
  );
}
