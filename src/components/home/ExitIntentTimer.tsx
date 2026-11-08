"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { formatCountdownHms } from "@/components/home/exit-intent-format";
import {
  clearExpiredExitIntentOffer,
  getExitIntentRemainingMs,
  isExitIntentOfferActive,
} from "@/lib/exit-intent-cookies";

type Props = {
  onOpenModal: () => void;
  refreshKey: number;
};

export function ExitIntentTimer({ onOpenModal, refreshKey }: Props) {
  const t = useTranslations("exitIntent");
  const [visible, setVisible] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    const tick = () => {
      clearExpiredExitIntentOffer();
      const active = isExitIntentOfferActive();
      const ms = getExitIntentRemainingMs();
      setVisible(active && ms > 0);
      setRemainingMs(ms);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [refreshKey]);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onOpenModal}
      className="fixed bottom-5 left-4 z-[90] flex items-center gap-3 rounded-sm border border-stone-200 bg-white px-4 py-3 transition hover:border-orange-200/80 sm:left-6"
      aria-label={t("timerAria")}
    >
      <ArrowDownLeftIcon className="size-4 shrink-0 text-orange-600" />
      <span className="flex flex-col items-start gap-1 text-left leading-none">
        <span className="font-sans text-[10px] font-medium tracking-[0.2em] text-stone-500 uppercase">
          {t("timerLabel")}
        </span>
        <span className="font-serif text-base font-normal text-stone-900 tabular-nums tracking-tight">
          {formatCountdownHms(remainingMs)}
        </span>
      </span>
    </button>
  );
}

function ArrowDownLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M19 5 5 19M5 19h8M5 19V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
