"use client";

import { MoreHorizontal } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";

import {
  buildConciergeResultsQuery,
  type ConciergeBudgetId,
  CONCIERGE_BUDGET_IDS,
} from "@/lib/concierge-params";

export type ConciergeFacetOption = {
  slug: string;
  name: string;
};

type Props = {
  featuredLocations: ConciergeFacetOption[];
  allLocations: ConciergeFacetOption[];
  featuredCategories: ConciergeFacetOption[];
  allCategories: ConciergeFacetOption[];
};

const STEPS = ["where", "type", "duration", "guests", "budget"] as const;
type Step = (typeof STEPS)[number];

const NIGHTS_MIN = 1;
const NIGHTS_MAX = 30;
const GUESTS_MIN = 1;
const GUESTS_MAX = 24;

export function ConciergeWizard({
  featuredLocations,
  allLocations,
  featuredCategories,
  allCategories,
}: Props) {
  const t = useTranslations("concierge");
  const router = useRouter();

  const [step, setStep] = useState<Step>("where");
  const [locationSlug, setLocationSlug] = useState<string | null>(null);
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [nights, setNights] = useState(7);
  const [guests, setGuests] = useState(2);
  const [budget, setBudget] = useState<ConciergeBudgetId>("any");
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const stepIndex = STEPS.indexOf(step);

  const extraLocations = useMemo(() => {
    const featured = new Set(featuredLocations.map((row) => row.slug));
    return allLocations.filter((row) => !featured.has(row.slug));
  }, [allLocations, featuredLocations]);

  const extraCategories = useMemo(() => {
    const featured = new Set(featuredCategories.map((row) => row.slug));
    return allCategories.filter((row) => !featured.has(row.slug));
  }, [allCategories, featuredCategories]);

  function goNext() {
    const idx = stepIndex;
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]!);
  }

  function goBack() {
    const idx = stepIndex;
    if (idx > 0) setStep(STEPS[idx - 1]!);
  }

  function finish() {
    router.push({
      pathname: "/find-villa/results",
      query: buildConciergeResultsQuery({
        locationSlug,
        categorySlug,
        nights,
        guests,
        budget,
      }),
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <ConciergeProgress current={stepIndex} total={STEPS.length} />

      {step === "where" ? (
        <StepShell
          eyebrow={t("steps.where")}
          heading={t("where.heading")}
          hint={t("where.hint")}
        >
          <ChoiceGrid>
            <ChoiceTile
              selected={locationSlug === null}
              onSelect={() => setLocationSlug(null)}
              label={t("where.anywhere")}
            />
            {featuredLocations.map((row) => (
              <ChoiceTile
                key={row.slug}
                selected={locationSlug === row.slug}
                onSelect={() => setLocationSlug(row.slug)}
                label={row.name}
              />
            ))}
          </ChoiceGrid>
          {extraLocations.length > 0 ? (
            <ExpandToggle
              expanded={showAllLocations}
              onToggle={() => setShowAllLocations((open) => !open)}
              label={
                showAllLocations ? t("where.showLess") : t("where.viewAll")
              }
            />
          ) : null}
          {showAllLocations ? (
            <ChoiceGrid className="mt-4 border-t border-stone-200/80 pt-6 dark:border-stone-800">
              {extraLocations.map((row) => (
                <ChoiceTile
                  key={row.slug}
                  selected={locationSlug === row.slug}
                  onSelect={() => setLocationSlug(row.slug)}
                  label={row.name}
                />
              ))}
            </ChoiceGrid>
          ) : null}
        </StepShell>
      ) : null}

      {step === "type" ? (
        <StepShell
          eyebrow={t("steps.type")}
          heading={t("type.heading")}
          hint={t("type.hint")}
        >
          <ChoiceGrid>
            <ChoiceTile
              selected={categorySlug === null}
              onSelect={() => setCategorySlug(null)}
              label={t("type.any")}
            />
            {featuredCategories.map((row) => (
              <ChoiceTile
                key={row.slug}
                selected={categorySlug === row.slug}
                onSelect={() => setCategorySlug(row.slug)}
                label={row.name}
              />
            ))}
          </ChoiceGrid>
          {extraCategories.length > 0 ? (
            <ExpandToggle
              expanded={showAllCategories}
              onToggle={() => setShowAllCategories((open) => !open)}
              label={
                showAllCategories ? t("type.showLess") : t("type.viewAll")
              }
            />
          ) : null}
          {showAllCategories ? (
            <ChoiceGrid className="mt-4 border-t border-stone-200/80 pt-6 dark:border-stone-800">
              {extraCategories.map((row) => (
                <ChoiceTile
                  key={row.slug}
                  selected={categorySlug === row.slug}
                  onSelect={() => setCategorySlug(row.slug)}
                  label={row.name}
                />
              ))}
            </ChoiceGrid>
          ) : null}
        </StepShell>
      ) : null}

      {step === "duration" ? (
        <StepShell
          eyebrow={t("steps.duration")}
          heading={t("duration.heading")}
          hint={t("duration.hint")}
        >
          <Stepper
            value={nights}
            min={NIGHTS_MIN}
            max={NIGHTS_MAX}
            onChange={setNights}
            decrementAria={t("duration.decrease")}
            incrementAria={t("duration.increase")}
            unitLabel={t("duration.nights", { count: nights })}
          />
        </StepShell>
      ) : null}

      {step === "guests" ? (
        <StepShell
          eyebrow={t("steps.guests")}
          heading={t("guests.heading")}
          hint={t("guests.hint")}
        >
          <Stepper
            value={guests}
            min={GUESTS_MIN}
            max={GUESTS_MAX}
            onChange={setGuests}
            decrementAria={t("guests.decrease")}
            incrementAria={t("guests.increase")}
            unitLabel={t("guests.count", { count: guests })}
          />
        </StepShell>
      ) : null}

      {step === "budget" ? (
        <StepShell
          eyebrow={t("steps.budget")}
          heading={t("budget.heading")}
          hint={t("budget.hint")}
        >
          <ChoiceGrid>
            {CONCIERGE_BUDGET_IDS.map((id) => (
              <ChoiceTile
                key={id}
                selected={budget === id}
                onSelect={() => setBudget(id)}
                label={t(`budget.tiers.${id}`)}
                className="sm:col-span-1"
              />
            ))}
          </ChoiceGrid>
        </StepShell>
      ) : null}

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-stone-200/80 pt-8 dark:border-stone-800">
        {step !== "where" ? (
          <button
            type="button"
            onClick={goBack}
            className="text-sm font-medium text-stone-600 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          >
            {t("back")}
          </button>
        ) : (
          <span />
        )}

        {step === "budget" ? (
          <button
            type="button"
            onClick={finish}
            className="ml-auto rounded-full bg-stone-900 px-8 py-3.5 text-sm font-semibold tracking-wide text-white transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
          >
            {t("submit")}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="ml-auto rounded-full bg-stone-900 px-8 py-3 text-sm font-semibold tracking-wide text-white transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
          >
            {t("continue")}
          </button>
        )}
      </div>
    </div>
  );
}

function ConciergeProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const t = useTranslations("concierge");
  return (
    <div className="mb-10">
      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-stone-500">
        {t("progressLabel", { step: current + 1, total })}
      </p>
      <div className="mt-4 flex gap-1.5">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            aria-hidden
            className={`h-0.5 flex-1 rounded-full transition-colors ${
              index <= current ? "bg-stone-900 dark:bg-stone-100" : "bg-stone-200 dark:bg-stone-800"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function StepShell({
  eyebrow,
  heading,
  hint,
  children,
}: {
  eyebrow: string;
  heading: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-stone-500">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-serif text-[clamp(1.75rem,4vw,2.25rem)] font-semibold leading-snug tracking-tight text-stone-900 dark:text-stone-50">
          {heading}
        </h2>
        <p className="mt-3 max-w-lg text-[15px] font-light leading-relaxed text-stone-600 dark:text-stone-400">
          {hint}
        </p>
      </div>
      {children}
    </section>
  );
}

function ChoiceGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`grid gap-3 sm:grid-cols-2 ${className}`}>{children}</div>;
}

function ChoiceTile({
  label,
  selected,
  onSelect,
  className = "",
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-xl border px-4 py-4 text-left text-sm font-medium transition ${className} ${
        selected
          ? "border-stone-900 bg-stone-900 text-white shadow-sm dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
          : "border-stone-200/90 bg-white text-stone-800 hover:border-stone-300 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-100 dark:hover:border-stone-600"
      }`}
    >
      {label}
    </button>
  );
}

function ExpandToggle({
  expanded,
  onToggle,
  label,
}: {
  expanded: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
    >
      <MoreHorizontal className="size-4 shrink-0" aria-hidden />
      {label}
    </button>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
  decrementAria,
  incrementAria,
  unitLabel,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  decrementAria: string;
  incrementAria: string;
  unitLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-6 pt-4 sm:pt-6">
      <div className="flex w-full max-w-xs items-center justify-between gap-4">
        <RoundIconButton
          ariaLabel={decrementAria}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          −
        </RoundIconButton>
        <div className="min-w-[6rem] text-center">
          <p className="font-serif text-5xl font-semibold tabular-nums tracking-tight text-stone-900 dark:text-stone-50">
            {value}
          </p>
          <p className="mt-2 text-sm font-light text-stone-500">{unitLabel}</p>
        </div>
        <RoundIconButton
          ariaLabel={incrementAria}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </RoundIconButton>
      </div>
    </div>
  );
}

function RoundIconButton({
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="flex size-12 items-center justify-center rounded-full border border-stone-300 bg-white text-xl font-light text-stone-800 transition hover:border-stone-900 disabled:opacity-30 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 dark:hover:border-stone-300"
    >
      {children}
    </button>
  );
}