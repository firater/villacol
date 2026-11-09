"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const ISTANBUL_TZ = "Europe/Istanbul";

function getHoursMinutesUntilIstanbulMidnight(now = new Date()): { hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ISTANBUL_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const second = Number(parts.find((part) => part.type === "second")?.value ?? 0);

  const secondsLeft = 24 * 3600 - (hour * 3600 + minute * 60 + second);
  const clamped = Math.max(0, secondsLeft);

  return {
    hours: Math.floor(clamped / 3600),
    minutes: Math.floor((clamped % 3600) / 60),
  };
}

/** Top-of-image pill for promo villa cards (index === 1). UI-only parity with category rail. */
export function VillaPromoOfTheDayBadge() {
  const t = useTranslations("layout.home");
  const [timeLeft, setTimeLeft] = useState(() => getHoursMinutesUntilIstanbulMidnight());

  useEffect(() => {
    const sync = () => setTimeLeft(getHoursMinutesUntilIstanbulMidnight());
    sync();
    const intervalId = window.setInterval(sync, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <span className="absolute top-3 left-3 z-20 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-white/25 bg-brand/88 px-2.5 py-1 text-white shadow-sm backdrop-blur-md">
      <span className="font-serif text-[12px] leading-tight tracking-tight sm:text-[13px]">
        {t("categoriesOfTheDay")}
      </span>
      <span className="h-3 w-px shrink-0 bg-white/35" aria-hidden />
      <span className="shrink-0 font-sans text-[10px] font-medium tabular-nums tracking-normal text-white/95">
        {t("categoriesDayEndsTr", { hours: timeLeft.hours, minutes: timeLeft.minutes })}
      </span>
    </span>
  );
}
