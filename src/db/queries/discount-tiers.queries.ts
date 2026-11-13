/**
 * Discount tiers: how many villas carry each exact discount value.
 *
 * One grouped read, computed on demand. There is deliberately no cron job and
 * no materialised table behind this — the numbers come straight from
 * `villa_promotions`, so attaching a promotion in the admin changes the counts
 * on the next request instead of on the next scheduled run.
 */
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { promotions, villaPromotions, villas } from "@/db/schema";
import type { DiscountType, PromotionTrigger } from "@/db/tables/enums";
import { resolveCommissionRateBp } from "@/lib/commission";

/** Which column the tier's `value` came from, and therefore how to read it. */
export type DiscountTierUnit =
  | "percent_bp"
  | "fixed_amount_cents"
  | "free_nights";

export type DiscountTier = {
  discountType: DiscountType;
  unit: DiscountTierUnit;
  /** Basis points, eurocents, or nights, per `unit`. */
  value: number;
  villaCount: number;
};

export type DiscountTierFilter = {
  /** Omit to get every type in one pass. */
  discountType?: DiscountType;
  triggerType?: PromotionTrigger;
};

const UNIT_BY_DISCOUNT_TYPE: Record<DiscountType, DiscountTierUnit> = {
  percentage: "percent_bp",
  commission_waiver: "percent_bp",
  fixed_amount: "fixed_amount_cents",
  free_days: "free_nights",
};

/**
 * Counts active villas per exact discount value.
 *
 * A villa is counted once per tier no matter how many promotions in that tier
 * it carries, and a villa carrying two different discounts appears in both —
 * these are facet counts, not a partition.
 *
 * Trigger conditions that depend on the stay (nights, lead time, coupon code)
 * are not evaluated here: a tier answers "what is on offer", not "what would
 * this particular booking pay". The booking-window filter is the one exception,
 * because a promotion outside its window cannot apply to anyone.
 */
export async function getDiscountTiers(
  filter: DiscountTierFilter = {},
): Promise<DiscountTier[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("villas", "offers", "discount-tiers");

  const commissionRateBp = resolveCommissionRateBp();

  // `commission_waiver` with no value of its own discounts by the global rate,
  // so it has to be folded in here or those villas would group under null.
  const discountValue = sql<number>`
    case ${promotions.discountType}::text
      when 'percentage' then ${promotions.percentBp}
      when 'commission_waiver' then coalesce(${promotions.percentBp}, ${commissionRateBp})
      when 'fixed_amount' then ${promotions.fixedAmountCents}
      when 'free_days' then ${promotions.freeNights}
    end
  `;

  const today = sql`current_date`;

  const rows = await db
    .select({
      discountType: promotions.discountType,
      value: sql<number>`${discountValue}::int`,
      villaCount: sql<number>`count(distinct ${villas.id})::int`,
    })
    .from(villaPromotions)
    .innerJoin(promotions, eq(promotions.id, villaPromotions.promotionId))
    .innerJoin(villas, eq(villas.id, villaPromotions.villaId))
    .where(
      and(
        eq(promotions.isActive, true),
        eq(villas.isActive, true),
        or(
          isNull(promotions.bookingWindowStart),
          sql`${promotions.bookingWindowStart} <= ${today}`,
        ),
        or(
          isNull(promotions.bookingWindowEnd),
          sql`${promotions.bookingWindowEnd} >= ${today}`,
        ),
        filter.discountType
          ? eq(promotions.discountType, filter.discountType)
          : undefined,
        filter.triggerType
          ? eq(promotions.triggerType, filter.triggerType)
          : undefined,
        sql`${discountValue} is not null`,
      ),
    )
    .groupBy(promotions.discountType, discountValue)
    .orderBy(sql`${discountValue} desc`);

  return rows.map((row) => ({
    discountType: row.discountType,
    unit: UNIT_BY_DISCOUNT_TYPE[row.discountType],
    value: row.value,
    villaCount: row.villaCount,
  }));
}
