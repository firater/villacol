import { Link } from "@/i18n/navigation";

type Props = {
  email: string;
  role: string;
};

export function AdminHeader({ email, role }: Props) {
  return (
    <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <Link
            href="/admin/villas"
            className="font-serif text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Admin
          </Link>
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Dashboard
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <span className="hidden sm:inline" title={email}>
            {email}
          </span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {role}
          </span>
          <Link
            href="/"
            className="font-medium text-amber-800 hover:underline dark:text-amber-200"
          >
            View site
          </Link>
        </div>
      </div>
    </header>
  );
}
