import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { cronRunStatusEnum } from "./enums";

/**
 * One row per cron invocation. A job that runs at midnight while nobody is
 * watching is only debuggable if it leaves a record, including the runs that
 * were skipped because another instance already held the advisory lock.
 */
export const cronRuns = pgTable(
  "cron_runs",
  {
    id: serial("id").primaryKey(),
    jobName: text("job_name").notNull(),
    status: cronRunStatusEnum("status").notNull().default("running"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    processedCount: integer("processed_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    error: text("error"),
    // Job arguments and per-job summary counters.
    payload: jsonb("payload").$type<Record<string, unknown>>(),
  },
  (table) => [
    index("cron_runs_job_started_idx").on(table.jobName, table.startedAt),
    index("cron_runs_status_idx").on(table.status),
  ],
);
