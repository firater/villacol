"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useCalendarSelection } from "./calendar/CalendarContext";
import {
  VILLA_AVAILABILITY_SECTION_ID,
  VILLA_PRICING_SIDEBAR_ID,
} from "./villa-detail-ids";

export type SidebarAnchor = {
  right: number;
  width: number;
};

type VillaDetailScrollContextValue = {
  sidebarSticky: boolean;
  showFloatingWidget: boolean;
  anchor: SidebarAnchor | null;
  registerSidebarColumn: (node: HTMLDivElement | null) => void;
  scrollToPricingSidebar: () => void;
};

const VillaDetailScrollContext =
  createContext<VillaDetailScrollContextValue | null>(null);

const LG_MIN_WIDTH = 1024;
const STICKY_TOP_PX = 96;

export function VillaDetailScrollProvider({ children }: { children: ReactNode }) {
  const { checkIn, checkOut } = useCalendarSelection();
  const hasCompleteStay = checkIn !== null && checkOut !== null;

  const [availabilityReached, setAvailabilityReached] = useState(false);
  const [isLg, setIsLg] = useState(false);
  const [sidebarColumn, setSidebarColumn] = useState<HTMLDivElement | null>(
    null,
  );
  const [anchor, setAnchor] = useState<SidebarAnchor | null>(null);

  const registerSidebarColumn = useCallback((node: HTMLDivElement | null) => {
    setSidebarColumn(node);
  }, []);

  const updateAnchor = useCallback(() => {
    if (sidebarColumn === null) {
      setAnchor(null);
      return;
    }
    const rect = sidebarColumn.getBoundingClientRect();
    setAnchor({
      right: Math.max(0, window.innerWidth - rect.right),
      width: rect.width,
    });
  }, [sidebarColumn]);

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${LG_MIN_WIDTH}px)`);
    const syncLg = () => setIsLg(media.matches);
    syncLg();
    media.addEventListener("change", syncLg);
    return () => media.removeEventListener("change", syncLg);
  }, []);

  useEffect(() => {
    const target = document.getElementById(VILLA_AVAILABILITY_SECTION_ID);
    if (target === null) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry === undefined) return;
        setAvailabilityReached(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.08,
        rootMargin: `-${STICKY_TOP_PX}px 0px -35% 0px`,
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (sidebarColumn === null) return;

    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, { passive: true });
    const resizeObserver = new ResizeObserver(updateAnchor);
    resizeObserver.observe(sidebarColumn);

    return () => {
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor);
      resizeObserver.disconnect();
    };
  }, [sidebarColumn, updateAnchor]);

  const sidebarSticky = isLg && !hasCompleteStay && !availabilityReached;
  const showFloatingWidget = isLg && availabilityReached;

  const scrollToPricingSidebar = useCallback(() => {
    const node = document.getElementById(VILLA_PRICING_SIDEBAR_ID);
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const value = useMemo(
    () => ({
      sidebarSticky,
      showFloatingWidget,
      anchor,
      registerSidebarColumn,
      scrollToPricingSidebar,
    }),
    [
      sidebarSticky,
      showFloatingWidget,
      anchor,
      registerSidebarColumn,
      scrollToPricingSidebar,
    ],
  );

  return (
    <VillaDetailScrollContext.Provider value={value}>
      {children}
    </VillaDetailScrollContext.Provider>
  );
}

export function useVillaDetailScroll(): VillaDetailScrollContextValue {
  const value = useContext(VillaDetailScrollContext);
  if (value === null) {
    throw new Error(
      "useVillaDetailScroll must be used within VillaDetailScrollProvider",
    );
  }
  return value;
}