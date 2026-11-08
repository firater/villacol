import Image from "next/image";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";

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
};

export function VillaCard({
  slug,
  title,
  location,
  imageUrl,
  imageAlt,
  stayLabel,
  availabilityLabel,
  promotionLabels,
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
    return (
      <article className="group relative flex max-h-none flex-col overflow-hidden rounded-[1.5rem] border border-stone-200/60 bg-white p-2 md:max-h-[320px] md:flex-row md:hover:border-stone-300">
        <Link
          href={{ pathname: "/villas/[slug]", params: { slug } }}
          className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-[1.2rem] bg-neutral-100 md:w-[40%]"
          style={{ aspectRatio: "16 / 10" }}
        >
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover transition-transform duration-1000"
          />
          {badgeLabel ? (
            <div className="absolute left-4 top-4 z-20">
              <span className="rounded-full bg-orange-600 px-3 py-1.5 text-[9px] font-medium uppercase tracking-widest text-white">
                {badgeLabel}
              </span>
            </div>
          ) : null}
          {availabilityLabel ? (
            <div className="absolute right-4 top-4 z-20 md:left-auto">
              <div className="flex items-center gap-2 rounded-full border border-stone-200/60 bg-white/95 px-3 py-1.5">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                <span className="flex flex-col leading-none">
                  <span className="text-[9px] font-medium uppercase tracking-tighter text-stone-500">
                    {firstAvailabilityTitle}
                  </span>
                  <span className="text-[11px] font-medium text-stone-900">{availabilityLabel}</span>
                </span>
              </div>
            </div>
          ) : null}
        </Link>
        <PromoCardBody
          title={title}
          slug={slug}
          location={location}
          capacity={capacity}
          bedrooms={bedrooms}
          bathrooms={bathrooms}
          priceStartingAtLabel={priceStartingAtLabel}
          displayNightly={displayNightly}
          perNightLabel={perNightLabel}
          priceWas={priceWas}
          priceMain={priceMain}
          stayLabel={stayLabel}
        />
      </article>
    );
  }

  if (layout === "recommended") {
    return (
      <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200/60 bg-stone-50 hover:border-stone-300">
        <Link
          href={{ pathname: "/villas/[slug]", params: { slug } }}
          className="relative aspect-[4/3] block overflow-hidden bg-neutral-100"
          style={{ aspectRatio: "4 / 3" }}
        >
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
          />
          {badgeLabel ? (
            <PromoBadge text={badgeLabel} />
          ) : null}
        </Link>
        <RecommendedCardBody
          title={title}
          slug={slug}
          location={location}
          capacity={capacity}
          bedrooms={bedrooms}
          stayLabel={stayLabel}
          viewLabel={viewLabel}
          displayNightly={displayNightly}
          perNightLabel={perNightLabel}
        />
      </article>
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

function PromoBadge({ text, className = "left-3 top-3" }: { text: string; className?: string }) {
  return (
    <span
      className={`absolute z-20 rounded-full bg-orange-600 px-3 py-1.5 text-[9px] font-medium uppercase tracking-widest text-white ${className}`}
    >
      {text}
    </span>
  );
}

function StatsRow({
  capacity,
  bedrooms,
  bathrooms,
}: Pick<VillaCardProps, "capacity" | "bedrooms" | "bathrooms">) {
  return (
    <div className="flex items-center gap-5 border-b border-neutral-100 py-2 text-sm font-medium text-neutral-600">
      <span>{capacity}</span>
      <span>{bedrooms}</span>
      <span>{bathrooms}</span>
    </div>
  );
}

function PromoCardBody({
  title,
  slug,
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
}: {
  title: string;
  slug: string;
  location: string | null;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  priceStartingAtLabel: string;
  displayNightly: string;
  perNightLabel: string;
  priceWas: string | null;
  priceMain: string;
  stayLabel: string | null;
}) {
  return (
    <div className="flex flex-grow flex-col justify-between px-2 pb-3 pt-4 md:px-8 md:pt-6">
      <div>
        <PromoTitleRow title={title} slug={slug} location={location} />
        <StatsRow capacity={capacity} bedrooms={bedrooms} bathrooms={bathrooms} />
      </div>
      <div className="flex items-center justify-between pt-3">
        <div>
          <p className="mb-0.5 text-xs font-medium tracking-tighter text-neutral-400">
            {priceStartingAtLabel}
          </p>
          <p className="font-serif text-xl text-stone-900">
            {displayNightly}
            <span className="font-sans text-[10px] font-normal text-stone-500"> {perNightLabel}</span>
          </p>
          <p className="min-h-4 text-xs text-neutral-400 line-through" aria-hidden={priceWas === null}>
            {priceWas ?? "\u00A0"}
          </p>
          <p className="text-sm font-bold text-neutral-800">{priceMain}</p>
          <p className="min-h-4 text-[10px] text-neutral-500">{stayLabel ?? "\u00A0"}</p>
        </div>
      </div>
    </div>
  );
}

function RecommendedCardBody({
  title,
  slug,
  location,
  capacity,
  bedrooms,
  stayLabel,
  viewLabel,
  displayNightly,
  perNightLabel,
}: {
  title: string;
  slug: string;
  location: string | null;
  capacity: number;
  bedrooms: number;
  stayLabel: string | null;
  viewLabel: string;
  displayNightly: string;
  perNightLabel: string;
}) {
  return (
    <div className="flex flex-grow flex-col bg-white p-6">
      <h3 className="mb-2 truncate font-serif text-xl leading-snug text-stone-900">
        <Link href={{ pathname: "/villas/[slug]", params: { slug } }}>{title}</Link>
      </h3>
      <p className="mb-3 text-sm text-stone-500">{location ?? "\u00A0"}</p>
      <p className="mb-4 font-serif text-2xl text-stone-900">
        {displayNightly}
        <span className="font-sans text-sm text-stone-500"> {perNightLabel}</span>
      </p>
      <RecommendedStats capacity={capacity} bedrooms={bedrooms} />
      <div className="mt-6 flex items-center justify-between">
        <p className="min-h-4 text-xs text-stone-500">{stayLabel ?? "\u00A0"}</p>
        <Link
          href={{ pathname: "/villas/[slug]", params: { slug } }}
          className="rounded-full bg-stone-900 px-6 py-2.5 font-sans text-xs text-white"
        >
          {viewLabel}
        </Link>
      </div>
    </div>
  );
}

function PromoTitleRow({
  title,
  slug,
  location,
}: {
  title: string;
  slug: string;
  location: string | null;
}) {
  return (
    <h3 className="mb-2 line-clamp-1 text-xl font-semibold text-neutral-900">
      <Link href={{ pathname: "/villas/[slug]", params: { slug } }}>{title}</Link>
      {location ? (
        <span className="ml-2 text-sm font-semibold text-neutral-400">{location}</span>
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
