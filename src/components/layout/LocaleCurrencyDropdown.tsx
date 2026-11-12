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
        className="inline-flex items-center gap-2 bg-white px-4 py-2.5 font-serif text-sm tracking-wide text-neutral-950 transition-colors hover:bg-stone-50/80 hover:text-stone-950"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{triggerLabel}</span>
        <ChevronIcon className="size-3.5 text-neutral-700" />
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={`${tCommon("language")} / ${tCommon("currency")}`}
          className="absolute end-0 top-full z-50 mt-3 w-[min(90vw,16.5rem)] rounded-[2rem] border border-stone-200/90 bg-white p-6 shadow-2xl sm:p-7"
        >
          <div>
            <p className="font-sans text-[10px] font-medium uppercase tracking-[0.26em] text-stone-400">
              {locale.toUpperCase()} · {currency}
            </p>

            <section className="mt-4">
              <PremiumSectionLabel title={tCommon("language")} />
              <div className="mt-2.5 [&_button]:gap-0 [&_button]:py-1.5 [&_button]:text-base [&_button_span[aria-hidden]]:hidden [&_ul]:space-y-0.5">
                <LanguageSwitcher
                  label={tCommon("language")}
                  currentLocale={locale}
                  variant="magazine"
                />
              </div>
            </section>

            <section className="mt-5">
              <PremiumSectionLabel title={tCommon("currency")} />
              <div className="mt-2.5 [&_button]:gap-0 [&_button]:py-1.5 [&_button]:text-base [&_button_span[aria-hidden]]:hidden [&_ul]:space-y-0.5">
                <CurrencySwitcher
                  label={tCommon("currency")}
                  currentCurrency={currency}
                  variant="magazine"
                />
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PremiumSectionLabel({ title }: { title: string }) {
  return (
    <h3 className="font-serif text-xl font-normal tracking-[-0.02em] text-stone-900">{title}</h3>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
