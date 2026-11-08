/**
 * Serializes cron runs with a Postgres advisory lock and audits every attempt.
 *
 * Without the lock, two overlapping `daily-rebuild` runs interleave their
 * `villa_price_cache` upserts and a villa can end up with the min-stay total
 * from one run and the promo total from the other. `pg_try_advisory_lock`
 * returns immediately rather than queueing, so the second run reports
 * `skipped_locked` instead of doubling the work.
 */
import { eq } from "drizzle-orm";

import { dbPool, getPool } from "@/db/pool";
import { cronRuns } from "@/db/schema";

import type { CronJobResult, CronRunSummary } from "./types";

function toSummary(row: typeof cronRuns.$inferSelect): CronRunSummary {
  return {
    id: row.id,
    jobName: row.jobName,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
    durationMs: row.durationMs,
    processedCount: row.processedCount,
    failedCount: row.failedCount,
    error: row.error,
    payload: row.payload ?? null,
  };
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`;
  }
  return String(error);
}

/**
 * The lock is held for the lifetime of a single checked-out connection, so the
 * raw pool client is used directly here: an advisory lock taken on a pooled
 * connection that gets handed back mid-run would be released early.
 */
export async function withJobLock(
  jobName: string,
  run: () => Promise<CronJobResult>,
): Promise<CronRunSummary> {
  const client = await getPool().connect();

  try {
    const lockResult = await client.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock(hashtext($1)) AS locked",
      [jobName],
    );

    if (lockResult.rows[0]?.locked !== true) {
      const [skipped] = await dbPool
        .insert(cronRuns)
        .values({
          jobName,
          status: "skipped_locked",
          finishedAt: new Date(),
          durationMs: 0,
        })
        .returning();

      return toSummary(skipped);
    }

    try {
      const [started] = await dbPool
        .insert(cronRuns)
        .values({ jobName, status: "running" })
        .returning();

      const startedAtMs = started.startedAt.getTime();

      try {
        const result = await run();
        const finishedAt = new Date();

        const [succeeded] = await dbPool
          .update(cronRuns)
          .set({
            // A job that reports failures still "ran"; the counters carry the
            // detail so a partial sweep is distinguishable from a dead one.
            status: "succeeded",
            finishedAt,
            durationMs: finishedAt.getTime() - startedAtMs,
            processedCount: result.processedCount,
            failedCount: result.failedCount,
            payload: result.payload ?? null,
          })
          .where(eq(cronRuns.id, started.id))
          .returning();

        return toSummary(succeeded);
      } catch (error) {
        const finishedAt = new Date();

        const [failed] = await dbPool
          .update(cronRuns)
          .set({
            status: "failed",
            finishedAt,
            durationMs: finishedAt.getTime() - startedAtMs,
            error: describeError(error),
          })
          .where(eq(cronRuns.id, started.id))
          .returning();

        return toSummary(failed);
      }
    } finally {
      await client.query("SELECT pg_advisory_unlock(hashtext($1))", [jobName]);
    }
  } finally {
    client.release();
  }
}
