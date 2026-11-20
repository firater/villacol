import type { VillaCardRow } from "@/db/queries/villas.queries";

export function formatPromoCardScore(rating: number): string {
  return rating.toLocaleString(undefined, {
    minimumFractionDigits: rating % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

export type PromoRatingT = (
  key: "guestReviewAria" | "editorScoreAria",
  values?: Record<string, string | number>,
) => string;

/** Serializable aria for the promo image rating pill (guest star or editor diamond). */
export function buildPromoImageRatingAria(
  row: Pick<VillaCardRow, "guestReviewCount" | "guestReviewAverage" | "editorRating">,
  tCard: PromoRatingT,
): string | null {
  const hasGuestReviews =
    row.guestReviewCount > 0 &&
    row.guestReviewAverage !== null &&
    Number.isFinite(row.guestReviewAverage);

  if (hasGuestReviews && row.guestReviewAverage !== null) {
    return tCard("guestReviewAria", { rating: row.guestReviewAverage });
  }

  if (row.editorRating !== null && Number.isFinite(row.editorRating)) {
    return tCard("editorScoreAria", {
      score: formatPromoCardScore(row.editorRating),
    });
  }

  return null;
}