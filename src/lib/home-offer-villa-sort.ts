import type { VillaCardRow } from "@/db/queries/villas.queries";

export function offerDiscountCents(row: VillaCardRow): number {
  if (row.baseTotalCents !== null && row.discountedTotalCents !== null) {
    return Math.max(0, row.baseTotalCents - row.discountedTotalCents);
  }
  return row.appliedPromotions.reduce((sum, promotion) => sum + promotion.discountCents, 0);
}

/** Highest discount first; shorter cached stays as tie-breaker. */
export function sortOfferVillasForHomeRail(rows: readonly VillaCardRow[]): VillaCardRow[] {
  return [...rows].sort((a, b) => {
    const discountDelta = offerDiscountCents(b) - offerDiscountCents(a);
    if (discountDelta !== 0) return discountDelta;

    const nightsA = a.cacheNightCount ?? Number.MAX_SAFE_INTEGER;
    const nightsB = b.cacheNightCount ?? Number.MAX_SAFE_INTEGER;
    if (nightsA !== nightsB) return nightsA - nightsB;

    return a.id - b.id;
  });
}
