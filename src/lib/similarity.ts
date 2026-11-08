/**
 * Pure villa-similarity scoring, so "which villas look like this one" is a
 * testable function rather than a SQL expression nobody can reason about.
 *
 * Weights sum to 100, which makes a score readable at a glance: 40 of it is
 * location, 25 capacity, 20 price band, 15 bedrooms.
 */
import type { Cents } from "@/lib/money";

export const LOCATION_SAME_WEIGHT = 40;
export const LOCATION_SIBLING_WEIGHT = 20;
export const CAPACITY_WEIGHT = 25;
export const PRICE_BAND_WEIGHT = 20;
export const BEDROOM_WEIGHT = 15;

/** Beyond these deltas the dimension contributes nothing. */
const CAPACITY_TOLERANCE = 4;
const BEDROOM_TOLERANCE = 3;
const PRICE_BAND_TOLERANCE = 2;

/**
 * Nightly-price buckets in EUR cents. Comparing bands rather than raw prices
 * keeps a 310 EUR villa and a 330 EUR villa in the same tier instead of
 * penalising them for a 20 EUR gap.
 */
const PRICE_BAND_EDGES: readonly Cents[] = [
  10_000, 20_000, 35_000, 60_000, 100_000,
];

export type SimilarityCandidate = {
  id: number;
  locationId: number | null;
  /** `locations.parent_id`, used to detect sibling districts. */
  parentLocationId: number | null;
  capacity: number;
  bedrooms: number;
  /** Average nightly rate; `null` when the villa has no price yet. */
  avgNightlyCents: Cents | null;
};

export function priceBandOf(avgNightlyCents: Cents | null): number | null {
  if (avgNightlyCents === null) return null;

  let band = 0;
  for (const edge of PRICE_BAND_EDGES) {
    if (avgNightlyCents < edge) return band;
    band += 1;
  }
  return band;
}

/** Linear falloff: full weight at delta 0, zero weight at or beyond tolerance. */
function proximityScore(delta: number, tolerance: number, weight: number): number {
  const normalized = Math.min(Math.abs(delta), tolerance) / tolerance;
  return weight * (1 - normalized);
}

function locationScore(
  left: SimilarityCandidate,
  right: SimilarityCandidate,
): number {
  if (
    left.locationId !== null &&
    right.locationId !== null &&
    left.locationId === right.locationId
  ) {
    return LOCATION_SAME_WEIGHT;
  }

  if (
    left.parentLocationId !== null &&
    right.parentLocationId !== null &&
    left.parentLocationId === right.parentLocationId
  ) {
    return LOCATION_SIBLING_WEIGHT;
  }

  return 0;
}

/**
 * Symmetric by construction: every term reads only absolute deltas and equality,
 * so `score(a, b) === score(b, a)` and the stored mapping cannot disagree with
 * itself depending on which side the cron happened to rebuild.
 *
 * A villa is never similar to itself; that returns 0 so a caller which forgets
 * to exclude it still cannot produce a self-reference (the DB rejects those too).
 */
export function scoreVillaSimilarity(
  left: SimilarityCandidate,
  right: SimilarityCandidate,
): number {
  if (left.id === right.id) return 0;

  let score = locationScore(left, right);

  score += proximityScore(
    left.capacity - right.capacity,
    CAPACITY_TOLERANCE,
    CAPACITY_WEIGHT,
  );

  score += proximityScore(
    left.bedrooms - right.bedrooms,
    BEDROOM_TOLERANCE,
    BEDROOM_WEIGHT,
  );

  const leftBand = priceBandOf(left.avgNightlyCents);
  const rightBand = priceBandOf(right.avgNightlyCents);
  if (leftBand !== null && rightBand !== null) {
    score += proximityScore(
      leftBand - rightBand,
      PRICE_BAND_TOLERANCE,
      PRICE_BAND_WEIGHT,
    );
  }

  // `similar_villas.score` is an integer column.
  return Math.round(score);
}

/**
 * Ranks `candidates` against `target`, best first. Ties break on id so a rebuild
 * that changes nothing writes the same rows in the same order.
 */
export function rankSimilarVillas(
  target: SimilarityCandidate,
  candidates: readonly SimilarityCandidate[],
  limit: number,
): { villaId: number; score: number }[] {
  return candidates
    .filter((candidate) => candidate.id !== target.id)
    .map((candidate) => ({
      villaId: candidate.id,
      score: scoreVillaSimilarity(target, candidate),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.villaId - right.villaId)
    .slice(0, limit);
}
