/**
 * Nightly full reindex of `villa_search_documents`.
 *
 * The admin actions already reindex incrementally through
 * `enqueueSearchReindex`, so this is the backstop: it repairs anything an
 * `after()` callback dropped (a crashed instance, a failed write) and picks up
 * taxonomy renames that touched too many villas to enqueue individually.
 */
import { revalidateTag } from "next/cache";

import { rebuildVillaSearchDocuments } from "@/lib/search/indexer";

import type { CronJobResult } from "../types";

export async function rebuildSearchIndexJob(): Promise<CronJobResult> {
  const result = await rebuildVillaSearchDocuments();

  revalidateTag("villa-search", "max");

  return {
    processedCount: result.processedCount,
    failedCount: result.failedCount,
    payload: { documentCount: result.documentCount },
  };
}
