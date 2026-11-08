"use server";

import { z } from "zod";

import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth-guard";
import { CRON_JOBS } from "@/lib/cron/registry";
import type { CronRunSummary } from "@/lib/cron/types";
import { withJobLock } from "@/lib/cron/with-job-lock";
import { getBusinessToday } from "@/lib/dates";

/**
 * Manual escape hatches.
 *
 * These go through the identical registry handler and the identical
 * `withJobLock` wrapper the scheduler uses, so a manual run cannot diverge from
 * a scheduled one, it cannot collide with one already in flight (it returns
 * `skipped_locked` instead), and it leaves the same `cron_runs` audit row.
 */

const emptySchema = z.object({}).strict();

export async function triggerFullPriceCacheRebuild(
  input: z.input<typeof emptySchema> = {},
): Promise<ActionResult<CronRunSummary>> {
  try {
    await requireAdmin();

    const parsed = emptySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const jobName = "daily-rebuild";
    const summary = await withJobLock(jobName, () =>
      CRON_JOBS[jobName]({ jobName, today: getBusinessToday() }),
    );

    return ok(summary);
  } catch (error) {
    return toActionError(error);
  }
}

export async function triggerSimilarVillasRebuild(
  input: z.input<typeof emptySchema> = {},
): Promise<ActionResult<CronRunSummary>> {
  try {
    await requireAdmin();

    const parsed = emptySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const jobName = "rebuild-similar-villas";
    const summary = await withJobLock(jobName, () =>
      CRON_JOBS[jobName]({ jobName, today: getBusinessToday() }),
    );

    return ok(summary);
  } catch (error) {
    return toActionError(error);
  }
}

export async function triggerExchangeRateRefresh(
  input: z.input<typeof emptySchema> = {},
): Promise<ActionResult<CronRunSummary>> {
  try {
    await requireAdmin();

    const parsed = emptySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const jobName = "refresh-exchange-rates";
    const summary = await withJobLock(jobName, () =>
      CRON_JOBS[jobName]({ jobName, today: getBusinessToday() }),
    );

    return ok(summary);
  } catch (error) {
    return toActionError(error);
  }
}
