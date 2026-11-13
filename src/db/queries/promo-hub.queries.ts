/**
 * Villa ids for promotions-hub listing filters (`?promo=` on `/villas`).
 */
import { and, eq, isNull, or, sql } from "drizzle-orm";

import { db } from "@/db";
import type { DiscountTierFilter } from "@/db/queries/discount-tiers.queries";
import { promotions, villaPromotions, villas } from "@/db/schema";
import { getPromoHubSectionBySlug } from "@/lib/promotions-hub";
import type { PromoListingFilter } from "@/lib/promo-listing-params";
import { resolveCommissionRateBp } from "@/lib/commission";

export async function getPromoHubListingVillaIds(
  filter: PromoListingFilter,
): Promise<number[]> {
  const section = getPromoHubSectionBySlug(filter.promo);
  if (section === undefined) return [];

  const idSets = await Promise.all(
    section.tierFilters.map((tierFilter) =>
      loadVillaIdsForTierFilter(tierFilter, filter.tier),
    ),
  );

  const merged = new Set<number>();
  for (const ids of idSets) {
    for (const id of ids) merged.add(id);
  }

  return [...merged];
}

async function loadVillaIdsForTierFilter(
  sectionFilter: DiscountTierFilter,
  exactTier: PromoListingFilter["tier"],
): Promise<number[]> {
  const commissionRateBp = resolveCommissionRateBp();
  const discountValue = sql`
    case ${promotions.discountType}::text
      when 'percentage' then ${promotions.percentBp}
      when 'commission_waiver' then coalesce(${promotions.percentBp}, ${commissionRateBp})
      when 'fixed_amount' then ${promotions.fixedAmountCents}
      when 'free_days' then ${promotions.freeNights}
    end
  `;
  const discountValueInt = sql<number>`(${discountValue})::int`;

  const today = sql`current_date`;

  const rows = await db
    .selectDistinct({ id: villas.id })
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
        sectionFilter.discountType
          ? eq(promotions.discountType, sectionFilter.discountType)
          : undefined,
        sectionFilter.triggerType
          ? eq(promotions.triggerType, sectionFilter.triggerType)
          : undefined,
        exactTier !== null
          ? and(
              eq(promotions.discountType, exactTier.discountType),
              sql`${discountValueInt} = ${exactTier.value}`,
            )
          : undefined,
        sql`${discountValueInt} is not null`,
      ),
    );

  return rows.map((row) => row.id);
}
