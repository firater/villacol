"use client";

import type { ReactNode } from "react";

import { VILLA_PRICING_SIDEBAR_ID } from "./villa-detail-ids";
import { useVillaDetailScroll } from "./VillaDetailScrollContext";

type Props = {
  children: ReactNode;
};

export function VillaDetailSidebarColumn({ children }: Props) {
  const { sidebarSticky, registerSidebarColumn } = useVillaDetailScroll();

  return (
    <div
      ref={registerSidebarColumn}
      id={VILLA_PRICING_SIDEBAR_ID}
      className="min-h-[32rem] scroll-mt-28 lg:min-h-0"
    >
      <div className={sidebarSticky ? "lg:sticky lg:top-24" : undefined}>
        {children}
      </div>
    </div>
  );
}