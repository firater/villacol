/**
 * The single secured entry point for every cron job.
 *
 * `GET` and `POST` both work, because schedulers disagree about which to use
 * (Vercel Cron sends `GET`, QStash sends `POST`).
 */
import { createHash, timingSafeEqual } from "node:crypto";

import { headers } from "next/headers";

import { env } from "@/env";
import { CRON_JOB_NAMES, CRON_JOBS, isCronJobName } from "@/lib/cron/registry";
import { withJobLock } from "@/lib/cron/with-job-lock";
import { getBusinessToday } from "@/lib/dates";

/** A full sweep over every villa is well past the default serverless timeout. */
export const maxDuration = 300;

/**
 * Hashes both sides to a fixed 32 bytes before comparing. `timingSafeEqual`
 * throws on length mismatch, and comparing raw secrets would leak the expected
 * length through that error.
 */
function isAuthorized(authorization: string | null): boolean {
  if (authorization === null) return false;

  const prefix = "Bearer ";
  if (!authorization.startsWith(prefix)) return false;

  const presented = createHash("sha256")
    .update(authorization.slice(prefix.length))
    .digest();
  const expected = createHash("sha256").update(env.CRON_SECRET).digest();

  return timingSafeEqual(presented, expected);
}

async function handle(context: {
  params: Promise<{ job: string }>;
}): Promise<Response> {
  // Reading headers keeps this handler dynamic. Under Cache Components a `GET`
  // that touches nothing request-specific is prerendered at build time, which
  // would mean the scheduler hits a static response and no job ever runs.
  const requestHeaders = await headers();

  if (!isAuthorized(requestHeaders.get("authorization"))) {
    return Response.json(
      { error: "unauthorized" },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  const { job } = await context.params;

  if (!isCronJobName(job)) {
    return Response.json(
      { error: "unknown_job", job, knownJobs: CRON_JOB_NAMES },
      { status: 404, headers: { "cache-control": "no-store" } },
    );
  }

  const handler = CRON_JOBS[job];

  // The job derives today from the business timezone rather than from the
  // request, so a misconfigured scheduler shifts *when* it runs, never *what*
  // it computes.
  const today = getBusinessToday();

  const summary = await withJobLock(job, () => handler({ jobName: job, today }));

  const status = summary.status === "failed" ? 500 : 200;

  return Response.json(summary, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ job: string }> },
): Promise<Response> {
  return handle(context);
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ job: string }> },
): Promise<Response> {
  return handle(context);
}
