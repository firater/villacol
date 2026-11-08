/**
 * Post-response triggers for admin edits.
 *
 * An admin saving a villa should get their redirect immediately, not wait on an
 * 18-month horizon recompute. `after()` runs the rebuild once the response has
 * been sent, which is why a save feels instant while the card price still
 * updates without waiting for the nightly sweep.
 */
import { after } from "next/server";

import type { DateString } from "@/lib/dates";

import { rebuildVillaSearchDocuments } from "@/lib/search/indexer";

import { rebuildSimilarVillas } from "./jobs/rebuild-similar-villas";
import { rebuildVillaPriceCache } from "./jobs/rebuild-villa-price-cache";

export type RebuildReason =
  | "admin_edit"
  | "calendar_edit"
  | "promotion_edit"
  | "manual";

/**
 * Errors are swallowed deliberately: this runs after the response, so throwing
 * cannot inform the admin of anything. The failure is logged and the nightly
 * `daily-rebuild` sweep is the backstop that repairs the row.
 *
 * Note there is no advisory lock here. A targeted single-villa rebuild touches
 * only that villa's rows, and `withJobLock` guards the full sweeps that would
 * otherwise interleave with each other.
 */
export function enqueueVillaCacheRebuild(
  villaId: number,
  reason: RebuildReason,
  options: { today?: DateString } = {},
): void {
  after(async () => {
    try {
      const result = await rebuildVillaPriceCache([villaId], {
        today: options.today,
      });
      if (result.failedCount > 0) {
        console.error(
          `[cron] enqueued price rebuild for villa ${villaId} (${reason}) reported ${result.failedCount} failure(s)`,
        );
      }
    } catch (error) {
      console.error(
        `[cron] enqueued price rebuild failed for villa ${villaId} (${reason})`,
        error,
      );
    }
  });
}

/** Same contract for the similarity mapping, used by Phase 6 villa actions. */
export function enqueueSimilarVillasRebuild(villaId: number): void {
  after(async () => {
    try {
      await rebuildSimilarVillas([villaId]);
    } catch (error) {
      console.error(
        `[cron] enqueued similar villas rebuild failed for villa ${villaId}`,
        error,
      );
    }
  });
}

/**
 * Keeps `villa_search_documents` current after a content edit.
 *
 * Reindexing is post-response for the same reason the price rebuild is: an
 * admin saving a title should not wait on `to_tsvector`. The nightly
 * `rebuild-search-index` job repairs anything this drops.
 */
export function enqueueSearchReindex(villaIds: readonly number[]): void {
  if (villaIds.length === 0) return;

  after(async () => {
    try {
      const result = await rebuildVillaSearchDocuments([...villaIds]);
      if (result.failedCount > 0) {
        console.error(
          `[search] enqueued reindex reported ${result.failedCount} failure(s)`,
        );
      }
    } catch (error) {
      console.error(
        `[search] enqueued reindex failed for villas ${villaIds.join(", ")}`,
        error,
      );
    }
  });
}

/**
 * Taxonomy renames (a location or category name) change the document of every
 * villa that references them, which can be the whole catalogue. Rather than
 * enqueue thousands of ids, this reindexes everything in one pass.
 */
export function enqueueFullSearchReindex(reason: RebuildReason): void {
  after(async () => {
    try {
      await rebuildVillaSearchDocuments();
    } catch (error) {
      console.error(`[search] full reindex failed (${reason})`, error);
    }
  });
}

/** Promotion edits can affect many villas at once. */
export function enqueueVillaCacheRebuildMany(
  villaIds: readonly number[],
  reason: RebuildReason,
): void {
  if (villaIds.length === 0) return;

  after(async () => {
    try {
      await rebuildVillaPriceCache([...villaIds]);
    } catch (error) {
      console.error(
        `[cron] enqueued price rebuild failed for villas ${villaIds.join(", ")} (${reason})`,
        error,
      );
    }
  });
}
