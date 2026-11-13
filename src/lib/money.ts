/**
 * All monetary values in this codebase are integer minor units (eurocents).
 * Floating point euros and Drizzle's stringified `numeric` are both banned from
 * the pricing path: compounding discounts over them loses cents.
 */
export type Cents = number;

export const BASE_CURRENCY = "EUR" as const;

/** Basis points: 10_000 bp = 100%. `1000` is 10%. */
export const BASIS_POINTS_SCALE = 10_000;

export function toCents(amountInMajorUnits: number): Cents {
  return Math.round(amountInMajorUnits * 100);
}

export function fromCents(cents: Cents): number {
  return cents / 100;
}

export function sumCents(values: readonly Cents[]): Cents {
  return values.reduce((total, value) => total + value, 0);
}

/** Rounds half-up to the nearest cent, exactly once, on the value passed in. */
export function percentOfCents(cents: Cents, basisPoints: number): Cents {
  return Math.round((cents * basisPoints) / BASIS_POINTS_SCALE);
}

export function clampCents(
  cents: Cents,
  min: Cents = 0,
  max: Cents = Number.MAX_SAFE_INTEGER,
): Cents {
  return Math.min(Math.max(cents, min), max);
}

export function isValidCents(value: unknown): value is Cents {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/** Proportionally scales `cents` by `numerator / denominator`, cent-exact. */
export function scaleCents(
  cents: Cents,
  numerator: number,
  denominator: number,
): Cents {
  if (denominator === 0) return 0;
  return Math.round((cents * numerator) / denominator);
}

const EUR_DISPLAY = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Safe to call from client components (no server-only imports). */
export function formatEurFromCents(cents: Cents): string {
  return EUR_DISPLAY.format(fromCents(cents));
}
