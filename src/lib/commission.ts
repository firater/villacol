/**
 * The agency commission rate, in basis points.
 *
 * A `commission_waiver` promotion with no `percent_bp` of its own discounts by
 * exactly this, so changing the rate here changes every waiver at once instead
 * of requiring a rewrite of each promotion row.
 *
 * Read from `process.env` directly rather than through `@/env` so the pricing
 * unit tests, which boot without an environment, can import it.
 */
import { BASIS_POINTS_SCALE } from "@/lib/money";

/** 20%. */
export const DEFAULT_COMMISSION_RATE_BP = 2_000;

export function resolveCommissionRateBp(
  raw: string | undefined = process.env.COMMISSION_RATE_BP,
): number {
  if (raw === undefined || raw.trim() === "") {
    return DEFAULT_COMMISSION_RATE_BP;
  }

  const parsed = Number(raw);
  if (
    !Number.isInteger(parsed) ||
    parsed < 1 ||
    parsed > BASIS_POINTS_SCALE
  ) {
    throw new Error(
      `COMMISSION_RATE_BP must be an integer from 1 to ${BASIS_POINTS_SCALE}, received "${raw}"`,
    );
  }

  return parsed;
}
