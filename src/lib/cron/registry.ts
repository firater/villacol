/**
 * Job name -> handler. Adding a job is one entry here, which keeps the choice
 * of scheduler (Vercel Cron, GitHub Actions, QStash) a deployment detail that
 * can change without touching code.
 */
import type { CronJobHandler } from "./types";

import { cleanupExpiredCodes } from "./jobs/cleanup-expired-codes";
import { rebuildSearchIndexJob } from "./jobs/rebuild-search-index";
import { rebuildSimilarVillasJob } from "./jobs/rebuild-similar-villas";
import { dailyRebuildJob } from "./jobs/rebuild-villa-price-cache";
import { refreshExchangeRates } from "./jobs/refresh-exchange-rates";

const JOBS = {
  "daily-rebuild": (context) => dailyRebuildJob({ today: context.today }),
  "rebuild-similar-villas": () => rebuildSimilarVillasJob(),
  "rebuild-search-index": () => rebuildSearchIndexJob(),
  "refresh-exchange-rates": () => refreshExchangeRates(),
  "cleanup-expired-codes": () => cleanupExpiredCodes(),
} satisfies Record<string, CronJobHandler>;

export type CronJobName = keyof typeof JOBS;

/**
 * Re-exported through an explicit `Record` so every entry is callable with a
 * full `CronJobContext`. Without the annotation, a handler written as `() =>`
 * keeps its zero-argument type and callers cannot pass the context.
 */
export const CRON_JOBS: Record<CronJobName, CronJobHandler> = JOBS;

export function isCronJobName(value: string): value is CronJobName {
  return Object.hasOwn(CRON_JOBS, value);
}

export const CRON_JOB_NAMES = Object.keys(CRON_JOBS) as CronJobName[];
