"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { submitContactForm } from "@/actions/public/contact.actions";
import type { Locale } from "@/lib/locales";

const SUBJECT_KEYS = [
  "general",
  "booking",
  "longStay",
  "concierge",
  "other",
] as const;

type SubjectKey = (typeof SUBJECT_KEYS)[number];

export function ContactForm() {
  const t = useTranslations("contactPage.form");
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState<SubjectKey | "">("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const clientErrors: Record<string, string[]> = {};
    if (name.trim().length < 2) {
      clientErrors.name = [t("errors.name")];
    }
    if (!email.trim()) {
      clientErrors.email = [t("errors.email")];
    }
    if (!subject) {
      clientErrors.subject = [t("errors.subject")];
    }
    if (message.trim().length < 10) {
      clientErrors.message = [t("errors.message")];
    }
    if (phone.trim().length > 0 && phone.trim().length < 5) {
      clientErrors.phone = [t("errors.phone")];
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    const subjectLine = t(`subjects.${subject as SubjectKey}`);
    const body = message.trim();
    const composed = `${t("subjectLine", { subject: subjectLine })}\n\n${body}`;

    startTransition(async () => {
      const result = await submitContactForm({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim().length > 0 ? phone.trim() : undefined,
        message: composed,
        locale,
      });

      if (!result.ok) {
        setError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        return;
      }

      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white/80 px-8 py-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="font-serif text-2xl font-medium tracking-tight text-stone-900 dark:text-zinc-50">
          {t("successTitle")}
        </p>
        <p className="mt-4 text-[15px] font-light leading-relaxed text-stone-600 dark:text-zinc-400">
          {t("successBody")}
        </p>
      </div>
    );
  }

  const fieldClass =
    "mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
          {t("name")}
        </span>
        <input
          required
          minLength={2}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
        />
        {fieldErrors.name?.[0] ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>
        ) : null}
      </label>

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
          {t("email")}
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
        />
        {fieldErrors.email?.[0] ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.email[0]}</p>
        ) : null}
      </label>

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
          {t("phone")}
          <span className="ml-1 font-normal normal-case tracking-normal text-stone-400">
            ({t("optional")})
          </span>
        </span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={fieldClass}
        />
        {fieldErrors.phone?.[0] ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.phone[0]}</p>
        ) : null}
      </label>

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
          {t("subject")}
        </span>
        <select
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value as SubjectKey | "")}
          className={fieldClass}
        >
          <option value="">{t("subjectPlaceholder")}</option>
          {SUBJECT_KEYS.map((key) => (
            <option key={key} value={key}>
              {t(`subjects.${key}`)}
            </option>
          ))}
        </select>
        {fieldErrors.subject?.[0] ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.subject[0]}</p>
        ) : null}
      </label>

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
          {t("message")}
        </span>
        <textarea
          required
          minLength={10}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={fieldClass}
        />
        {fieldErrors.message?.[0] ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.message[0]}</p>
        ) : null}
      </label>

      {error !== null ? (
        <p className="text-sm text-red-700 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full border border-stone-900 bg-stone-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
