import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { bookings } from "./bookings";

/**
 * Email-OTP access to a booking, for guests who book without an account.
 *
 * Two factors, deliberately separated:
 *   - `bookings.access_token` is the opaque handle in the confirmation link. It
 *     identifies *which* booking, and nothing more.
 *   - a challenge row here proves the person holding that link also controls
 *     the email address on the booking.
 *
 * The link alone is therefore not a credential: forwarding the email does not
 * hand over access without a code delivered to the original address.
 */
export const bookingOtpChallenges = pgTable(
  "booking_otp_challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),

    /**
     * Snapshot of the address the code was sent to. Kept so changing the
     * booking's email later cannot retroactively redirect a live challenge.
     */
    email: text("email").notNull(),

    /**
     * SHA-256 of the 6-digit code. Never the code itself: a leaked backup of
     * this table would otherwise be a list of working one-time passwords.
     */
    codeHash: text("code_hash").notNull(),

    issuedAt: timestamp("issued_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Issued + `OTP_TTL_MINUTES` (15). */
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    attemptCount: integer("attempt_count").notNull().default(0),
    /** Three strikes, then `locked_until` is set 30 minutes out. */
    maxAttempts: integer("max_attempts").notNull().default(3),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),

    consumedAt: timestamp("consumed_at", { withTimezone: true }),
  },
  (table) => [
    // At most one live challenge per booking, so a resend replaces rather than
    // accumulates and an attacker cannot widen the guess space by requesting
    // twenty codes that are all simultaneously valid.
    uniqueIndex("booking_otp_challenges_live_idx")
      .on(table.bookingId)
      .where(sql`${table.consumedAt} IS NULL`),
    index("booking_otp_challenges_booking_id_idx").on(table.bookingId),
    index("booking_otp_challenges_expires_at_idx").on(table.expiresAt),

    check(
      "booking_otp_challenges_max_attempts_check",
      sql`${table.maxAttempts} > 0`,
    ),
    check(
      "booking_otp_challenges_attempt_count_check",
      sql`${table.attemptCount} >= 0`,
    ),
  ],
);

/**
 * Granted after a successful OTP verification. The token hash lives here rather
 * than the token, for the same reason as the code above, and the row is what
 * makes a grant revocable.
 */
export const bookingAccessSessions = pgTable(
  "booking_access_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    index("booking_access_sessions_booking_id_idx").on(table.bookingId),
    index("booking_access_sessions_expires_at_idx").on(table.expiresAt),
  ],
);
