import type { CronRunStatus } from "@/db/tables/enums";
import type { DateString } from "@/lib/dates";

export type CronJobContext = {
  jobName: string;
  /** Business-timezone today, resolved once per run by the route handler. */
  today: DateString;
};

export type CronJobResult = {
  processedCount: number;
  failedCount: number;
  /** Per-job counters, stored in `cron_runs.payload` for post-mortems. */
  payload?: Record<string, unknown>;
};

export type CronJobHandler = (
  context: CronJobContext,
) => Promise<CronJobResult>;

/** Exactly what the route handler returns as JSON, mirroring the `cron_runs` row. */
export type CronRunSummary = {
  id: number | null;
  jobName: string;
  status: CronRunStatus;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  processedCount: number;
  failedCount: number;
  error: string | null;
  payload: Record<string, unknown> | null;
};
