"use client";

import { useEffect } from "react";

const HASH_SCROLL_RETRY_MS = 120;

/** Deep-links such as `/promotions#direct-booking` from the notification bell. */
export function PromotionsHashScroll() {
  useEffect(() => {
    function scrollToHash(): void {
      const raw = window.location.hash;
      if (raw.length <= 1) return;

      const id = decodeURIComponent(raw.slice(1));
      const target = document.getElementById(id);
      if (target === null) return;

      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    scrollToHash();
    const retry = window.setTimeout(scrollToHash, HASH_SCROLL_RETRY_MS);
    window.addEventListener("hashchange", scrollToHash);

    return () => {
      window.clearTimeout(retry);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);

  return null;
}
