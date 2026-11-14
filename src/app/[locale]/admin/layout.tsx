import { connection } from "next/server";
import { redirect } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminLayoutFallback } from "@/components/admin/AdminLayoutFallback";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { routing } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth-guard";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locales";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AdminLayoutFallback />}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}

/**
 * Session and locale reads must stay inside Suspense so admin routes are not
 * blocked during partial prerender (Cache Components).
 */
async function AdminLayoutContent({ children }: { children: ReactNode }) {
  await connection();

  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    redirect(`/${DEFAULT_LOCALE}`);
  }
  const locale = localeRaw as Locale;

  const ctx = await getCurrentUser();
  if (
    ctx === null ||
    (ctx.user.role !== "admin" && ctx.user.role !== "editor")
  ) {
    redirect(`/${locale}`);
  }

  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col bg-zinc-50 dark:bg-zinc-950">
      <AdminHeader email={ctx.user.email} role={ctx.user.role} />
      <div className="flex flex-1">
        <AdminSidebar />
        <div className="min-w-0 flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}
