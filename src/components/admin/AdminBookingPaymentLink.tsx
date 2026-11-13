"use client";

import { useState, useTransition } from "react";

import { createStripeCheckoutSession } from "@/actions/admin/stripe-checkout.actions";
import type { Locale } from "@/lib/locales";

type Props = {
  bookingId: string;
  locale: Locale;
};

export function AdminBookingPaymentLink({ bookingId, locale }: Props) {
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function generate() {
    setError(null);
    startTransition(async () => {
      const result = await createStripeCheckoutSession({ bookingId, locale });
      if (!result.ok) {
        setCheckoutUrl(null);
        setError(result.error);
        return;
      }
      setCheckoutUrl(result.data.checkoutUrl);
    });
  }

  async function copyUrl() {
    if (checkoutUrl === null) return;
    try {
      await navigator.clipboard.writeText(checkoutUrl);
    } catch {
      // Fallback: select field handles manual copy.
    }
  }

  return (
    <div className="mt-2 w-full min-w-[14rem] space-y-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
      <button
        type="button"
        disabled={pending}
        onClick={generate}
        className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-950/70"
      >
        {pending ? "Generating…" : "Generate Payment Link"}
      </button>

      {checkoutUrl !== null ? (
        <div className="space-y-1.5">
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Stripe Checkout URL
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              readOnly
              value={checkoutUrl}
              className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
              onFocus={(event) => event.currentTarget.select()}
            />
            <button
              type="button"
              onClick={copyUrl}
              className="shrink-0 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              Copy
            </button>
          </div>
        </div>
      ) : null}

      {error !== null ? (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
