import type { VillaCardRow } from "@/db/queries/villas.queries";
import type { VillaCardProps } from "@/components/villa/VillaCard";
import {
  parseRate,
  toDisplayAmount,
  type ExchangeRateMap,
} from "@/lib/currency";
import {
  INTL_LOCALE_TAGS,
  localize,
  type Currency,
  type Locale,
} from "@/lib/locales";
import type { ExchangeRateRow } from "@/db/queries/rates.queries";
import type { ListingStayCardMeta } from "@/lib/listing-stay-quote";
import { selectedStayNightCount } from "@/lib/listing-stay-quote";
import type { DateString } from "@/lib/dates";

const PLACEHOLDER_IMAGE =
  "https://placehold.co/800x600/e4e4e7/3f3f46/png?text=Villa";

export function buildExchangeRateMap(rows: ExchangeRateRow[]): ExchangeRateMap {
  const rates: ExchangeRateMap = {};
  for (const row of rows) {
    const r = parseRate(row.rate);
    if (Number.isFinite(r)) {
      rates[row.quoteCurrency] = r;
    }
  }
  return rates;
}

type CardCopy = {
  wasPrice: (values: { price: string }) => string;
  perStay: (values: { nights: number }) => string;
  nextAvailable: (values: { range: string }) => string;
  firstAvailability: string;
  priceStartingAt: string;
  perNight: string;
  specialOffer: string;
  editorsChoice: string;
  totalForTrip?: (values: { nights: number }) => string;
  selectedStayDates?: (values: { range: string }) => string;
  minStayBadge?: (values: { nights: number }) => string;
};

export type VillaCardMapContext = {
  selectedStay?: {
    checkIn: DateString;
    checkOut: DateString;
    meta?: ListingStayCardMeta;
  };
};

/**
 * Cached window dates are plain `YYYY-MM-DD`, so they are formatted in UTC —
 * reading them in the server's zone would shift the label by a day.
 */
function formatStayRange(
  checkIn: string,
  checkOut: string,
  locale: Locale,
): string {
  const format = new Intl.DateTimeFormat(INTL_LOCALE_TAGS[locale], {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const from = format.format(new Date(`${checkIn}T00:00:00.000Z`));
  const to = format.format(new Date(`${checkOut}T00:00:00.000Z`));
  return `${from} – ${to}`;
}

export function mapVillaCardRowToProps(
  row: VillaCardRow,
  locale: Locale,
  currency: Currency,
  rates: ExchangeRateMap,
  tCard: CardCopy,
  context: VillaCardMapContext = {},
): Omit<VillaCardProps, never> {
  const discounted =
    row.priceFromCents !== null
      ? toDisplayAmount(row.priceFromCents, currency, locale, rates)
      : null;
  const base =
    row.baseTotalCents !== null
      ? toDisplayAmount(row.baseTotalCents, currency, locale, rates)
      : null;

  const showStrike =
    row.hasActiveDiscount &&
    base !== null &&
    discounted !== null &&
    row.baseTotalCents !== row.priceFromCents;

  const selectedStay =
    context.selectedStay?.meta !== undefined ? context.selectedStay : undefined;
  const minStayUnmet =
    selectedStay?.meta?.mode === "min_stay" ? selectedStay.meta : null;

  const priceMain =
    minStayUnmet !== null ? "—" : (discounted?.formatted ?? "—");
  const nightlyFormatted =
    row.avgNightlyCents !== null
      ? toDisplayAmount(row.avgNightlyCents, currency, locale, rates).formatted
      : null;
  const priceWas =
    minStayUnmet === null && showStrike && base
      ? tCard.wasPrice({ price: base.formatted })
      : null;

  const stayLabel =
    selectedStay !== undefined
      ? null
      : row.cacheNightCount !== null && row.cacheNightCount > 0
        ? tCard.perStay({ nights: row.cacheNightCount })
        : null;

  const availabilityLabel =
    selectedStay !== undefined
      ? (tCard.selectedStayDates?.({
          range: formatStayRange(
            selectedStay.checkIn,
            selectedStay.checkOut,
            locale,
          ),
        }) ??
        formatStayRange(selectedStay.checkIn, selectedStay.checkOut, locale))
      : row.cacheCheckIn !== null && row.cacheCheckOut !== null
        ? tCard.nextAvailable({
            range: formatStayRange(row.cacheCheckIn, row.cacheCheckOut, locale),
          })
        : null;

  const tripNights =
    selectedStay !== undefined
      ? (row.cacheNightCount ??
        selectedStayNightCount(selectedStay.checkIn, selectedStay.checkOut))
      : 0;

  const priceStartingAtLabel =
    selectedStay !== undefined && minStayUnmet === null
      ? (tCard.totalForTrip?.({ nights: tripNights }) ??
        tCard.priceStartingAt)
      : tCard.priceStartingAt;

  const listingSelectedStay = selectedStay !== undefined;
  const hideTripTotalPrice = minStayUnmet !== null;
  const minStayBadgeLabel =
    minStayUnmet !== null
      ? (tCard.minStayBadge?.({ nights: minStayUnmet.requiredNights }) ??
        `Min stay: ${minStayUnmet.requiredNights}`)
      : null;

  const promotionLabels = row.appliedPromotions.map((promotion) =>
    localize(promotion.displayNameI18n, locale),
  );

  return {
    slug: row.slug,
    title: row.title,
    location: row.locationName,
    imageUrl: row.mainImageUrl ?? PLACEHOLDER_IMAGE,
    imageAlt: row.mainImageAlt ?? row.title,
    stayLabel,
    availabilityLabel,
    promotionLabels,
    priceMain,
    nightlyPrice: nightlyFormatted,
    priceStartingAtLabel,
    perNightLabel: tCard.perNight,
    listingSelectedStay,
    hideTripTotalPrice,
    minStayBadgeLabel,
    firstAvailabilityTitle: tCard.firstAvailability,
    priceWas,
    showOfferBadge: row.hasActiveDiscount,
    offerBadgeLabel: tCard.specialOffer,
    showEditorsChoiceBadge: row.isEditorsChoice,
    editorsChoiceLabel: tCard.editorsChoice,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    capacity: row.capacity,
  };
}
