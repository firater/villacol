import { getTranslations } from "next-intl/server";

import { HomeTrustPill } from "./HomeTrustPill";

const PILLAR_KEYS = ["price", "support", "curated"] as const;

export async function WhyUsSection() {
  const t = await getTranslations("layout.home.whyUs");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <header className="mb-12 text-center md:mb-14">
        <span className="mb-4 block font-sans text-xs tracking-[0.2em] text-stone-500 uppercase">
          {t("eyebrow")}
        </span>
        <h2
          id="home-advantages-title"
          className="font-serif text-4xl font-normal tracking-tight text-stone-900 md:text-5xl"
        >
          {t("title")}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl font-sans text-base leading-relaxed text-stone-600 md:text-lg">
          {t("subtitle")}
        </p>
      </header>
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {PILLAR_KEYS.map((key, index) => (
          <li
            key={key}
            className="flex flex-col gap-4 rounded-2xl bg-stone-50 p-8"
          >
            <span className="font-sans text-xs font-medium tracking-widest text-stone-400">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="font-serif text-2xl leading-none text-stone-300" aria-hidden>
              {PILLAR_MARKS[key]}
            </span>
            <h3 className="font-serif text-2xl text-stone-900">{t(`pillars.${key}.title`)}</h3>
            <p className="font-sans text-sm leading-relaxed text-stone-600 md:text-base">
              {t(`pillars.${key}.body`)}
            </p>
          </li>
        ))}
      </ul>
      <HomeTrustPill />
      <p className="mx-auto mt-12 max-w-3xl text-center font-sans text-sm leading-relaxed text-stone-600">
        {t("trustBadge")}
      </p>
    </div>
  );
}

const PILLAR_MARKS = {
  price: "€",
  support: "✦",
  curated: "◎",
} as const;
