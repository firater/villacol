"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { findCuratedVillas } from "@/actions/public/concierge.actions";
import type { VillaCardProps } from "@/components/villa/VillaCard";

import { ConciergeResults } from "./ConciergeResults";

type GroupType = "couple" | "family" | "friends";
type Vibe = "secluded_luxury" | "close_to_town" | "beachfront";
type Budget = "up_to_200" | "nightly_200_500" | "above_500";

const STEPS = ["group", "vibe", "budget", "results"] as const;
type Step = (typeof STEPS)[number];

export function ConciergeWizard() {
  const t = useTranslations("concierge");
  const [step, setStep] = useState<Step>("group");
  const [groupType, setGroupType] = useState<GroupType | null>(null);
  const [vibe, setVibe] = useState<Vibe | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [results, setResults] = useState<VillaCardProps[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function goNext() {
    if (step === "group" && groupType) setStep("vibe");
    else if (step === "vibe" && vibe) setStep("budget");
  }

  function goBack() {
    if (step === "vibe") setStep("group");
    else if (step === "budget") setStep("vibe");
    else if (step === "results") setStep("budget");
  }

  function handleSubmit() {
    if (groupType === null || vibe === null || budget === null) return;

    setError(null);
    startTransition(async () => {
      const out = await findCuratedVillas({ groupType, vibe, budget });
      if (!out.ok) {
        setError(out.error);
        return;
      }
      setResults(out.data.villas);
      setStep("results");
    });
  }

  const stepIndex = STEPS.indexOf(step);

  return (
    <div
      className={`mx-auto w-full ${step === "results" ? "max-w-6xl" : "max-w-xl"}`}
    >
      <ol
        className="mb-8 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500"
        aria-label={t("progressLabel")}
      >
        {(["group", "vibe", "budget"] as const).map((key, index) => (
          <li key={key} className="flex items-center gap-2">
            <span
              className={
                stepIndex >= index
                  ? "text-amber-800 dark:text-amber-200"
                  : undefined
              }
            >
              {t(`steps.${key}`)}
            </span>
            {index < 2 ? <span aria-hidden>·</span> : null}
          </li>
        ))}
      </ol>

      {step === "group" ? (
        <fieldset className="space-y-3">
          <legend className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {t("group.heading")}
          </legend>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("group.hint")}
          </p>
          <OptionGrid
            options={[
              { value: "couple" as const, label: t("group.couple") },
              { value: "family" as const, label: t("group.family") },
              { value: "friends" as const, label: t("group.friends") },
            ]}
            value={groupType}
            onChange={setGroupType}
          />
        </fieldset>
      ) : null}

      {step === "vibe" ? (
        <fieldset className="space-y-3">
          <legend className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {t("vibe.heading")}
          </legend>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("vibe.hint")}
          </p>
          <OptionGrid
            options={[
              {
                value: "secluded_luxury" as const,
                label: t("vibe.secludedLuxury"),
              },
              { value: "close_to_town" as const, label: t("vibe.closeToTown") },
              { value: "beachfront" as const, label: t("vibe.beachfront") },
            ]}
            value={vibe}
            onChange={setVibe}
          />
        </fieldset>
      ) : null}

      {step === "budget" ? (
        <fieldset className="space-y-3">
          <legend className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {t("budget.heading")}
          </legend>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("budget.hint")}
          </p>
          <OptionGrid
            options={[
              { value: "up_to_200" as const, label: t("budget.upTo200") },
              { value: "nightly_200_500" as const, label: t("budget.mid") },
              { value: "above_500" as const, label: t("budget.above500") },
            ]}
            value={budget}
            onChange={setBudget}
          />
        </fieldset>
      ) : null}

      {step === "results" && results !== null ? (
        <ConciergeResults villas={results} onStartOver={() => {
          setStep("group");
          setResults(null);
        }} />
      ) : null}

      {error !== null ? (
        <p className="mt-4 text-sm text-red-700 dark:text-red-400">{error}</p>
      ) : null}

      {step !== "results" ? (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          {step !== "group" ? (
            <button
              type="button"
              onClick={goBack}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
            >
              {t("back")}
            </button>
          ) : (
            <span />
          )}

          {step === "budget" ? (
            <button
              type="button"
              disabled={budget === null || pending}
              onClick={handleSubmit}
              className="ml-auto rounded-full bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:from-amber-800 hover:to-yellow-700 disabled:opacity-50"
            >
              {pending ? t("finding") : t("submit")}
            </button>
          ) : (
            <button
              type="button"
              disabled={
                (step === "group" && groupType === null) ||
                (step === "vibe" && vibe === null)
              }
              onClick={goNext}
              className="ml-auto rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              {t("continue")}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function OptionGrid<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <div className="mt-4 grid gap-3">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-xl border px-4 py-4 text-left text-sm font-medium transition ${
              selected
                ? "border-amber-500 bg-amber-50/90 text-amber-950 shadow-sm dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100"
                : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
