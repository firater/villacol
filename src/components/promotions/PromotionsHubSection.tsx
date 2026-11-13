import { getTranslations } from "next-intl/server";

import type { DiscountTier } from "@/db/queries/discount-tiers.queries";
import { Link } from "@/i18n/navigation";
import {
  buildPromoListingHref,
  type PromoHubSectionConfig,
} from "@/lib/promotions-hub";

import { PromotionsHubTierPills } from "./PromotionsHubTierPills";

type Props = {
  section: PromoHubSectionConfig;
  tiers: DiscountTier[];
  index: number;
  waiverPercent: string;
};

export async function PromotionsHubSection({
  section,
  tiers,
  index,
  waiverPercent,
}: Props) {
  const t = await getTranslations("promotionsHub");

  const title = t(`sections.${section.id}.title`);
  const body =
    section.id === "direct-booking"
      ? t(`sections.${section.id}.body`, { waiverPercent })
      : t(`sections.${section.id}.body`);
  const cta = t(`sections.${section.id}.cta`);
  const villasCountLabel = (count: number) =>
    t("villasCount", { count });

  return (
    <section
      id={section.id}
      aria-labelledby={`${section.id}-title`}
      className="scroll-mt-28 border border-stone-300/90 bg-white dark:border-stone-700 dark:bg-stone-950/40"
    >
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="border-b border-stone-200 px-6 py-8 dark:border-stone-800 sm:px-8 sm:py-10 lg:border-b-0 lg:border-r">
          <p className="font-sans text-[10px] font-semibold tabular-nums tracking-[0.32em] text-stone-400">
            {String(index + 1).padStart(2, "0")}
          </p>
          <h2
            id={`${section.id}-title`}
            className="mt-4 font-serif text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-tight text-stone-900 dark:text-stone-50"
          >
            {title}
          </h2>
          <p className="mt-4 max-w-md font-sans text-sm leading-[1.8] text-stone-600 dark:text-stone-300">
            {body}
          </p>
          <Link
            href={buildPromoListingHref(section.promoSlug)}
            className="mt-8 inline-flex items-center justify-center border border-stone-900 bg-stone-900 px-6 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-white transition-colors hover:bg-stone-800 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
          >
            {cta}
          </Link>
        </div>

        <div className="bg-stone-50/80 px-6 py-8 dark:bg-stone-900/30 sm:px-8 sm:py-10">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
            {t("tiersHeading")}
          </p>
          <div className="mt-4">
            <PromotionsHubTierPills
              promoSlug={section.promoSlug}
              tiers={tiers}
              villasCountLabel={villasCountLabel}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
