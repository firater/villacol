import { Check, X } from "lucide-react";

import type { GuestPolicy } from "@/db/tables/enums";

type PolicyCopy = {
  eyebrow: string;
  heading: string;
  guestPolicyTitle: string;
  cancellationTitle: string;
  houseRulesTitle: string;
  guestPolicy: {
    everyone: string;
    couples_only: string;
    families_only: string;
    no_friend_groups: string;
  };
  houseRules: {
    petsAllowed: string;
    noPets: string;
    smokingAllowed: string;
    noSmoking: string;
    partiesAllowed: string;
    noParties: string;
  };
  cancellationEmpty?: string;
};

type HouseRules = {
  allowsPets: boolean;
  allowsSmoking: boolean;
  allowsParties: boolean;
};

type Props = {
  guestPolicy: GuestPolicy;
  cancellationPolicy: string | null;
  houseRules: HouseRules;
  copy: PolicyCopy;
};

function RuleRow({
  allowed,
  labelAllowed,
  labelDenied,
}: {
  allowed: boolean;
  labelAllowed: string;
  labelDenied: string;
}) {
  const label = allowed ? labelAllowed : labelDenied;
  const Icon = allowed ? Check : X;

  return (
    <li className="flex items-start gap-3 border-b border-stone-200/80 px-6 py-4 last:border-b-0 dark:border-stone-800">
      <span
        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${
          allowed
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
            : "bg-stone-200/90 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
        }`}
        aria-hidden
      >
        <Icon className="size-3.5" strokeWidth={2.25} />
      </span>
      <span className="font-sans text-sm leading-snug text-stone-800 dark:text-stone-200">
        {label}
      </span>
    </li>
  );
}

export function VillaStayPoliciesSection({
  guestPolicy,
  cancellationPolicy,
  houseRules,
  copy,
}: Props) {
  const cancellationText =
    cancellationPolicy !== null && cancellationPolicy.trim() !== ""
      ? cancellationPolicy.trim()
      : null;

  const guestPolicyLabel = copy.guestPolicy[guestPolicy];

  return (
    <section aria-labelledby="rules-policies-heading" className="space-y-8">
      <header className="w-full">
        <div aria-hidden className="mb-6 h-px w-full bg-stone-300/80" />
        <p className="mb-3 font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-stone-500">
          {copy.eyebrow}
        </p>
        <h2
          id="rules-policies-heading"
          className="font-serif text-[clamp(1.65rem,3vw,2.1rem)] font-semibold tracking-tight text-stone-900 dark:text-stone-50"
        >
          {copy.heading}
        </h2>
      </header>

      <div className="w-full border border-stone-300/90 bg-white dark:border-stone-700 dark:bg-stone-950">
        <h3 className="border-b border-stone-200 bg-stone-50/90 px-6 py-4 font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500 dark:border-stone-800 dark:bg-stone-950/90">
          {copy.houseRulesTitle}
        </h3>
        <ul>
          <RuleRow
            allowed={houseRules.allowsPets}
            labelAllowed={copy.houseRules.petsAllowed}
            labelDenied={copy.houseRules.noPets}
          />
          <RuleRow
            allowed={houseRules.allowsSmoking}
            labelAllowed={copy.houseRules.smokingAllowed}
            labelDenied={copy.houseRules.noSmoking}
          />
          <RuleRow
            allowed={houseRules.allowsParties}
            labelAllowed={copy.houseRules.partiesAllowed}
            labelDenied={copy.houseRules.noParties}
          />
        </ul>
      </div>

      <div className="grid w-full gap-px border border-stone-300/90 bg-stone-300/90 dark:border-stone-700 dark:bg-stone-700 sm:grid-cols-2">
          <article className="bg-stone-50/90 px-6 py-7 dark:bg-stone-950/90 sm:min-h-[11rem]">
            <h3 className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
              {copy.guestPolicyTitle}
            </h3>
            <p className="mt-4 font-serif text-xl leading-snug text-stone-900 dark:text-stone-100">
              {guestPolicyLabel}
            </p>
          </article>

          <article className="bg-white px-6 py-7 dark:bg-stone-950 sm:min-h-[11rem]">
            <h3 className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
              {copy.cancellationTitle}
            </h3>
            {cancellationText !== null ? (
              <p className="mt-4 font-sans text-sm leading-[1.85] text-stone-700 dark:text-stone-300">
                {cancellationText}
              </p>
            ) : (
              <p className="mt-4 font-sans text-sm italic text-stone-500 dark:text-stone-400">
                {copy.cancellationEmpty ?? "Contact us for cancellation terms."}
              </p>
            )}
          </article>
      </div>
    </section>
  );
}