import { BadgePercent, Languages, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

const PILLAR_KEYS = ["price", "support", "curated"] as const;

const PILLAR_ICONS = {
  price: BadgePercent,
  support: Languages,
  curated: Sparkles,
} as const;

export async function WhyUsSection() {
  const [t, tDiscount] = await Promise.all([
    getTranslations("layout.home.whyUs"),
    getTranslations("layout.home.discountCta"),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <header className="pb-12 lg:pb-14">
        <p className="mb-5 font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-stone-400">
          {t("eyebrow")}
        </p>
        <div className="max-w-3xl">
          <h2
            id="home-advantages-title"
            className="font-serif text-[clamp(2.35rem,5.8vw,4rem)] font-normal leading-[0.95] tracking-[-0.02em] text-stone-900"
          >
            {t("title")}
          </h2>
          <p className="mt-5 font-serif text-[clamp(1.15rem,2.4vw,1.5rem)] font-normal italic leading-snug text-stone-700">
            {t("subtitle")}
          </p>
          <a
            href={tDiscount("whatsappUrl")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center bg-stone-900 px-7 py-3 font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-white transition-colors hover:bg-stone-800"
          >
            {t("chatCta")}
          </a>
        </div>
      </header>

      <ul className="grid grid-cols-1 lg:grid-cols-3 lg:gap-12">
        {PILLAR_KEYS.map((key, index) => {
          const Icon = PILLAR_ICONS[key];
          return (
            <li key={key} className="group flex flex-col gap-5 py-10 lg:py-0 lg:pr-2">
              <div className="flex items-center gap-4">
                <span className="font-sans text-[10px] font-semibold tabular-nums tracking-[0.28em] text-stone-400">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Icon
                  className="size-4 text-stone-400 transition-colors group-hover:text-stone-700"
                  strokeWidth={1.35}
                  aria-hidden
                />
              </div>
              <h3 className="font-serif text-[clamp(1.35rem,2.2vw,1.75rem)] leading-snug text-stone-900">
                {t(`pillars.${key}.title`)}
              </h3>
              <p className="max-w-sm font-sans text-sm leading-[1.75] text-stone-600 md:text-[15px]">
                {t(`pillars.${key}.body`)}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="mt-14 flex flex-col items-center gap-3 text-center lg:mt-16">
        <p className="font-serif text-[clamp(1.25rem,2.5vw,1.5rem)] font-normal text-stone-900">
          {t("trustPillTitle")}
        </p>
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.26em] text-stone-500">
          {t("trustPillSubtitle")}
        </p>
        <p className="mx-auto mt-4 max-w-xl font-sans text-sm leading-relaxed text-stone-600">
          {t("trustBadge")}
        </p>
      </div>
    </div>
  );
}
