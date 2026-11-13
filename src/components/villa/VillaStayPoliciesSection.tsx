import type { GuestPolicy } from "@/db/tables/enums";

type PolicyCopy = {
  eyebrow: string;
  heading: string;
  guestPolicyTitle: string;
  cancellationTitle: string;
  guestPolicy: {
    everyone: string;
    couples_only: string;
    families_only: string;
    no_friend_groups: string;
  };
};

type Props = {
  guestPolicy: GuestPolicy;
  cancellationPolicy: string | null;
  copy: PolicyCopy;
};

export function VillaStayPoliciesSection({
  guestPolicy,
  cancellationPolicy,
  copy,
}: Props) {
  const showGuestPolicy = guestPolicy !== "everyone";
  const showCancellation = cancellationPolicy !== null && cancellationPolicy.trim() !== "";

  if (!showGuestPolicy && !showCancellation) {
    return null;
  }

  const guestPolicyLabel = copy.guestPolicy[guestPolicy];

  return (
    <section aria-labelledby="stay-policies-heading" className="space-y-6">
      <div className="max-w-3xl">
        <div
          aria-hidden
          className="mb-6 h-px w-full bg-gradient-to-r from-stone-300/85 via-stone-300/40 to-transparent"
        />
        <p className="mb-3 font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-stone-400">
          {copy.eyebrow}
        </p>
        <h2
          id="stay-policies-heading"
          className="font-serif text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50"
        >
          {copy.heading}
        </h2>
      </div>

      <dl className="grid max-w-3xl gap-8 sm:grid-cols-2">
        {showGuestPolicy ? (
          <div className="space-y-2 border-l border-stone-300/80 pl-5 dark:border-stone-700">
            <dt className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">
              {copy.guestPolicyTitle}
            </dt>
            <dd className="font-serif text-lg text-stone-900 dark:text-stone-100">
              {guestPolicyLabel}
            </dd>
          </div>
        ) : null}

        {showCancellation ? (
          <div
            className={`space-y-2 border-l border-stone-300/80 pl-5 dark:border-stone-700 ${
              showGuestPolicy ? "" : "sm:col-span-2"
            }`}
          >
            <dt className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">
              {copy.cancellationTitle}
            </dt>
            <dd className="font-sans text-sm leading-[1.75] text-stone-700 dark:text-stone-300">
              {cancellationPolicy}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
