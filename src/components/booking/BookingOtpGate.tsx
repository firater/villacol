"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";

import {
  requestBookingAccessCode,
  verifyBookingAccessCode,
} from "@/actions/public/booking-access.actions";
import { useRouter } from "@/i18n/navigation";

type Props = {
  accessToken: string;
};

export function BookingOtpGate({ accessToken }: Props) {
  const t = useTranslations("booking.status");
  const router = useRouter();
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [requesting, startRequest] = useTransition();
  const [verifying, startVerify] = useTransition();

  const sendCode = useCallback(() => {
    startRequest(async () => {
      setError(null);
      const out = await requestBookingAccessCode({ accessToken });
      if (!out.ok) {
        setError(out.error);
        return;
      }
      setMaskedEmail(out.data.maskedEmail);
      if (!out.data.throttled) {
        setError(null);
      }
    });
  }, [accessToken]);

  useEffect(() => {
    sendCode();
  }, [sendCode]);

  function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    startVerify(async () => {
      const out = await verifyBookingAccessCode({ accessToken, code });
      if (!out.ok) {
        setError(out.error);
        if (out.fieldErrors) setFieldErrors(out.fieldErrors);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("otpIntro")}</p>
      {maskedEmail ? (
        <p className="text-sm text-zinc-800 dark:text-zinc-200">
          {t("sentTo", { email: maskedEmail })}
        </p>
      ) : null}

      <form onSubmit={handleVerify} className="space-y-4">
        <label className="block">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {t("otpLabel")}
          </span>
          <input
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-3 text-center text-lg tracking-[0.4em] dark:border-zinc-700 dark:bg-zinc-950"
            autoComplete="one-time-code"
          />
          {fieldErrors.code?.[0] ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.code[0]}</p>
          ) : null}
        </label>

        {error !== null ? (
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={verifying || code.length !== 6}
          className="w-full rounded-full bg-zinc-900 py-2.5 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {verifying ? t("verifying") : t("verify")}
        </button>
      </form>

      <button
        type="button"
        onClick={sendCode}
        disabled={requesting}
        className="text-sm font-medium text-amber-800 underline dark:text-amber-200"
      >
        {requesting ? t("resending") : t("resend")}
      </button>
    </div>
  );
}
