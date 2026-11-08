/**
 * Display-time currency conversion and formatting.
 *
 * Deliberately outside the pricing engine. Every stored amount is EUR cents, so
 * a cached total stays reproducible months later regardless of what the rate
 * table says today; mixing conversion into the engine would make a cached quote
 * un-recomputable the moment a rate moved.
 */
import { INTL_LOCALE_TAGS, type Currency, type Locale } from "@/lib/locales";
import { BASE_CURRENCY, type Cents } from "@/lib/money";

export type ExchangeRateMap = Partial<Record<Currency, number>>;

export function parseRate(rate: string | number): number {
  const value = typeof rate === "number" ? rate : Number.parseFloat(rate);
  return Number.isFinite(value) && value > 0 ? value : Number.NaN;
}

/**
 * Converts EUR cents into the target currency's minor units.
 *
 * Rounds once, at the end. The base currency short-circuits to a rate of 1 so
 * an empty or stale rate table can never distort a EUR price.
 */
export function convertCents(
  cents: Cents,
  target: Currency,
  rates: ExchangeRateMap,
): Cents {
  if (target === BASE_CURRENCY) return cents;

  const rate = rates[target];
  if (rate === undefined || !Number.isFinite(rate) || rate <= 0) {
    // No usable rate: fall back to the EUR figure rather than inventing one.
    return cents;
  }

  return Math.round(cents * rate);
}

export function formatMoney(
  cents: Cents,
  currency: Currency,
  locale: Locale,
): string {
  return new Intl.NumberFormat(INTL_LOCALE_TAGS[locale], {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Pairs the EUR source of truth with what the guest actually sees. */
export type DisplayAmount = {
  cents: Cents;
  currency: Currency;
  formatted: string;
  /** EUR cents, always. The value a booking is written with. */
  baseCents: Cents;
  rate: number;
};

export function toDisplayAmount(
  baseCents: Cents,
  currency: Currency,
  locale: Locale,
  rates: ExchangeRateMap,
): DisplayAmount {
  const rate = currency === BASE_CURRENCY ? 1 : (rates[currency] ?? 1);
  const cents = convertCents(baseCents, currency, rates);

  return {
    cents,
    currency,
    formatted: formatMoney(cents, currency, locale),
    baseCents,
    rate,
  };
}
