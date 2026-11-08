"use client";

import { useTransition } from "react";

import { setCurrencyPreference } from "@/actions/public/preferences.actions";
import { CURRENCIES, type Currency } from "@/lib/locales";

type Props = {
  label: string;
  currentCurrency: Currency;
  variant?: "default" | "editorial";
};

export function CurrencySwitcher({ label, currentCurrency, variant = "default" }: Props) {
  const [pending, startTransition] = useTransition();

  function choose(next: Currency) {
    if (next === currentCurrency) return;
    startTransition(() => void setCurrencyPreference(next));
  }

  if (variant === "editorial") {
    return (
      <>
        <span className="sr-only">{label}</span>
        <ul className="space-y-3" role="list">
        {CURRENCIES.map((code) => {
          const active = code === currentCurrency;
          return (
            <li key={code}>
              <button
                type="button"
                disabled={pending}
                onClick={() => choose(code)}
                className={`flex w-full items-center gap-3 py-1 text-left text-base tracking-wide ${
                  active ? "font-medium text-orange-600" : "text-neutral-700 hover:text-orange-500"
                }`}
                aria-pressed={active}
                aria-label={`${label}: ${code}`}
              >
                <span
                  className={`size-1.5 shrink-0 rounded-full ${active ? "bg-orange-500" : "bg-transparent"}`}
                  aria-hidden
                />
                {code}
              </button>
            </li>
          );
        })}
        </ul>
      </>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="sr-only">{label}</span>
      <div className="flex rounded-md border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
        {CURRENCIES.map((code) => {
          const active = code === currentCurrency;
          return (
            <button
              key={code}
              type="button"
              disabled={pending}
              onClick={() => choose(code)}
              className={`rounded px-2 py-1 text-xs font-semibold tracking-wide transition-colors ${
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
              aria-pressed={active}
              aria-label={`${label}: ${code}`}
            >
              {code}
            </button>
          );
        })}
      </div>
    </div>
  );
}
