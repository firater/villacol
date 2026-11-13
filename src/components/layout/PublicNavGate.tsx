"use client";

import type { ReactNode } from "react";

import { usePathname } from "@/i18n/navigation";
import { isAdminPathname } from "@/lib/admin-route";

type Props = {
  children: ReactNode;
};

/** Hides public site chrome (announcement, main nav, footer) on `/admin` routes. */
export function PublicNavGate({ children }: Props) {
  const pathname = usePathname() ?? "";
  if (isAdminPathname(pathname)) {
    return null;
  }

  return children;
}
