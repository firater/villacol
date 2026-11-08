/**
 * Regroups `similar_villas` so the detail page reads alternatives with one
 * indexed lookup instead of scoring every villa on request.
 */
import { and, eq, inArray } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { db } from "@/db";
import { dbPool } from "@/db/pool";
import { locations, similarVillas, villaPriceCache, villas } from "@/db/schema";
import { rankSimilarVillas, type SimilarityCandidate } from "@/lib/similarity";

import type { CronJobResult } from "../types";

export const SIMILAR_VILLAS_LIMIT = 6;

async function loadCandidates(): Promise<SimilarityCandidate[]> {
  const rows = await db
    .select({
      id: villas.id,
      locationId: villas.locationId,
      parentLocationId: locations.parentId,
      capacity: villas.capacity,
      bedrooms: villas.bedrooms,
      cachedAvgNightlyCents: villaPriceCache.avgNightlyCents,
      defaultNightlyPriceCents: villas.defaultNightlyPriceCents,
    })
    .from(villas)
    .leftJoin(locations, eq(locations.id, villas.locationId))
    .leftJoin(
      villaPriceCache,
      and(
        eq(villaPriceCache.villaId, villas.id),
        eq(villaPriceCache.windowKind, "min_stay"),
      ),
    )
    .where(eq(villas.isActive, true));

  return rows.map((row) => ({
    id: row.id,
    locationId: row.locationId,
    parentLocationId: row.parentLocationId,
    capacity: row.capacity,
    bedrooms: row.bedrooms,
    // The cached average is the real nightly rate; the villa default is only a
    // fallback for a villa the price cron has not reached yet.
    avgNightlyCents:
      row.cachedAvgNightlyCents ?? row.defaultNightlyPriceCents ?? null,
  }));
}

/**
 * Rebuilds the mapping for `villaIds`, or for every active villa when omitted.
 *
 * When given a subset, the villas that previously pointed *at* one of them are
 * rebuilt too. Similarity is symmetric, so editing villa A's capacity changes
 * who villa B should recommend, and skipping that would leave the mapping
 * disagreeing with itself until the next full sweep.
 */
export async function rebuildSimilarVillas(
  villaIds?: readonly number[],
): Promise<CronJobResult> {
  const candidates = await loadCandidates();
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));

  let targetIds: number[];

  if (villaIds === undefined) {
    targetIds = candidates.map((candidate) => candidate.id);
  } else {
    const inbound = await db
      .select({ villaId: similarVillas.villaId })
      .from(similarVillas)
      .where(inArray(similarVillas.similarVillaId, [...villaIds]));

    targetIds = [
      ...new Set([...villaIds, ...inbound.map((row) => row.villaId)]),
    ].filter((id) => byId.has(id));
  }

  let processedCount = 0;
  let failedCount = 0;

  for (const villaId of targetIds) {
    const target = byId.get(villaId);
    if (target === undefined) continue;

    try {
      const ranked = rankSimilarVillas(
        target,
        candidates,
        SIMILAR_VILLAS_LIMIT,
      );

      await dbPool.transaction(async (tx) => {
        // Admin picks survive the regroup, so only computed rows are replaced.
        const manual = await tx
          .select({ similarVillaId: similarVillas.similarVillaId })
          .from(similarVillas)
          .where(
            and(
              eq(similarVillas.villaId, villaId),
              eq(similarVillas.isManual, true),
            ),
          );

        const manualIds = new Set(manual.map((row) => row.similarVillaId));

        await tx
          .delete(similarVillas)
          .where(
            and(
              eq(similarVillas.villaId, villaId),
              eq(similarVillas.isManual, false),
            ),
          );

        const inserts = ranked
          .filter((entry) => !manualIds.has(entry.villaId))
          .slice(0, Math.max(0, SIMILAR_VILLAS_LIMIT - manualIds.size))
          .map((entry) => ({
            villaId,
            similarVillaId: entry.villaId,
            score: entry.score,
            isManual: false,
            computedAt: new Date(),
          }));

        if (inserts.length > 0) {
          await tx.insert(similarVillas).values(inserts);
        }
      });

      processedCount += 1;
    } catch (error) {
      failedCount += 1;
      console.error(
        `[cron] similar villas rebuild failed for villa ${villaId}`,
        error,
      );
    }
  }

  revalidateTag("similar-villas", "max");

  return {
    processedCount,
    failedCount,
    payload: {
      targetCount: targetIds.length,
      candidateCount: candidates.length,
      limit: SIMILAR_VILLAS_LIMIT,
    },
  };
}

/** Registry entry: a full regroup. */
export async function rebuildSimilarVillasJob(): Promise<CronJobResult> {
  return rebuildSimilarVillas();
}
