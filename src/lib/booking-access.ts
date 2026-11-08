/**
 * OTP and session primitives for guest booking access.
 *
 * Pure except for the crypto calls, and free of DB imports, so the policy
 * numbers live in one readable place and the actions stay about orchestration.
 */
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

/** How long a code stays valid. */
export const OTP_TTL_MINUTES = 15;

/** Wrong guesses allowed before the challenge locks. */
export const OTP_MAX_ATTEMPTS = 3;

/** How long a challenge stays locked after exhausting its attempts. */
export const OTP_LOCK_MINUTES = 30;

/** Minimum gap between sends, so the button is not a mail cannon. */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

/** How long a verified session lasts. */
export const ACCESS_SESSION_TTL_HOURS = 24;

export const OTP_CODE_LENGTH = 6;

/**
 * Uniform over all 10^6 six-digit strings, including those with leading zeros.
 * `randomInt` rather than `Math.random`: this is a credential.
 */
export function generateOtpCode(): string {
  return randomInt(0, 10 ** OTP_CODE_LENGTH)
    .toString()
    .padStart(OTP_CODE_LENGTH, "0");
}

/**
 * SHA-256 with no salt or stretching, on purpose. The input is a 6-digit code
 * with a 15-minute life and a 3-attempt ceiling, so the brute-force bound comes
 * from the attempt limit, not from hash cost; a slow KDF here would only make
 * every verification slower. The hash exists so a database leak does not expose
 * live codes.
 */
export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code, "utf8").digest("hex");
}

/** Constant-time compare of two hex digests. */
export function matchesOtpHash(code: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashOtpCode(code), "hex");
  const expected = Buffer.from(expectedHash, "hex");

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

/** The session token handed to the cookie; only its hash is stored. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function minutesFromNow(minutes: number, now: Date = new Date()): Date {
  return new Date(now.getTime() + minutes * 60_000);
}

export function hoursFromNow(hours: number, now: Date = new Date()): Date {
  return new Date(now.getTime() + hours * 3_600_000);
}

/**
 * Masks an address for the "we sent a code to ..." line, so the page can
 * confirm the destination without disclosing it to whoever holds the link.
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (domain === undefined) return "***";

  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(2, local.length - 1))}@${domain}`;
}
