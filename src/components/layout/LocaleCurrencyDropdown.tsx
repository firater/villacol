"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

import type { Currency, Locale } from "@/lib/locales";

import { CurrencySwitcher } from "./CurrencySwitcher";
import { LanguageSwitcher } from "./LanguageSwitcher";

type Props = {
  locale: Locale;
  currency: Currency;
};

export function LocaleCurrencyDropdown({ locale, currency }: Props) {
  const tCommon = useTranslations("common");
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [open]);

  const triggerLabel = `${locale.toUpperCase()} / ${currency}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={toggleRef}
        type="button"
        className="inline-flex items-center gap-2.5 rounded-full border border-stone-200 bg-white px-4 py-2.5 font-sans text-sm tracking-wide text-neutral-800 hover:border-stone-300 hover:bg-stone-50/80"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <GlobeIcon className="size-4 text-neutral-500" />
        <span className="font-medium">{triggerLabel}</span>
        <ChevronIcon className="size-3.5 text-neutral-400" />
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute end-0 top-full z-50 mt-3 w-[min(90vw,17.5rem)] rounded-[2rem] border border-stone-200/90 bg-stone-50 p-6 shadow-2xl"
        >
          <section>
            <h3 className="font-serif text-2xl tracking-tight text-neutral-900">{tCommon("language")}</h3>
            <div className="mt-4">
              <LanguageSwitcher label={tCommon("language")} currentLocale={locale} variant="editorial" />
            </div>
          </section>
          <section className="mt-8 border-t border-stone-200/80 pt-8">
            <h3 className="font-serif text-2xl tracking-tight text-neutral-900">{tCommon("currency")}</h3>
            <div className="mt-4">
              <CurrencySwitcher label={tCommon("currency")} currentCurrency={currency} variant="editorial" />
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
