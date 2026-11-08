"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { issueExitIntentCode } from "@/actions/public/exit-intent.actions";
import {
  formatCountdownHms,
} from "@/components/home/exit-intent-format";
import {
  getExitIntentCodeCookie,
  getExitIntentRemainingMs,
  persistExitIntentOffer,
} from "@/lib/exit-intent-cookies";

type Props = {
  open: boolean;
  onClose: () => void;
  onDismiss: () => void;
  onOfferPersisted: () => void;
};

export function ExitIntentModal({ open, onClose, onDismiss, onOfferPersisted }: Props) {
  const t = useTranslations("exitIntent");
  const [code, setCode] = useState<string | null>(null);
  const [offerName, setOfferName] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const syncCountdown = useCallback(() => {
    setRemainingMs(getExitIntentRemainingMs());
  }, []);

  useEffect(() => {
    if (!open) return;
    syncCountdown();
    const id = window.setInterval(syncCountdown, 1000);
    return () => window.clearInterval(id);
  }, [open, syncCountdown]);

  useEffect(() => {
    if (!open) return;

    const existing = getExitIntentCodeCookie();
    if (existing) {
      setCode(existing);
      syncCountdown();
    }

    let cancelled = false;
    setLoading(!existing);
    setError(null);

    void issueExitIntentCode().then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.ok) {
        if (!existing) setError(result.error);
        return;
      }
      if (result.data === null) {
        if (!existing) setError(t("unavailable"));
        return;
      }
      persistExitIntentOffer(result.data.code);
      setCode(result.data.code);
      setOfferName(result.data.offerName);
      onOfferPersisted();
      syncCountdown();
    });

    return () => {
      cancelled = true;
    };
  }, [open, onOfferPersisted, syncCountdown, t]);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDismiss]);

  async function handleCopy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-intent-title"
        className="w-full max-w-md overflow-hidden rounded-[2rem] border border-stone-200/70 bg-white shadow-xl"
      >
        <div className="px-10 pb-2 pt-10 text-center">
          <span
            className="mx-auto mb-6 flex size-12 items-center justify-center rounded-full border border-stone-200/80 bg-stone-50 text-stone-700"
            aria-hidden
          >
            <GiftIcon />
          </span>
          <h2
            id="exit-intent-title"
            className="font-serif text-4xl font-normal tracking-tight text-stone-900"
          >
            {t("heading")}
          </h2>
          {offerName ? (
            <p className="mt-3 font-sans text-sm tracking-wide text-stone-500">{offerName}</p>
          ) : null}
        </div>

        <div className="space-y-8 px-10 py-8">
          <p className="text-center font-sans text-sm leading-relaxed text-stone-500">{t("intro")}</p>

          {loading ? (
            <p className="text-center font-sans text-sm text-stone-500">{t("loading")}</p>
          ) : null}
          {error ? (
            <p className="text-center font-sans text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          {code ? (
            <>
              <div className="relative rounded-2xl border border-stone-200/90 bg-stone-50 py-4 pl-5 pr-[7.25rem]">
                <code className="block min-w-0 truncate font-mono text-[15px] tracking-wider text-stone-900">
                  {code}
                </code>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="absolute top-1/2 right-2 inline-flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-orange-600 px-5 py-2.5 font-sans text-[11px] font-bold tracking-widest text-white uppercase shadow-sm transition hover:bg-orange-700"
                >
                  <CopyIcon className="size-3.5" />
                  {copied ? t("copied") : t("copy")}
                </button>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="font-sans text-[11px] font-medium tracking-[0.22em] text-stone-400 uppercase">
                  {t("countdownLabel")}
                </span>
                <span className="font-mono text-lg font-semibold text-stone-900 tabular-nums tracking-tight">
                  {formatCountdownHms(remainingMs)}
                </span>
              </div>
              <p className="flex items-center justify-center gap-1.5 text-center font-sans text-[10px] font-semibold tracking-[0.18em] text-stone-400 uppercase">
                <LayersIcon className="size-3 shrink-0" aria-hidden />
                {t("stacksNote")}
              </p>
            </>
          ) : null}
        </div>

        <div className="flex justify-center px-10 pb-10 pt-2">
          <button
            type="button"
            onClick={onDismiss}
            className="mt-2 rounded-full border border-stone-200 bg-stone-50 px-6 py-2 font-sans text-sm text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
          >
            {t("dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="m12.83 2.18 8 3.96a1 1 0 0 1 0 1.8l-8 3.96a2 2 0 0 1-1.66 0l-8-3.96a1 1 0 0 1 0-1.8l8-3.96a2 2 0 0 1 1.66 0Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M3 10.5v4.2a1 1 0 0 0 .55.9l8 3.96a2 2 0 0 0 1.8 0l8-3.96a1 1 0 0 0 .55-.9v-4.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg className="size-7" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8M4 7h16v5H4V7zM12 21V7M12 7H8.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zm0 0h3.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
