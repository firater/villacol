import Image from "next/image";
import { Bath, BedDouble, Gem, Star, Users, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { VillaPromoOfTheDayBadge } from "@/components/villa/VillaPromoOfTheDayBadge";
import type { PromotionBadgeItem } from "@/lib/promo-badge-labels";
import { PromoPromotionPills } from "@/components/villa/PromoPromotionPills";

export type VillaCardLayout = "default" | "promo" | "recommended";

export type VillaCardProps = {
  slug: string;
  title: string;
  location: string | null;
  imageUrl: string;
  imageAlt: string;
  stayLabel: string | null;
  availabilityLabel: string | null;
  promotionLabels: string[];
  promotionBadges?: PromotionBadgeItem[];
  priceMain: string;
  nightlyPrice: string | null;
  priceStartingAtLabel: string;
  perNightLabel: string;
  firstAvailabilityTitle: string;
  priceWas: string | null;
  showOfferBadge: boolean;
  offerBadgeLabel: string;
  showEditorsChoiceBadge?: boolean;
  editorsChoiceLabel?: string;
  bedrooms: number;
  bathrooms: number;
  capacity: number;
  layout?: VillaCardLayout;
  viewLabel?: string;
  /** Shown under the title on promo layout only (promotions rail). */
  promoStatLabels?: {
    guests: string;
    bedrooms: string;
    bathrooms: string;
  };
  /** Promo layout: user vs editor rating copy (UI-only until review data exists). */
  promoRatingLabels?: {
    noUserReviews: string;
    noUserReviewsAria: string;
    editorScoreLabel: string;
  };
  /** Promo list card: show “category of the day” pill on the image (e.g. rail index === 1). */
  showVillaOfTheDay?: boolean;
};

const DEFAULT_PROMO_RATING_LABELS = {
  noUserReviews: "No reviews yet",
  noUserReviewsAria: "No user reviews yet",
  editorScoreLabel: "Editor score",
} as const;

export function VillaCard({
  slug,
  title,
  location,
  imageUrl,
  imageAlt,
  stayLabel,
  availabilityLabel,
  promotionLabels,
  promotionBadges,
  priceMain,
  nightlyPrice,
  priceStartingAtLabel,
  perNightLabel,
  firstAvailabilityTitle,
  priceWas,
  showOfferBadge,
  offerBadgeLabel,
  showEditorsChoiceBadge = false,
  editorsChoiceLabel,
  bedrooms,
  bathrooms,
  capacity,
  layout = "default",
  viewLabel = "View",
  promoStatLabels,
  promoRatingLabels,
  showVillaOfTheDay = false,
}: VillaCardProps) {
  const badgeLabel =
    promotionLabels[0] ??
    (showEditorsChoiceBadge && editorsChoiceLabel
      ? editorsChoiceLabel
      : showOfferBadge
        ? offerBadgeLabel
        : null);

  const displayNightly = nightlyPrice ?? priceMain;

  if (layout === "promo") {
    const imagePromotionLabels =
      promotionLabels.length > 0
        ? promotionLabels
        : badgeLabel
          ? [badgeLabel]
          : [];

    const promoBadgeItems: PromotionBadgeItem[] =
      promotionBadges && promotionBadges.length > 0
        ? promotionBadges
        : imagePromotionLabels.map((name) => ({
            name,
            discountType: "percentage" as const,
            savingsFormatted: null,
            savingsAmountFormatted: null,
            percentageLabel: null,
          }));

    const promoLocation = location ?? "Kalkan";

    return (
      <Link
        href={{ pathname: "/villas/[slug]", params: { slug } }}
        className="group relative flex flex-col overflow-hidden border border-stone-200/70 bg-white transition-colors md:flex-row md:items-stretch md:hover:border-stone-300"
      >
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-neutral-100 md:aspect-auto md:w-[45%] md:max-w-[48%] md:min-h-0 md:self-stretch">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 45vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
          {showVillaOfTheDay ? <VillaPromoOfTheDayBadge /> : null}
          {availabilityLabel ? (
            <div
              className={`absolute left-3 z-20 ${showVillaOfTheDay ? "top-[3.35rem]" : "top-3"}`}
            >
              <div className="flex max-w-[min(100%,14rem)] items-center gap-2 border border-stone-200/60 bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-sm">
                <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                <span className="flex min-w-0 flex-col leading-none">
                  <span className="text-[9px] font-medium uppercase tracking-tighter text-stone-500">
                    {firstAvailabilityTitle}
                  </span>
                  <span className="truncate text-[11px] font-medium text-stone-900">
                    {availabilityLabel}
                  </span>
                </span>
              </div>
            </div>
          ) : null}
        </div>
        <PromoCardBody
          title={title}
          location={promoLocation}
          capacity={capacity}
          bedrooms={bedrooms}
          bathrooms={bathrooms}
          promotionBadges={promoBadgeItems}
          promoStatLabels={promoStatLabels}
          promoRatingLabels={promoRatingLabels ?? DEFAULT_PROMO_RATING_LABELS}
          priceStartingAtLabel={priceStartingAtLabel}
          displayNightly={displayNightly}
          perNightLabel={perNightLabel}
          priceWas={priceWas}
          priceMain={priceMain}
          stayLabel={stayLabel}
        />
      </Link>
    );
  }

  if (layout === "recommended") {
    return (
      <Link
        href={{ pathname: "/villas/[slug]", params: { slug } }}
        className="group relative flex h-full flex-col overflow-hidden border border-stone-200/70 bg-white transition-colors hover:border-stone-300"
      >
        <div
          className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100"
          style={{ aspectRatio: "4 / 3" }}
        >
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
          {badgeLabel ? <PromoBadge text={badgeLabel} square /> : null}
        </div>
        <RecommendedCardBody
          title={title}
          location={location}
          capacity={capacity}
          bedrooms={bedrooms}
          stayLabel={stayLabel}
          viewLabel={viewLabel}
          displayNightly={displayNightly}
          perNightLabel={perNightLabel}
        />
      </Link>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200/60 bg-white hover:border-stone-300">
      <Link
        href={{ pathname: "/villas/[slug]", params: { slug } }}
        className="relative block"
      >
        <div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-t-3xl bg-neutral-100"
          style={{ aspectRatio: "4 / 3" }}
        >
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
          />
          {badgeLabel ? <PromoBadge text={badgeLabel} className="left-6 top-6" /> : null}
        </div>
      </Link>
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <h3 className="min-h-[3rem] text-base font-black leading-snug text-neutral-900">
          <Link href={{ pathname: "/villas/[slug]", params: { slug } }} className="line-clamp-2">
            {title}
          </Link>
        </h3>
        <p className="mt-1 min-h-5 truncate text-sm text-neutral-500">{location ?? "\u00A0"}</p>
        <StatsRow capacity={capacity} bedrooms={bedrooms} bathrooms={bathrooms} />
        <div className="mt-4 min-h-[8rem] border-t border-neutral-100 pt-3">
          <p className="min-h-4 text-xs text-neutral-500">{availabilityLabel ?? "\u00A0"}</p>
          <p className="mt-1 min-h-5 text-sm text-neutral-400 line-through" aria-hidden={priceWas === null}>
            {priceWas ?? "\u00A0"}
          </p>
          <p className="text-lg font-semibold text-stone-900">{priceMain}</p>
          <p className="min-h-4 text-xs text-neutral-500">{stayLabel ?? "\u00A0"}</p>
        </div>
      </div>
    </article>
  );
}

function PromoBadge({
  text,
  className = "left-3 top-3",
  square = false,
}: {
  text: string;
  className?: string;
  square?: boolean;
}) {
  return (
    <span
      className={`absolute z-20 bg-orange-600 px-3 py-1.5 text-[9px] font-medium uppercase tracking-widest text-white ${
        square ? "" : "rounded-full"
      } ${className}`}
    >
      {text}
    </span>
  );
}

function StatsRow({
  capacity,
  bedrooms,
  bathrooms,
  promoStatLabels,
  seamless = false,
}: Pick<VillaCardProps, "capacity" | "bedrooms" | "bathrooms" | "promoStatLabels"> & {
  seamless?: boolean;
}) {
  const rowClass = seamless
    ? "flex items-center gap-4 py-1"
    : "flex items-center gap-4 border-b border-neutral-100 py-1.5";

  if (promoStatLabels) {
    return (
      <div className={rowClass}>
        <PromoStatIconItem
          icon={Users}
          value={capacity}
          ariaLabel={`${capacity} ${promoStatLabels.guests}`}
        />
        <PromoStatIconItem
          icon={BedDouble}
          value={bedrooms}
          ariaLabel={`${bedrooms} ${promoStatLabels.bedrooms}`}
        />
        <PromoStatIconItem
          icon={Bath}
          value={bathrooms}
          ariaLabel={`${bathrooms} ${promoStatLabels.bathrooms}`}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5 border-b border-neutral-100 py-2 text-sm font-medium text-neutral-600">
      <span>{capacity}</span>
      <span>{bedrooms}</span>
      <span>{bathrooms}</span>
    </div>
  );
}

/** UI-only: distinguishes empty user reviews from hardcoded editor score. */
function PromoRatingsBlock({
  labels,
}: {
  labels: NonNullable<VillaCardProps["promoRatingLabels"]>;
}) {
  return (
    <div className="flex flex-col items-end gap-0.5 leading-none">
      <div className="inline-flex items-center gap-1" aria-label={labels.noUserReviewsAria}>
        <Star className="size-3 shrink-0 text-stone-300" strokeWidth={1.75} aria-hidden />
        <span className="text-[10px] font-normal text-stone-400">{labels.noUserReviews}</span>
      </div>
      <div className="inline-flex flex-wrap items-center justify-end gap-x-1 gap-y-0.5">
        <Gem className="size-3 shrink-0 fill-amber-400/90 text-amber-500" strokeWidth={1.75} aria-hidden />
        <span className="font-sans text-[10px] font-bold tracking-tight text-stone-900">
          8.5<span className="font-semibold text-stone-600">/10</span>
        </span>
        <span className="text-[8px] font-medium uppercase tracking-widest text-stone-500">
          {labels.editorScoreLabel}
        </span>
      </div>
    </div>
  );
}

function PromoStatIconItem({
  icon: Icon,
  value,
  ariaLabel,
}: {
  icon: LucideIcon;
  value: number;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center gap-1" aria-label={ariaLabel}>
      <Icon className="size-3.5 shrink-0 text-stone-400" strokeWidth={1.75} aria-hidden />
      <span className="text-[11px] font-semibold text-stone-700">{value}</span>
    </div>
  );
}

function PromoCardBody({
  title,
  location,
  capacity,
  bedrooms,
  bathrooms,
  priceStartingAtLabel,
  displayNightly,
  perNightLabel,
  priceWas,
  priceMain,
  stayLabel,
  promotionBadges,
  promoStatLabels,
  promoRatingLabels,
}: {
  title: string;
  location: string | null;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  promotionBadges: PromotionBadgeItem[];
  promoStatLabels?: VillaCardProps["promoStatLabels"];
  promoRatingLabels: NonNullable<VillaCardProps["promoRatingLabels"]>;
  priceStartingAtLabel: string;
  displayNightly: string;
  perNightLabel: string;
  priceWas: string | null;
  priceMain: string;
  stayLabel: string | null;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col px-2 py-4 md:px-3.5 md:py-5 lg:px-4 lg:py-[22px]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <PromoTitleRow title={title} location={location} />
        <PromoPromotionPills badges={promotionBadges} />
      </div>

      <div className="mt-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {promoStatLabels ? (
            <>
              <PromoStatIconItem
                icon={Users}
                value={capacity}
                ariaLabel={`${capacity} ${promoStatLabels.guests}`}
              />
              <PromoStatIconItem
                icon={BedDouble}
                value={bedrooms}
                ariaLabel={`${bedrooms} ${promoStatLabels.bedrooms}`}
              />
              <PromoStatIconItem
                icon={Bath}
                value={bathrooms}
                ariaLabel={`${bathrooms} ${promoStatLabels.bathrooms}`}
              />
            </>
          ) : (
            <StatsRow capacity={capacity} bedrooms={bedrooms} bathrooms={bathrooms} seamless />
          )}
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1 text-left">
          <p className="sr-only">
            {priceStartingAtLabel} {displayNightly} {perNightLabel}, {priceMain}
            {stayLabel ? `, ${stayLabel}` : ""}
            {priceWas ? `, ${priceWas}` : ""}
          </p>
          <p className="mb-0.5 font-serif text-[10px] font-normal tracking-wide text-stone-400">
            {priceStartingAtLabel}
          </p>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold text-stone-900">{priceMain}</span>
            {stayLabel ? (
              <span className="text-xs font-medium text-stone-900">{stayLabel}</span>
            ) : null}
          </div>
          <p className="mt-1.5 text-xs font-medium text-stone-800">
            {displayNightly} {perNightLabel}
          </p>
          {priceWas ? (
            <p className="mt-0.5 text-xs font-normal text-stone-500 line-through">{priceWas}</p>
          ) : null}
        </div>

        <div className="shrink-0">
          <PromoRatingsBlock labels={promoRatingLabels} />
        </div>
      </div>
    </div>
  );
}

function RecommendedCardBody({
  title,
  location,
  capacity,
  bedrooms,
  stayLabel,
  viewLabel,
  displayNightly,
  perNightLabel,
}: {
  title: string;
  location: string | null;
  capacity: number;
  bedrooms: number;
  stayLabel: string | null;
  viewLabel: string;
  displayNightly: string;
  perNightLabel: string;
}) {
  return (
    <div className="flex flex-1 flex-col p-6">
      <h3 className="mb-2 truncate font-serif text-xl leading-snug text-stone-900">{title}</h3>
      <p className="mb-3 text-sm text-stone-500">{location ?? "\u00A0"}</p>
      <p className="mb-4 font-serif text-2xl text-stone-900">
        {displayNightly}
        <span className="font-sans text-sm text-stone-500"> {perNightLabel}</span>
      </p>
      <RecommendedStats capacity={capacity} bedrooms={bedrooms} />
      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="min-w-0 flex-1 text-xs text-stone-500">{stayLabel ?? "\u00A0"}</p>
        <span className="shrink-0 bg-stone-900 px-6 py-2.5 font-sans text-xs text-white">{viewLabel}</span>
      </div>
    </div>
  );
}

function PromoTitleRow({
  title,
  location,
}: {
  title: string;
  location: string | null;
}) {
  return (
    <h3 className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className="min-w-0 truncate font-serif text-lg font-semibold leading-tight text-stone-900 md:text-xl">
        {title}
      </span>
      {location ? (
        <span className="shrink-0 text-xs font-normal text-stone-400">{location}</span>
      ) : null}
    </h3>
  );
}

function RecommendedStats({ capacity, bedrooms }: { capacity: number; bedrooms: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 border-y border-neutral-100 py-3 text-xs font-black">
      <span>{capacity}</span>
      <span>{bedrooms}</span>
    </div>
  );
}
