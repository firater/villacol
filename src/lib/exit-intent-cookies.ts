/**
 * Browser cookies for the exit-intent modal and countdown widget.
 * Client-only (document.cookie); safe no-ops during SSR.
 */

export const EXIT_INTENT_USED_COOKIE = "exit_intent_used";
export const EXIT_INTENT_CODE_COOKIE = "exit_intent_code";
export const EXIT_INTENT_EXPIRY_COOKIE = "exit_intent_expiry";
export const EXIT_INTENT_COOLDOWN_COOKIE = "exit_intent_cooldown";

/**
 * After a booking redeems an exit-intent code, suppress the offer until the
 * cookie expires (~90 days), then the guest can receive a new code.
 */
export const EXIT_INTENT_USED_MAX_AGE_DAYS = 90;

/** Countdown shown in the modal and floating widget. */
export const EXIT_INTENT_OFFER_TTL_HOURS = 24;

/** Suppress mouse-leave modal after dismiss without booking. */
export const EXIT_INTENT_COOLDOWN_DAYS = 3;

const SECONDS_PER_DAY = 86_400;
const MS_PER_HOUR = 3_600_000;

function setBrowserCookie(name: string, value: string, maxAgeDays?: number): void {
  if (typeof document === "undefined") return;

  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    "path=/",
    "SameSite=Lax",
  ];
  if (maxAgeDays !== undefined) {
    parts.push(`max-age=${maxAgeDays * SECONDS_PER_DAY}`);
  }
  document.cookie = parts.join("; ");
}

function deleteBrowserCookie(name: string): void {
  setBrowserCookie(name, "", 0);
}

function readCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${encodeURIComponent(name)}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

export function isExitIntentUsed(): boolean {
  return readCookieValue(EXIT_INTENT_USED_COOKIE) === "true";
}

export function getExitIntentCodeCookie(): string | null {
  const value = readCookieValue(EXIT_INTENT_CODE_COOKIE);
  return value && value.length > 0 ? value : null;
}

export function getExitIntentExpiry(): Date | null {
  const raw = readCookieValue(EXIT_INTENT_EXPIRY_COOKIE);
  if (!raw) return null;
  const ms = Date.parse(raw);
  return Number.isNaN(ms) ? null : new Date(ms);
}

export function getExitIntentRemainingMs(): number {
  const expiry = getExitIntentExpiry();
  if (!expiry) return 0;
  return Math.max(0, expiry.getTime() - Date.now());
}

export function isExitIntentCooldownActive(): boolean {
  const raw = readCookieValue(EXIT_INTENT_COOLDOWN_COOKIE);
  if (!raw) return false;
  const until = Date.parse(raw);
  return !Number.isNaN(until) && until > Date.now();
}

/** True when a live code + future expiry exist and the guest has not booked with it. */
export function isExitIntentOfferActive(): boolean {
  if (isExitIntentUsed()) return false;
  const code = getExitIntentCodeCookie();
  const expiry = getExitIntentExpiry();
  if (!code || !expiry) return false;
  return expiry.getTime() > Date.now();
}

export function setExitIntentCooldown(): void {
  const until = new Date(Date.now() + EXIT_INTENT_COOLDOWN_DAYS * SECONDS_PER_DAY * 1000);
  setBrowserCookie(EXIT_INTENT_COOLDOWN_COOKIE, until.toISOString(), EXIT_INTENT_COOLDOWN_DAYS);
}

/**
 * Persists the issued code for the UI countdown. Keeps an existing future expiry
 * when re-opening the modal; otherwise starts a fresh 24h window.
 */
export function persistExitIntentOffer(code: string): void {
  const existing = getExitIntentExpiry();
  const expiry =
    existing && existing.getTime() > Date.now()
      ? existing
      : new Date(Date.now() + EXIT_INTENT_OFFER_TTL_HOURS * MS_PER_HOUR);

  const cookieLifeDays = Math.ceil(EXIT_INTENT_OFFER_TTL_HOURS / 24) + 1;
  setBrowserCookie(EXIT_INTENT_CODE_COOKIE, code, cookieLifeDays);
  setBrowserCookie(EXIT_INTENT_EXPIRY_COOKIE, expiry.toISOString(), cookieLifeDays);
}

export function clearExpiredExitIntentOffer(): void {
  if (isExitIntentOfferActive()) return;
  deleteBrowserCookie(EXIT_INTENT_CODE_COOKIE);
  deleteBrowserCookie(EXIT_INTENT_EXPIRY_COOKIE);
}

/**
 * Call when a booking successfully applies the exit-intent code.
 * Sets `exit_intent_used` with a 90-day TTL and clears live-offer cookies so
 * the timer widget disappears immediately.
 */
export function markExitIntentUsed(): void {
  setBrowserCookie(EXIT_INTENT_USED_COOKIE, "true", EXIT_INTENT_USED_MAX_AGE_DAYS);
  deleteBrowserCookie(EXIT_INTENT_CODE_COOKIE);
  deleteBrowserCookie(EXIT_INTENT_EXPIRY_COOKIE);
  deleteBrowserCookie(EXIT_INTENT_COOLDOWN_COOKIE);
}
