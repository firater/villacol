"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import type { AppliedPromotionSnapshot } from "@/db/tables/caches";
import { VillaCard, type VillaCardProps } from "@/components/villa/VillaCard";
import {
  PROMO_OFFER_TAB_KEYS,
  type PromoOfferTabKey,
  villaMatchesPromoOfferTab,
} from "@/lib/promo-offer-tab-filter";

import { VillaCarousel } from "./VillaCarousel";

const TAB_I18N_KEY: Record<PromoOfferTabKey, string> = {
  all: "all",
  last_minute: "lastMinute",
  early_bird: "earlyBird",
  long_stay: "longStay",
  coupon: "coupon",
};

export type PromoOfferRailItem = {
  key: string;
  hasActiveDiscount: boolean;
  appliedPromotions: AppliedPromotionSnapshot[];
  card: VillaCardProps;
};

type Props = {
  items: PromoOfferRailItem[];
  carouselLabel: string;
  sectionEmptyLabel: string;
};

export function PromoOffersRail({ items, carouselLabel, sectionEmptyLabel }: Props) {
  const t = useTranslations("layout.home.promoTabs");
  const [activeTab, setActiveTab] = useState<PromoOfferTabKey>("all");

  const filtered = useMemo(
    () => items.filter((item) => villaMatchesPromoOfferTab(item, activeTab)),
    [activeTab, items],
  );

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-10 text-center text-sm text-zinc-600">
        {sectionEmptyLabel}
      </p>
    );
  }

  return (
    <>
      <nav
        aria-label={t("aria")}
        className="no-scrollbar mb-10 flex flex-wrap gap-2 overflow-x-auto pb-1"
      >
        {PROMO_OFFER_TAB_KEYS.map((tabKey) => {
          const isActive = tabKey === activeTab;
          return (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey)}
              className={`shrink-0 rounded-full border px-4 py-2 font-sans text-[11px] tracking-[0.12em] uppercase transition-colors ${
                isActive
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
              }`}
            >
              {t(TAB_I18N_KEY[tabKey])}
            </button>
          );
        })}
      </nav>

      <div key={activeTab} className="transition-opacity duration-300 ease-out">
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-6 py-12 text-center font-sans text-sm text-stone-600">
            {t("emptyTab")}
          </p>
        ) : (
          <VillaCarousel
            label={carouselLabel}
            density="promo"
            items={filtered.map((item, index) => ({
              key: item.key,
              node: (
                <VillaCard layout="promo" showVillaOfTheDay={index === 1} {...item.card} />
              ),
            }))}
          />
        )}
      </div>
    </>
  );
}
