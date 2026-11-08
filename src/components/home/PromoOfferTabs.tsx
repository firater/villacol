"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

const TAB_KEYS = ["all", "featured", "bestValue"] as const;

export function PromoOfferTabs() {
  const t = useTranslations("layout.home.promoTabs");

  return (
    <nav
      aria-label={t("aria")}
      className="no-scrollbar mb-12 flex gap-8 overflow-x-auto border-b border-stone-200/50 pb-1"
    >
      {TAB_KEYS.map((key, index) => (
        <Link
          key={key}
          href={TAB_HREFS[key]}
          className={`shrink-0 border-b-2 pb-3 font-sans text-xs tracking-[0.15em] uppercase ${
            index === 0
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          {t(key)}
        </Link>
      ))}
    </nav>
  );
}

const TAB_HREFS = {
  all: "/villa-offers" as const,
  featured: "/villas" as const,
  bestValue: "/villas" as const,
};
