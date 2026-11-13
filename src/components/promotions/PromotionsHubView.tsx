import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getDiscountTiers } from "@/db/queries/discount-tiers.queries";
import {
  mergeDiscountTiers,
  PROMO_HUB_SECTIONS,
  commissionWaiverPercentLabel,
} from "@/lib/promotions-hub";
import { resolveCommissionRateBp } from "@/lib/commission";

import { PromotionsHashScroll } from "./PromotionsHashScroll";
import { PromotionsHubSection } from "./PromotionsHubSection";

export async function PromotionsHubView() {
  const t = await getTranslations("promotionsHub");
  const waiverPct = commissionWaiverPercentLabel(resolveCommissionRateBp());

  const sections = await Promise.all(
    PROMO_HUB_SECTIONS.map(async (section) => {
      const batches = await Promise.all(
        section.tierFilters.map((filter) => getDiscountTiers(filter)),
      );
      return {
        section,
        tiers: mergeDiscountTiers(batches),
      };
    }),
  );

  return (
    <>
      <PromotionsHashScroll />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <header className="max-w-3xl border-b border-stone-300 pb-10 dark:border-stone-700">
          <p className="font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-stone-500">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 font-serif text-[clamp(2.25rem,5vw,3.25rem)] font-semibold leading-[1.02] tracking-tight text-stone-900 dark:text-stone-50">
            {t("title")}
          </h1>
          <p className="mt-5 font-sans text-base leading-[1.75] text-stone-600 dark:text-stone-300">
            {t("subtitle", { waiverPercent: waiverPct })}
          </p>
          <Link
            href="/villa-offers"
            className="mt-8 inline-flex items-center justify-center border border-stone-900 bg-stone-900 px-7 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-white transition-colors hover:bg-stone-800 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
          >
            {t("allDiscountedCta")}
          </Link>
        </header>

        <nav
          aria-label={t("jumpNavAria")}
          className="mt-10 flex flex-wrap gap-2 border-b border-stone-200 pb-8 dark:border-stone-800"
        >
          {PROMO_HUB_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="border border-stone-300 px-3 py-1.5 font-sans text-xs font-medium uppercase tracking-[0.18em] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900 dark:border-stone-600 dark:text-stone-300 dark:hover:border-stone-300 dark:hover:text-stone-100"
            >
              {t(`sections.${section.id}.nav`)}
            </a>
          ))}
        </nav>

        <div className="mt-10 space-y-8">
          {sections.map(({ section, tiers }, index) => (
            <PromotionsHubSection
              key={section.id}
              section={section}
              tiers={tiers}
              index={index}
              waiverPercent={waiverPct}
            />
          ))}
        </div>
      </div>
    </>
  );
}
