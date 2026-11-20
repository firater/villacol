import Image from "next/image";
import { Bath, BedDouble, Users } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { BestValueImageSavingsPills } from "@/components/villa/BestValueImageSavingsPills";
import type { PromotionBadgeItem } from "@/lib/promo-badge-labels";

export type BestValueVillaCardProps = {
  slug: string;
  title: string;
  location: string | null;
  imageUrl: string;
  imageAlt: string;
  displayNightly: string;
  perNightLabel: string;
  openRangeLabel: string | null;
  stayTotalLine: string | null;
  priceWas: string | null;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  statLabels: {
    guests: string;
    bedrooms: string;
    bathrooms: string;
  };
  promotionBadges?: PromotionBadgeItem[];
};

function discountRows(badges?: PromotionBadgeItem[]) {
  if (!badges?.length) {
    return [];
  }
  return badges.filter(
    (badge) => badge.savingsFormatted !== null || badge.savingsAmountFormatted !== null,
  );
}

export function BestValueVillaCard({
  slug,
  title,
  location,
  imageUrl,
  imageAlt,
  displayNightly,
  perNightLabel,
  openRangeLabel,
  stayTotalLine,
  priceWas,
  capacity,
  bedrooms,
  bathrooms,
  statLabels,
  promotionBadges,
}: BestValueVillaCardProps) {
  const specsLine = `${capacity} ${statLabels.guests} · ${bedrooms} ${statLabels.bedrooms} · ${bathrooms} ${statLabels.bathrooms}`;
  const savings = discountRows(promotionBadges);
  const hasSavings = savings.length > 0;

  const valueAria = [
    displayNightly,
    perNightLabel,
    openRangeLabel,
    stayTotalLine,
    priceWas,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      href={{ pathname: "/villas/[slug]", params: { slug } }}
      className="group relative flex h-full flex-col overflow-hidden bg-white"
    >
      <div className="relative aspect-[3/2] w-full bg-stone-100">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 88vw, 24vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
        </div>
        {hasSavings ? (
          <div className="pointer-events-none absolute left-2 top-2 z-10 max-w-[calc(100%-1rem)] overflow-visible">
            <div className="pointer-events-auto">
              <BestValueImageSavingsPills badges={promotionBadges ?? []} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3.5">
        {location ? (
          <p className="mb-1 truncate font-sans text-[8px] font-medium uppercase tracking-[0.16em] text-stone-400">
            {location}
          </p>
        ) : null}

        <h3 className="line-clamp-2 min-h-[3rem] font-serif text-xl leading-snug text-stone-950">
          {title}
        </h3>

        <div
          className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] leading-snug text-stone-800"
          aria-label={specsLine}
        >
          <span className="inline-flex items-center gap-1">
            <Users className="size-3 shrink-0 text-stone-400" strokeWidth={1.75} aria-hidden />
            <span className="font-semibold tabular-nums">{capacity}</span>
          </span>
          <span className="text-stone-300" aria-hidden>
            ·
          </span>
          <span className="inline-flex items-center gap-1">
            <BedDouble className="size-3 shrink-0 text-stone-400" strokeWidth={1.75} aria-hidden />
            <span className="font-semibold tabular-nums">{bedrooms}</span>
          </span>
          <span className="text-stone-300" aria-hidden>
            ·
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="size-3 shrink-0 text-stone-400" strokeWidth={1.75} aria-hidden />
            <span className="font-semibold tabular-nums">{bathrooms}</span>
          </span>
        </div>

        <div className="mt-3 border border-stone-100/90 px-3 py-2.5">
          <p className="sr-only">{valueAria}</p>
          <p className="text-[11px] font-medium leading-snug tracking-[0.01em] text-stone-900">
            <span className="font-sans text-xs font-semibold tabular-nums text-stone-950">
              {displayNightly}
            </span>
            <span className="font-normal text-stone-600"> {perNightLabel}</span>
            {openRangeLabel ? (
              <>
                <span className="font-normal text-stone-300"> · </span>
                <span className="font-normal text-stone-700">{openRangeLabel}</span>
              </>
            ) : null}
          </p>
          {stayTotalLine || priceWas ? (
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {stayTotalLine ? (
                <p className="text-[10px] leading-snug text-stone-500">{stayTotalLine}</p>
              ) : null}
              {priceWas ? (
                <p className="text-[10px] leading-snug text-stone-400 line-through">{priceWas}</p>
              ) : null}
            </div>
          ) : null}
        </div>

      </div>
    </Link>
  );
}