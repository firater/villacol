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
  /** Cached min-stay window as `18 Nov – 25 Nov` (promo price line). */
  cacheStayRangeLabel?: string | null;
  availableBeforeDates?: string;
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
  /** From `villas.editor_rating` when wired; hidden when null. */
  editorRating?: number | null;
  /** Listing with URL stay dates: show trip total heading instead of cache copy. */
  listingSelectedStay?: boolean;
  hideTripTotalPrice?: boolean;
  minStayBadgeLabel?: string | null;
  /** Promo layout: hide the outer card border (home promotions rail). */
  borderless?: boolean;
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
  cacheStayRangeLabel = null,
  availableBeforeDates,
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
  editorRating = null,
  listingSelectedStay = false,
  minStayBadgeLabel = null,
  borderless = false,
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

    const promoShellClass = borderless
      ? "group relative flex flex-col overflow-hidden bg-white transition-colors md:flex-row md:items-stretch"
      : "group relative flex flex-col overflow-hidden border border-stone-200/70 bg-white transition-colors md:flex-row md:items-stretch md:hover:border-stone-300";

    return (
      <Link
        href={{ pathname: "/villas/[slug]", params: { slug } }}
        className={promoShellClass}
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
          editorRating={editorRating ?? null}
          priceStartingAtLabel={priceStartingAtLabel}
          cacheStayRangeLabel={cacheStayRangeLabel}
          availableBeforeDates={availableBeforeDates}
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
          bathrooms={bathrooms}
          promoStatLabels={promoStatLabels}
          priceMain={priceMain}
          stayLabel={stayLabel}
          viewLabel={viewLabel}
          displayNightly={displayNightly}
          perNightLabel={perNightLabel}
        />
      </Link>
    );
  }

  return (
    <Link
      href={{ pathname: "/villas/[slug]", params: { slug } }}
      className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200/60 bg-white transition-colors hover:border-stone-300"
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
      <div className="flex flex-col px-5 pt-5 pb-5">
        <h3 className="min-h-[3rem] text-base font-black leading-snug text-neutral-900 line-clamp-2">
          {title}
        </h3>
        <p className="mt-1 min-h-5 truncate text-sm text-neutral-500">
          {location ?? "\u00A0"}
        </p>
        <StatsRow capacity={capacity} bedrooms={bedrooms} bathrooms={bathrooms} />
        <div className="mt-2.5">
          <p className="text-xs text-neutral-500">{availabilityLabel ?? "\u00A0"}</p>
          {minStayBadgeLabel ? (
            <p className="mt-2 text-xs font-normal leading-snug text-red-500 dark:text-red-400/90">
              {minStayBadgeLabel}
            </p>
          ) : (
            <>
              {listingSelectedStay ? (
                <p className="mt-1 text-xs font-medium text-neutral-600">
                  {priceStartingAtLabel}
                </p>
              ) : null}
              <div className="mt-2 space-y-0.5">
                {priceWas ? (
                  <p className="text-sm text-neutral-400 line-through">{priceWas}</p>
                ) : null}
                <p className="text-lg font-semibold leading-tight text-stone-900">
                  {priceMain}
                </p>
                <p className="text-xs text-neutral-500">
                  {listingSelectedStay ? "\u00A0" : (stayLabel ?? "\u00A0")}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
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

  const guestsLabel = promoStatLabels?.guests ?? "Guests";
  const bedroomsLabel = promoStatLabels?.bedrooms ?? "Bedrooms";
  const bathroomsLabel = promoStatLabels?.bathrooms ?? "Bathrooms";

  return (
    <div className={rowClass}>
      <PromoStatIconItem
        icon={Users}
        value={capacity}
        ariaLabel={`${capacity} ${guestsLabel}`}
      />
      <PromoStatIconItem
        icon={BedDouble}
        value={bedrooms}
        ariaLabel={`${bedrooms} ${bedroomsLabel}`}
      />
      <PromoStatIconItem
        icon={Bath}
        value={bathrooms}
        ariaLabel={`${bathrooms} ${bathroomsLabel}`}
      />
    </div>
  );
}

function PromoRatingsBlock({
  labels,
  editorRating,
}: {
  labels: NonNullable<VillaCardProps["promoRatingLabels"]>;
  editorRating: number | null;
}) {
  const editorScore =
    editorRating !== null && Number.isFinite(editorRating)
      ? editorRating.toLocaleString(undefined, {
          minimumFractionDigits: editorRating % 1 === 0 ? 0 : 1,
          maximumFractionDigits: 1,
        })
      : null;

  return (
    <div className="flex flex-col items-end gap-0.5 leading-none">
      <div className="inline-flex items-center gap-1" aria-label={labels.noUserReviewsAria}>
        <Star className="size-3 shrink-0 text-stone-300" strokeWidth={1.75} aria-hidden />
        <span className="text-[10px] font-normal text-stone-400">{labels.noUserReviews}</span>
      </div>
      {editorScore !== null ? (
        <div className="inline-flex flex-wrap items-center justify-end gap-x-1 gap-y-0.5">
          <Gem
            className="size-3 shrink-0 fill-amber-400/90 text-amber-500"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="font-sans text-[10px] font-bold tracking-tight text-stone-900">
            {editorScore}
            <span className="font-semibold text-stone-600">/10</span>
          </span>
          <span className="text-[8px] font-medium uppercase tracking-widest text-stone-500">
            {labels.editorScoreLabel}
          </span>
        </div>
      ) : null}
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

function PromoStatsTwoRow({
  capacity,
  bedrooms,
  bathrooms,
  promoStatLabels,
  iconStyle,
}: {
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  promoStatLabels: NonNullable<VillaCardProps["promoStatLabels"]>;
  iconStyle: boolean;
}) {
  const guestsLabel = `${capacity} ${promoStatLabels.guests}`;
  const bedroomsLabel = `${bedrooms} ${promoStatLabels.bedrooms}`;
  const bathroomsLabel = `${bathrooms} ${promoStatLabels.bathrooms}`;

  if (iconStyle) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <PromoStatIconItem icon={Users} value={capacity} ariaLabel={guestsLabel} />
          <PromoStatIconItem icon={BedDouble} value={bedrooms} ariaLabel={bedroomsLabel} />
        </div>
        <div className="flex items-center">
          <PromoStatIconItem icon={Bath} value={bathrooms} ariaLabel={bathroomsLabel} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 border-y border-neutral-100 py-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
        <RecommendedStatItem
          icon={Users}
          value={capacity}
          label={promoStatLabels.guests}
          ariaLabel={guestsLabel}
        />
        <RecommendedStatItem
          icon={BedDouble}
          value={bedrooms}
          label={promoStatLabels.bedrooms}
          ariaLabel={bedroomsLabel}
        />
      </div>
      <div className="flex items-center">
        <RecommendedStatItem
          icon={Bath}
          value={bathrooms}
          label={promoStatLabels.bathrooms}
          ariaLabel={bathroomsLabel}
        />
      </div>
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
  cacheStayRangeLabel,
  availableBeforeDates,
  displayNightly,
  perNightLabel,
  priceWas,
  priceMain,
  stayLabel,
  promotionBadges,
  promoStatLabels,
  promoRatingLabels,
  editorRating,
}: {
  title: string;
  location: string | null;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  promotionBadges: PromotionBadgeItem[];
  promoStatLabels?: VillaCardProps["promoStatLabels"];
  promoRatingLabels: NonNullable<VillaCardProps["promoRatingLabels"]>;
  editorRating: number | null;
  priceStartingAtLabel: string;
  cacheStayRangeLabel: string | null;
  availableBeforeDates?: string;
  displayNightly: string;
  perNightLabel: string;
  priceWas: string | null;
  priceMain: string;
  stayLabel: string | null;
}) {
  const promoLeadLabel = cacheStayRangeLabel ?? priceStartingAtLabel;
  const promoLeadAria =
    cacheStayRangeLabel !== null
      ? [availableBeforeDates, cacheStayRangeLabel].filter(Boolean).join(" ")
      : priceStartingAtLabel;

  return (
    <div className="flex min-w-0 flex-1 flex-col px-2 py-4 md:px-3.5 md:py-5 lg:px-4 lg:py-[22px]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <PromoTitleRow title={title} location={location} />
        <PromoPromotionPills badges={promotionBadges} />
      </div>

      <div className="mt-2">
        {promoStatLabels ? (
          <PromoStatsTwoRow
            capacity={capacity}
            bedrooms={bedrooms}
            bathrooms={bathrooms}
            promoStatLabels={promoStatLabels}
            iconStyle
          />
        ) : (
          <StatsRow capacity={capacity} bedrooms={bedrooms} bathrooms={bathrooms} seamless />
        )}
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1 text-left">
          <p className="sr-only">
            {promoLeadAria} {displayNightly} {perNightLabel}, {priceMain}
            {stayLabel ? `, ${stayLabel}` : ""}
            {priceWas ? `, ${priceWas}` : ""}
          </p>
          <p
            className={`mb-0.5 font-serif tracking-wide ${
              cacheStayRangeLabel
                ? "text-[15px] font-normal text-stone-500"
                : "text-xs font-normal text-stone-500"
            }`}
          >
            {cacheStayRangeLabel ? (
              <span>
                {availableBeforeDates ? `${availableBeforeDates} ` : ""}
                {cacheStayRangeLabel}
              </span>
            ) : (
              promoLeadLabel
            )}
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
          <PromoRatingsBlock labels={promoRatingLabels} editorRating={editorRating} />
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
  bathrooms,
  promoStatLabels,
  priceMain,
  stayLabel,
  viewLabel,
  displayNightly,
  perNightLabel,
}: {
  title: string;
  location: string | null;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  promoStatLabels?: VillaCardProps["promoStatLabels"];
  priceMain: string;
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
      <RecommendedStats
        capacity={capacity}
        bedrooms={bedrooms}
        bathrooms={bathrooms}
        promoStatLabels={promoStatLabels}
      />
      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="min-w-0 flex-1 text-xs leading-snug text-stone-500">
          {stayLabel ? (
            <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              {priceMain !== "—" ? (
                <span className="font-sans text-sm font-semibold text-stone-900">{priceMain}</span>
              ) : null}
              <span>{stayLabel}</span>
            </span>
          ) : (
            "\u00A0"
          )}
        </p>
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
    <h3 className="flex min-w-0 flex-col gap-0.5">
      <span className="min-w-0 font-serif text-lg font-semibold leading-tight text-stone-900 line-clamp-2 md:text-xl">
        {title}
      </span>
      {location ? (
        <span className="truncate text-xs font-normal text-stone-400">{location}</span>
      ) : null}
    </h3>
  );
}

function RecommendedStats({
  capacity,
  bedrooms,
  bathrooms,
  promoStatLabels,
}: {
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  promoStatLabels?: VillaCardProps["promoStatLabels"];
}) {
  if (promoStatLabels) {
    return (
      <PromoStatsTwoRow
        capacity={capacity}
        bedrooms={bedrooms}
        bathrooms={bathrooms}
        promoStatLabels={promoStatLabels}
        iconStyle={false}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 border-y border-neutral-100 py-3 text-xs font-black">
      <span>{capacity}</span>
      <span>{bedrooms}</span>
    </div>
  );
}

function RecommendedStatItem({
  icon: Icon,
  value,
  label,
  ariaLabel,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center gap-1.5" aria-label={ariaLabel}>
      <Icon className="size-3.5 shrink-0 text-stone-400" strokeWidth={1.75} aria-hidden />
      <span className="text-sm font-semibold tabular-nums text-stone-800">{value}</span>
      <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-stone-500">{label}</span>
    </div>
  );
}
