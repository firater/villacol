import { env } from "@/env";
import type { Locale } from "@/lib/locales";

/** Absolute URL for the guest OTP gate (`?token=`). */
export function buildBookingStatusUrl(
  locale: Locale,
  accessToken: string,
): string {
  const base = env.BETTER_AUTH_URL.replace(/\/$/, "");
  const params = new URLSearchParams({ token: accessToken });
  return `${base}/${locale}/booking-status?${params.toString()}`;
}
