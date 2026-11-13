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
  cancellationEmpty?: string;
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
  const cancellationText =
    cancellationPolicy !== null && cancellationPolicy.trim() !== ""
      ? cancellationPolicy.trim()
      : null;

  if (guestPolicy === "everyone" && cancellationText === null) {
    return null;
  }

  const guestPolicyLabel = copy.guestPolicy[guestPolicy];

  return (
    <section aria-labelledby="rules-policies-heading" className="space-y-8">
      <header className="max-w-3xl">
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

      <div className="grid max-w-3xl gap-px border border-stone-300/90 bg-stone-300/90 dark:border-stone-700 dark:bg-stone-700 sm:grid-cols-2">
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
