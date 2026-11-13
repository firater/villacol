"use client";

import type { ReactNode } from "react";

import { usePathname } from "@/i18n/navigation";

type Props = {
  children: ReactNode;
};

/** Hides public site chrome (announcement, main nav, footer) on `/admin` routes. */
export function PublicNavGate({ children }: Props) {
  const pathname = usePathname();
  const isAdminRoute =
    pathname === "/admin" || (pathname?.startsWith("/admin/") ?? false);

  if (isAdminRoute) {
    return null;
  }

  return children;
}
