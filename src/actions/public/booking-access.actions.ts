"use server";

import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { dbPool } from "@/db/pool";
import {
  bookingAccessSessions,
  bookingOtpChallenges,
  bookings,
  villas,
  villaTranslations,
} from "@/db/schema";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import {
  ACCESS_SESSION_TTL_HOURS,
  generateOtpCode,
  generateSessionToken,
  hashOtpCode,
  hashSessionToken,
  hoursFromNow,
  maskEmail,
  matchesOtpHash,
  minutesFromNow,
  OTP_CODE_LENGTH,
  OTP_LOCK_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_MINUTES,
} from "@/lib/booking-access";
import { formatMoney } from "@/lib/currency";
import { sendEmail } from "@/lib/email/send";
import { renderBookingOtpEmail } from "@/lib/email/templates";
import type { Currency, Locale } from "@/lib/locales";
import { BOOKING_ACCESS_COOKIE, resolvePreferences } from "@/lib/preferences";
import { localeSchema } from "@/lib/validation";

const requestSchema = z.object({
  /** The opaque `bookings.access_token` from the guest's link. */
  accessToken: z.string().trim().min(16).max(128),
  locale: localeSchema.optional(),
});

const verifySchema = requestSchema.extend({
  code: z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`), "Enter the 6-digit code"),
});

export type OtpRequestResult = {
  /** Masked, so the link alone never reveals the guest's address. */
  maskedEmail: string;
  expiresAt: Date;
  /** Set when the challenge is locked; no code was sent in that case. */
  lockedUntil: Date | null;
  /** True when a still-valid code was left in place instead of sending a new one. */
  throttled: boolean;
};

/**
 * Generic on purpose. A bad token and a valid token for someone else's booking
 * must be indistinguishable, or the error message turns the endpoint into an
 * oracle for guessing tokens.
 */
const INVALID_LINK = "That booking link is not valid.";

/**
 * Starts (or resumes) an email OTP challenge for a booking.
 *
 * The link identifies the booking; the code proves the person holding it has
 * the guest's inbox. That split is why a forwarded confirmation URL is not a
 * credential on its own.
 */
export async function requestBookingAccessCode(
  input: z.input<typeof requestSchema>,
): Promise<ActionResult<OtpRequestResult>> {
  try {
    const parsed = requestSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const preferences = await resolvePreferences();
    const locale = parsed.data.locale ?? preferences.locale;
    const now = new Date();

    const [booking] = await db
      .select({
        id: bookings.id,
        guestEmail: bookings.guestEmail,
        guestName: bookings.guestName,
      })
      .from(bookings)
      .where(eq(bookings.accessToken, parsed.data.accessToken))
      .limit(1);

    if (booking === undefined) {
      return { ok: false, error: INVALID_LINK };
    }

    const [live] = await db
      .select({
        id: bookingOtpChallenges.id,
        issuedAt: bookingOtpChallenges.issuedAt,
        expiresAt: bookingOtpChallenges.expiresAt,
        lockedUntil: bookingOtpChallenges.lockedUntil,
      })
      .from(bookingOtpChallenges)
      .where(
        and(
          eq(bookingOtpChallenges.bookingId, booking.id),
          isNull(bookingOtpChallenges.consumedAt),
        ),
      )
      .limit(1);

    if (
      live !== undefined &&
      live.lockedUntil !== null &&
      live.lockedUntil > now
    ) {
      // Still locked out: re-sending would reset the attempt counter and make
      // the lock meaningless.
      return ok({
        maskedEmail: maskEmail(booking.guestEmail),
        expiresAt: live.expiresAt,
        lockedUntil: live.lockedUntil,
        throttled: true,
      });
    }

    const withinCooldown =
      live !== undefined &&
      live.expiresAt > now &&
      now.getTime() - live.issuedAt.getTime() <
        OTP_RESEND_COOLDOWN_SECONDS * 1_000;

    if (withinCooldown) {
      // The previous code is still in the guest's inbox and still valid; a new
      // one would only invalidate the one they are about to type.
      return ok({
        maskedEmail: maskEmail(booking.guestEmail),
        expiresAt: live.expiresAt,
        lockedUntil: null,
        throttled: true,
      });
    }

    const code = generateOtpCode();
    const expiresAt = minutesFromNow(OTP_TTL_MINUTES, now);

    const challenge = {
      bookingId: booking.id,
      // Snapshot of the address: changing the booking email later must not
      // redirect a challenge that is already in flight.
      email: booking.guestEmail,
      codeHash: hashOtpCode(code),
      issuedAt: now,
      expiresAt,
      attemptCount: 0,
      maxAttempts: OTP_MAX_ATTEMPTS,
      lockedUntil: null,
      consumedAt: null,
    };

    // Send before committing. If Resend rejects the message, the old challenge
    // survives and no code the guest cannot read has replaced it.
    const email = renderBookingOtpEmail({
      code,
      guestName: booking.guestName,
      locale,
      expiresInMinutes: OTP_TTL_MINUTES,
    });

    await sendEmail({
      to: booking.guestEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    await dbPool.transaction(async (tx) => {
      if (live !== undefined) {
        await tx
          .update(bookingOtpChallenges)
          .set(challenge)
          .where(eq(bookingOtpChallenges.id, live.id));
        return;
      }

      await tx.insert(bookingOtpChallenges).values(challenge);
    });

    return ok({
      maskedEmail: maskEmail(booking.guestEmail),
      expiresAt,
      lockedUntil: null,
      throttled: false,
    });
  } catch (error) {
    return toActionError(error);
  }
}

export type OtpVerifyResult = {
  bookingId: string;
  expiresAt: Date;
};

/**
 * Verifies a code and mints a booking-access session.
 *
 * The attempt counter is incremented in the same statement that reads the
 * challenge, so parallel guesses each cost an attempt instead of racing to
 * share one.
 */
export async function verifyBookingAccessCode(
  input: z.input<typeof verifySchema>,
): Promise<ActionResult<OtpVerifyResult>> {
  try {
    const parsed = verifySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const now = new Date();

    const [booking] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.accessToken, parsed.data.accessToken))
      .limit(1);

    if (booking === undefined) {
      return { ok: false, error: INVALID_LINK };
    }

    const outcome = await dbPool.transaction(async (tx) => {
      const [challenge] = await tx
        .select({
          id: bookingOtpChallenges.id,
          codeHash: bookingOtpChallenges.codeHash,
          expiresAt: bookingOtpChallenges.expiresAt,
          attemptCount: bookingOtpChallenges.attemptCount,
          maxAttempts: bookingOtpChallenges.maxAttempts,
          lockedUntil: bookingOtpChallenges.lockedUntil,
        })
        .from(bookingOtpChallenges)
        .where(
          and(
            eq(bookingOtpChallenges.bookingId, booking.id),
            isNull(bookingOtpChallenges.consumedAt),
          ),
        )
        .for("update")
        .limit(1);

      if (challenge === undefined) {
        return { kind: "no_challenge" } as const;
      }

      if (challenge.lockedUntil !== null && challenge.lockedUntil > now) {
        return { kind: "locked", until: challenge.lockedUntil } as const;
      }

      if (challenge.expiresAt <= now) {
        return { kind: "expired" } as const;
      }

      if (!matchesOtpHash(parsed.data.code, challenge.codeHash)) {
        const attemptCount = challenge.attemptCount + 1;
        const exhausted = attemptCount >= challenge.maxAttempts;
        const lockedUntil = exhausted
          ? minutesFromNow(OTP_LOCK_MINUTES, now)
          : null;

        await tx
          .update(bookingOtpChallenges)
          .set({ attemptCount, lockedUntil })
          .where(eq(bookingOtpChallenges.id, challenge.id));

        return {
          kind: "wrong_code",
          remaining: Math.max(0, challenge.maxAttempts - attemptCount),
          lockedUntil,
        } as const;
      }

      // Correct: burn the challenge so the code cannot be replayed, then mint
      // the session.
      await tx
        .update(bookingOtpChallenges)
        .set({ consumedAt: now, attemptCount: challenge.attemptCount })
        .where(eq(bookingOtpChallenges.id, challenge.id));

      const token = generateSessionToken();
      const expiresAt = hoursFromNow(ACCESS_SESSION_TTL_HOURS, now);

      await tx.insert(bookingAccessSessions).values({
        bookingId: booking.id,
        tokenHash: hashSessionToken(token),
        createdAt: now,
        expiresAt,
      });

      return { kind: "verified", token, expiresAt } as const;
    });

    switch (outcome.kind) {
      case "no_challenge":
        return {
          ok: false,
          error: "Request a new code to continue.",
        };

      case "locked":
        return {
          ok: false,
          error: `Too many incorrect codes. Try again after ${outcome.until.toISOString()}.`,
        };

      case "expired":
        return {
          ok: false,
          error: "That code has expired. Request a new one.",
          fieldErrors: { code: ["This code has expired."] },
        };

      case "wrong_code":
        return {
          ok: false,
          error:
            outcome.lockedUntil !== null
              ? `Too many incorrect codes. Try again in ${OTP_LOCK_MINUTES} minutes.`
              : `Incorrect code. ${outcome.remaining} attempt(s) left.`,
          fieldErrors: { code: ["Incorrect code."] },
        };

      case "verified": {
        const store = await cookies();
        store.set(BOOKING_ACCESS_COOKIE, outcome.token, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          expires: outcome.expiresAt,
        });

        return ok({ bookingId: booking.id, expiresAt: outcome.expiresAt });
      }
    }
  } catch (error) {
    return toActionError(error);
  }
}

/**
 * Resolves the session cookie to a booking id, or `null`.
 *
 * The read path's guard: a page showing booking details calls this rather than
 * trusting the `access_token` in the URL.
 */
export async function getVerifiedBookingId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(BOOKING_ACCESS_COOKIE)?.value;
  if (token === undefined || token.length === 0) return null;

  const [session] = await db
    .select({ bookingId: bookingAccessSessions.bookingId })
    .from(bookingAccessSessions)
    .where(
      and(
        eq(bookingAccessSessions.tokenHash, hashSessionToken(token)),
        isNull(bookingAccessSessions.revokedAt),
        gt(bookingAccessSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return session?.bookingId ?? null;
}

export type GuestBookingView = {
  bookingId: string;
  villaTitle: string;
  checkIn: string;
  checkOut: string;
  nightCount: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestNote: string | null;
  guestCount: number;
  status: string;
  displayTotalFormatted: string;
  displayCurrency: Currency;
};

export async function getGuestBookingForSession(
  locale: Locale,
): Promise<GuestBookingView | null> {
  const bookingId = await getVerifiedBookingId();
  if (bookingId === null) return null;

  const [row] = await db
    .select({
      id: bookings.id,
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
      nightCount: bookings.nightCount,
      guestName: bookings.guestName,
      guestEmail: bookings.guestEmail,
      guestPhone: bookings.guestPhone,
      guestNote: bookings.guestNote,
      guestCount: bookings.guestCount,
      status: bookings.status,
      displayCurrency: bookings.displayCurrency,
      displayTotalCents: bookings.displayTotalCents,
      villaTitle: villaTranslations.title,
    })
    .from(bookings)
    .innerJoin(villas, eq(villas.id, bookings.villaId))
    .innerJoin(
      villaTranslations,
      and(
        eq(villaTranslations.villaId, villas.id),
        eq(villaTranslations.locale, locale),
      ),
    )
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (row === undefined) return null;

  return {
    bookingId: row.id,
    villaTitle: row.villaTitle,
    checkIn: String(row.checkIn),
    checkOut: String(row.checkOut),
    nightCount: row.nightCount,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    guestPhone: row.guestPhone,
    guestNote: row.guestNote,
    guestCount: row.guestCount,
    status: row.status,
    displayTotalFormatted: formatMoney(
      row.displayTotalCents,
      row.displayCurrency,
      locale,
    ),
    displayCurrency: row.displayCurrency,
  };
}

export async function getBookingIdForAccessToken(
  accessToken: string,
): Promise<string | null> {
  const [row] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.accessToken, accessToken))
    .limit(1);
  return row?.id ?? null;
}

/** Signs the guest out of a booking. */
export async function revokeBookingAccess(): Promise<ActionResult<null>> {
  try {
    const store = await cookies();
    const token = store.get(BOOKING_ACCESS_COOKIE)?.value;

    if (token !== undefined && token.length > 0) {
      await dbPool
        .update(bookingAccessSessions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(bookingAccessSessions.tokenHash, hashSessionToken(token)),
            isNull(bookingAccessSessions.revokedAt),
          ),
        );
    }

    store.delete(BOOKING_ACCESS_COOKIE);

    return ok(null);
  } catch (error) {
    return toActionError(error);
  }
}
