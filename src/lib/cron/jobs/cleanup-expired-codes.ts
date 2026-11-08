/**
 * Clears expired short-lived credentials: exit-intent codes, booking OTP
 * challenges, and booking access sessions.
 *
 * Both of the first two sit behind a partial unique index that only counts
 * un-finished rows (`redeemed_at IS NULL`, `consumed_at IS NULL`), so leaving
 * an expired row behind would permanently block the next one — a returning
 * visitor could never be issued another code, and a guest could never be sent
 * another OTP. Finished rows are kept: they are the audit trail.
 */
import { and, isNull, lt, or } from "drizzle-orm";

import { dbPool } from "@/db/pool";
import {
  bookingAccessSessions,
  bookingOtpChallenges,
  exitIntentCodes,
} from "@/db/schema";

import type { CronJobResult } from "../types";

export async function cleanupExpiredCodes(): Promise<CronJobResult> {
  const now = new Date();

  const deletedCodes = await dbPool
    .delete(exitIntentCodes)
    .where(
      and(
        lt(exitIntentCodes.expiresAt, now),
        isNull(exitIntentCodes.redeemedAt),
      ),
    )
    .returning({ id: exitIntentCodes.id });

  // Locked challenges are deleted too: the lock exists to slow down guessing a
  // specific code, and that code is gone with the row.
  const deletedChallenges = await dbPool
    .delete(bookingOtpChallenges)
    .where(
      and(
        isNull(bookingOtpChallenges.consumedAt),
        lt(bookingOtpChallenges.expiresAt, now),
        or(
          isNull(bookingOtpChallenges.lockedUntil),
          lt(bookingOtpChallenges.lockedUntil, now),
        ),
      ),
    )
    .returning({ id: bookingOtpChallenges.id });

  const deletedSessions = await dbPool
    .delete(bookingAccessSessions)
    .where(lt(bookingAccessSessions.expiresAt, now))
    .returning({ id: bookingAccessSessions.id });

  const deletedCount =
    deletedCodes.length + deletedChallenges.length + deletedSessions.length;

  return {
    processedCount: deletedCount,
    failedCount: 0,
    payload: {
      deletedCount,
      exitIntentCodes: deletedCodes.length,
      otpChallenges: deletedChallenges.length,
      accessSessions: deletedSessions.length,
      cutoff: now.toISOString(),
    },
  };
}
