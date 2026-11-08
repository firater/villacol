import { describe, expect, it } from "vitest";

import type { Cents } from "@/lib/money";
import {
  BEDROOM_WEIGHT,
  CAPACITY_WEIGHT,
  LOCATION_SAME_WEIGHT,
  LOCATION_SIBLING_WEIGHT,
  PRICE_BAND_WEIGHT,
  priceBandOf,
  rankSimilarVillas,
  scoreVillaSimilarity,
  type SimilarityCandidate,
} from "@/lib/similarity";

function candidate(
  overrides: Partial<SimilarityCandidate> & { id: number },
): SimilarityCandidate {
  return {
    locationId: 1,
    parentLocationId: null,
    capacity: 6,
    bedrooms: 3,
    avgNightlyCents: 25_000 as Cents,
    ...overrides,
  };
}

describe("priceBandOf", () => {
  it("buckets by the band edges, not by raw price", () => {
    expect(priceBandOf(9_999 as Cents)).toBe(0);
    expect(priceBandOf(10_000 as Cents)).toBe(1);
    expect(priceBandOf(19_999 as Cents)).toBe(1);
    // The reason bands exist: 310 EUR and 330 EUR are the same tier.
    expect(priceBandOf(31_000 as Cents)).toBe(priceBandOf(33_000 as Cents));
  });

  it("puts anything above the top edge in the last band", () => {
    expect(priceBandOf(100_000 as Cents)).toBe(5);
    expect(priceBandOf(5_000_000 as Cents)).toBe(5);
  });

  it("has no band for a villa with no price", () => {
    expect(priceBandOf(null)).toBeNull();
  });
});

describe("scoreVillaSimilarity", () => {
  it("scores an identical twin in the same location at the full 100", () => {
    const left = candidate({ id: 1 });
    const right = candidate({ id: 2 });

    expect(scoreVillaSimilarity(left, right)).toBe(
      LOCATION_SAME_WEIGHT + CAPACITY_WEIGHT + BEDROOM_WEIGHT + PRICE_BAND_WEIGHT,
    );
  });

  it("never makes a villa similar to itself", () => {
    const self = candidate({ id: 7 });
    // Same object identity would otherwise be the perfect match.
    expect(scoreVillaSimilarity(self, { ...self })).toBe(0);
  });

  it("is symmetric, so the stored mapping cannot disagree with itself", () => {
    const left = candidate({
      id: 1,
      capacity: 10,
      bedrooms: 5,
      avgNightlyCents: 80_000 as Cents,
    });
    const right = candidate({
      id: 2,
      locationId: 9,
      parentLocationId: 4,
      capacity: 4,
      bedrooms: 2,
      avgNightlyCents: 15_000 as Cents,
    });

    expect(scoreVillaSimilarity(left, right)).toBe(
      scoreVillaSimilarity(right, left),
    );
  });

  it("falls back to the sibling weight when only the parent location matches", () => {
    const left = candidate({ id: 1, locationId: 10, parentLocationId: 99 });
    const right = candidate({ id: 2, locationId: 11, parentLocationId: 99 });

    expect(scoreVillaSimilarity(left, right)).toBe(
      LOCATION_SIBLING_WEIGHT + CAPACITY_WEIGHT + BEDROOM_WEIGHT + PRICE_BAND_WEIGHT,
    );
  });

  it("scores no location points when neither the location nor the parent matches", () => {
    const left = candidate({ id: 1, locationId: 10, parentLocationId: 50 });
    const right = candidate({ id: 2, locationId: 11, parentLocationId: 51 });

    expect(scoreVillaSimilarity(left, right)).toBe(
      CAPACITY_WEIGHT + BEDROOM_WEIGHT + PRICE_BAND_WEIGHT,
    );
  });

  it("treats two null locations as unrelated rather than equal", () => {
    const left = candidate({ id: 1, locationId: null, parentLocationId: null });
    const right = candidate({ id: 2, locationId: null, parentLocationId: null });

    expect(scoreVillaSimilarity(left, right)).toBe(
      CAPACITY_WEIGHT + BEDROOM_WEIGHT + PRICE_BAND_WEIGHT,
    );
  });

  it("falls off linearly with capacity and stops contributing at the tolerance", () => {
    const base = candidate({ id: 1, capacity: 6 });
    const scoreFor = (capacity: number) =>
      scoreVillaSimilarity(base, candidate({ id: 2, capacity }));

    // Tolerance is 4, so each guest of difference costs a quarter of the weight.
    // Rounding happens once, on the total, which is why these compare against a
    // rounded sum rather than against a per-step delta.
    expect(scoreFor(6)).toBe(100);
    expect(scoreFor(7)).toBe(Math.round(100 - CAPACITY_WEIGHT / 4));
    expect(scoreFor(8)).toBe(Math.round(100 - CAPACITY_WEIGHT / 2));
    expect(scoreFor(10)).toBe(100 - CAPACITY_WEIGHT);
    // Past the tolerance the dimension is already at zero and cannot go negative.
    expect(scoreFor(60)).toBe(scoreFor(10));
  });

  it("falls off linearly with bedrooms and stops contributing at the tolerance", () => {
    const base = candidate({ id: 1, bedrooms: 3 });
    const scoreFor = (bedrooms: number) =>
      scoreVillaSimilarity(base, candidate({ id: 2, bedrooms }));

    expect(scoreFor(3)).toBe(100);
    expect(scoreFor(4)).toBe(Math.round(100 - BEDROOM_WEIGHT / 3));
    expect(scoreFor(6)).toBe(100 - BEDROOM_WEIGHT);
    expect(scoreFor(99)).toBe(scoreFor(6));
  });

  it("skips the price dimension entirely when either villa has no price", () => {
    const priced = candidate({ id: 1 });
    const unpriced = candidate({ id: 2, avgNightlyCents: null });

    // Not "the prices are maximally different" — the term is absent, so the
    // remaining weights are all that is available to score.
    expect(scoreVillaSimilarity(priced, unpriced)).toBe(
      LOCATION_SAME_WEIGHT + CAPACITY_WEIGHT + BEDROOM_WEIGHT,
    );
  });

  it("rounds to an integer, because similar_villas.score is an integer column", () => {
    const score = scoreVillaSimilarity(
      candidate({ id: 1, bedrooms: 3 }),
      candidate({ id: 2, bedrooms: 4 }),
    );

    expect(Number.isInteger(score)).toBe(true);
  });
});

describe("rankSimilarVillas", () => {
  const target = candidate({
    id: 1,
    locationId: 10,
    parentLocationId: 99,
    capacity: 6,
    bedrooms: 3,
    avgNightlyCents: 25_000 as Cents,
  });

  it("orders best first and respects the limit", () => {
    const ranked = rankSimilarVillas(
      target,
      [
        candidate({ id: 2, locationId: 10, parentLocationId: 99 }),
        candidate({ id: 3, locationId: 11, parentLocationId: 99 }),
        candidate({ id: 4, locationId: 12, parentLocationId: 50, capacity: 9 }),
      ],
      2,
    );

    expect(ranked.map((entry) => entry.villaId)).toEqual([2, 3]);
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it("excludes the target even when it is handed back in the candidate list", () => {
    const ranked = rankSimilarVillas(target, [target, candidate({ id: 2 })], 10);

    expect(ranked.map((entry) => entry.villaId)).toEqual([2]);
  });

  it("drops zero-scoring candidates rather than padding the list", () => {
    const nothingInCommon = candidate({
      id: 2,
      locationId: 77,
      parentLocationId: 78,
      capacity: 40,
      bedrooms: 40,
      avgNightlyCents: null,
    });

    expect(rankSimilarVillas(target, [nothingInCommon], 10)).toEqual([]);
  });

  it("breaks ties on id so an unchanged rebuild writes identical rows", () => {
    const tied = [5, 3, 4].map((id) =>
      candidate({ id, locationId: 10, parentLocationId: 99 }),
    );

    const ranked = rankSimilarVillas(target, tied, 10);

    expect(new Set(ranked.map((entry) => entry.score)).size).toBe(1);
    expect(ranked.map((entry) => entry.villaId)).toEqual([3, 4, 5]);
  });
});
