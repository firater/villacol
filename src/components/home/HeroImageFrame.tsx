"use client";

import { useEffect, useState, type ReactNode } from "react";

const HERO_HEADER_ID = "home-hero-header";

type Props = {
  extraHeightPx: number;
  children: ReactNode;
  className?: string;
};

/** Desktop: frame height = `#home-hero-header` height + `extraHeightPx`. */
export function HeroImageFrame({ extraHeightPx, children, className }: Props) {
  const [frameHeightPx, setFrameHeightPx] = useState<number | null>(null);
  const [useMeasuredHeight, setUseMeasuredHeight] = useState(false);

  useEffect(() => {
    const header = document.getElementById(HERO_HEADER_ID);
    if (!header) return;

    const desktopMq = window.matchMedia("(min-width: 1024px)");

    const sync = () => {
      setUseMeasuredHeight(desktopMq.matches);
      if (!desktopMq.matches) {
        setFrameHeightPx(null);
        return;
      }
      setFrameHeightPx(header.offsetHeight + extraHeightPx);
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(header);
    desktopMq.addEventListener("change", sync);
    window.addEventListener("resize", sync);

    return () => {
      observer.disconnect();
      desktopMq.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, [extraHeightPx]);

  return (
    <div
      className={className}
      style={
        useMeasuredHeight && frameHeightPx !== null
          ? { height: frameHeightPx }
          : undefined
      }
    >
      {children}
    </div>
  );
}
