/**
 * Discount tiers: how many villas carry each exact discount value.
 *
 * One grouped read, computed on demand. There is deliberately no cron job and
 * no materialised table behind this — the numbers come straight from
 * `villa_promotions`, so attaching a promotion in the admin changes the counts
 * on the next request instead of on the next scheduled run.
 */
import { sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
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

type DiscountTierRow = {
  discount_type: DiscountType;
  discount_value: number;
  villa_count: number;
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

  const discountTypeClause = filter.discountType
    ? sql`AND p.discount_type = ${filter.discountType}`
    : sql``;
  const triggerTypeClause = filter.triggerType
    ? sql`AND p.trigger_type = ${filter.triggerType}`
    : sql``;

  // Inner query computes `discount_value` once per row; outer query groups by alias.
  // Drizzle inlines repeated CASE fragments in GROUP BY and triggers Postgres 42803.
  const result = await db.execute<DiscountTierRow>(sql`
    SELECT
      discount_type,
      discount_value,
      count(DISTINCT villa_id)::int AS villa_count
    FROM (
      SELECT
        p.discount_type,
        (CASE p.discount_type::text
          WHEN 'percentage' THEN p.percent_bp
          WHEN 'commission_waiver' THEN coalesce(p.percent_bp, ${commissionRateBp})
          WHEN 'fixed_amount' THEN p.fixed_amount_cents
          WHEN 'free_days' THEN p.free_nights
        END)::int AS discount_value,
        v.id AS villa_id
      FROM villa_promotions vp
      INNER JOIN promotions p ON p.id = vp.promotion_id
      INNER JOIN villas v ON v.id = vp.villa_id
      WHERE p.is_active = true
        AND v.is_active = true
        AND (p.booking_window_start IS NULL OR p.booking_window_start <= current_date)
        AND (p.booking_window_end IS NULL OR p.booking_window_end >= current_date)
        ${discountTypeClause}
        ${triggerTypeClause}
    ) tier_rows
    WHERE discount_value IS NOT NULL
    GROUP BY discount_type, discount_value
    ORDER BY discount_value DESC
  `);

  return result.rows.map((row) => ({
    discountType: row.discount_type,
    unit: UNIT_BY_DISCOUNT_TYPE[row.discount_type],
    value: row.discount_value,
    villaCount: row.villa_count,
  }));
}
