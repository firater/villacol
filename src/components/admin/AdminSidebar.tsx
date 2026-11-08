import { Link } from "@/i18n/navigation";

const nav = [
  { href: "/admin" as const, label: "Dashboard" },
  { href: "/admin/villas" as const, label: "Villas" },
  { href: "/admin/promotions" as const, label: "Promotions" },
  { href: "/admin/deals" as const, label: "Deals" },
  { href: "/admin/messages" as const, label: "Messages" },
];

export function AdminSidebar() {
  return (
    <aside className="w-52 shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <nav className="flex flex-col gap-0.5 p-3" aria-label="Admin">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
