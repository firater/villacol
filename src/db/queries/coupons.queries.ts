/**
 * Resolves whatever the guest typed into the code box onto something the
 * pricing engine understands.
 *
 * The engine matches `promotions.code`, a fixed string shared by everyone who
 * gets that offer. Exit-intent codes are one-off per visitor, so they need a
 * translation step: find the live `exit_intent_codes` row, then hand the engine
 * the underlying promotion's code and remember the row id so the booking can
 * redeem it.
 *
 * Deliberately uncached: a one-off code's liveness is the whole point.
 */
import { and, eq, gt, isNull } from "drizzle-orm";

import { db } from "@/db";
import { exitIntentCodes, promotions } from "@/db/schema";

export type ResolvedCoupon = {
  /** What to put in `PricingContext.couponCode`; `null` when nothing was typed. */
  couponCode: string | null;
  /** Set only for exit-intent codes, which are single-use and must be redeemed. */
  exitIntentCodeId: string | null;
  /** The promotion the exit-intent code points at, for the audit trail. */
  exitIntentPromotionId: number | null;
};

export async function resolveCouponCode(
  rawCode: string | null | undefined,
  now: Date = new Date(),
): Promise<ResolvedCoupon> {
  const code = rawCode?.trim();

  if (code === undefined || code.length === 0) {
    return { couponCode: null, exitIntentCodeId: null, exitIntentPromotionId: null };
  }

  const [row] = await db
    .select({
      id: exitIntentCodes.id,
      promotionId: exitIntentCodes.promotionId,
      promotionCode: promotions.code,
    })
    .from(exitIntentCodes)
    .innerJoin(promotions, eq(promotions.id, exitIntentCodes.promotionId))
    .where(
      and(
        eq(exitIntentCodes.code, code),
        isNull(exitIntentCodes.redeemedAt),
        gt(exitIntentCodes.expiresAt, now),
      ),
    )
    .limit(1);

  // Not an exit-intent code: pass it through as an ordinary coupon and let the
  // engine decide whether any promotion matches.
  if (row === undefined) {
    return { couponCode: code, exitIntentCodeId: null, exitIntentPromotionId: null };
  }

  // The visitor id is not checked here. The code is a single-use secret, and a
  // guest who cleared cookies between receiving and using it should not be
  // turned away; the row records which visitor it was issued to either way.
  return {
    couponCode: row.promotionCode ?? code,
    exitIntentCodeId: row.id,
    exitIntentPromotionId: row.promotionId,
  };
}
