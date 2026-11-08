"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { createBookingInquiry } from "@/actions/public/booking.actions";
import { Link, useRouter } from "@/i18n/navigation";
import { markExitIntentUsed } from "@/lib/exit-intent-cookies";
import type { QuoteDisplay } from "@/actions/public/quote.actions";

type Props = {
  villaId: number;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  quote: QuoteDisplay;
};

export function BookingInquiryForm({
  villaId,
  checkIn,
  checkOut,
  guestCount,
  quote,
}: Props) {
  const t = useTranslations("booking.checkout");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestNote, setGuestNote] = useState("");
  const [partySize, setPartySize] = useState(guestCount);
  const [acceptTerms, setAcceptTerms] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!acceptTerms) {
      setFieldErrors({ acceptTerms: [t("termsRequired")] });
      return;
    }

    startTransition(async () => {
      const result = await createBookingInquiry({
        villaId,
        checkIn,
        checkOut,
        guestCount: partySize,
        guestName,
        guestEmail,
        guestPhone,
        guestNote: guestNote.length > 0 ? guestNote : undefined,
        acceptTerms: true,
      });

      if (!result.ok) {
        setError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        return;
      }

      if (result.data.exitIntentRedeemed) {
        markExitIntentUsed();
      }

      router.push("/booking-success");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950/50">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">
          {t("estimatedTotal", { total: quote.grandTotal.formatted })}
        </p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          {t("datesLine", {
            checkIn,
            checkOut,
            nights: quote.nightCount,
          })}
        </p>
      </div>

      <label className="block">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {t("guestName")}
        </span>
        <input
          required
          minLength={2}
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        {fieldErrors.guestName?.[0] ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.guestName[0]}</p>
        ) : null}
      </label>

      <label className="block">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {t("guestEmail")}
        </span>
        <input
          type="email"
          required
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        {fieldErrors.guestEmail?.[0] ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.guestEmail[0]}</p>
        ) : null}
      </label>

      <label className="block">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {t("guestPhone")}
        </span>
        <input
          type="tel"
          required
          value={guestPhone}
          onChange={(e) => setGuestPhone(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {t("guestCount")}
        </span>
        <input
          type="number"
          min={1}
          max={100}
          required
          value={partySize}
          onChange={(e) => setPartySize(Number(e.target.value))}
          className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {t("guestNote")}
        </span>
        <textarea
          rows={3}
          maxLength={2000}
          value={guestNote}
          onChange={(e) => setGuestNote(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </label>

      <label className="flex items-start gap-2 text-sm text-zinc-800 dark:text-zinc-200">
        <input
          type="checkbox"
          required
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="mt-0.5 rounded border-zinc-300"
        />
        <span>
          {t("acceptTermsPrefix")}{" "}
          <Link
            href="/terms"
            className="font-medium text-amber-800 underline dark:text-amber-200"
          >
            {t("termsLink")}
          </Link>
        </span>
      </label>
      {fieldErrors.acceptTerms?.[0] ? (
        <p className="text-xs text-red-600">{fieldErrors.acceptTerms[0]}</p>
      ) : null}

      {error !== null ? (
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
      <p className="text-xs text-zinc-500 dark:text-zinc-500">{t("noPaymentYet")}</p>
    </form>
  );
}
