/**
 * Pure availability scanning over a materialized calendar horizon.
 *
 * No DB imports: the cron hands in `NightRate[]` (the same shape the pricing
 * engine consumes) and gets back the windows worth pricing. That keeps the
 * "which dates should the card advertise" decision unit-testable without a
 * database, and it is the only place that knows a window must respect the
 * *check-in night's* own `min_stay` override.
 */
import { addDays, type DateString } from "@/lib/dates";
import type { NightRate } from "@/lib/pricing.types";

/** Mirrors `price_cache_window_enum`. */
export type AvailabilityWindowKind = "min_stay" | "promo_free_days";

export type AvailabilityWindow = {
  kind: AvailabilityWindowKind;
  checkIn: DateString;
  checkOut: DateString;
  nightCount: number;
  /** Index into the horizon, so the caller can slice nights without a re-scan. */
  startIndex: number;
};

export type FindWindowsOptions = {
  /** `villas.default_min_stay`, used when the check-in night has no override. */
  defaultMinStay: number;
  /**
   * `free_nights_threshold` of every `free_days` promotion attached to the villa.
   * The smallest one wins: it is the earliest achievable window and therefore the
   * offer a listing card can honestly advertise.
   */
  promoNightCounts?: readonly number[];
  /** Promotion `override_min_nights` floors (when promos are on the villa). */
  promotionMinStayOverrides?: readonly number[];
};

function requiredNightsAt(
  nights: readonly NightRate[],
  startIndex: number,
  options: FindWindowsOptions,
): number {
  let required = nights[startIndex].minStay ?? options.defaultMinStay;
  const overrides = options.promotionMinStayOverrides ?? [];
  if (overrides.length > 0) {
    required = Math.min(required, Math.min(...overrides));
  }
  return required;
}

/**
 * Walks the horizon once and returns the earliest run of `requiredFor(start)`
 * consecutive bookable nights. Returns `null` when the horizon holds no such run.
 */
function findEarliestRun(
  nights: readonly NightRate[],
  requiredFor: (startIndex: number) => number,
): { startIndex: number; nightCount: number } | null {
  let start = 0;

  while (start < nights.length) {
    if (nights[start].isBlocked) {
      start += 1;
      continue;
    }

    const need = requiredFor(start);
    if (need <= 0) {
      start += 1;
      continue;
    }

    // Not enough horizon left for this run; nothing later can be shorter.
    if (start + need > nights.length) return null;

    let blockedAt = -1;
    for (let offset = 0; offset < need; offset += 1) {
      if (nights[start + offset].isBlocked) {
        blockedAt = start + offset;
        break;
      }
    }

    if (blockedAt === -1) return { startIndex: start, nightCount: need };

    // Resume after the blocker rather than at `start + 1`: every start in
    // between would hit the same blocked night.
    start = blockedAt + 1;
  }

  return null;
}

function toWindow(
  kind: AvailabilityWindowKind,
  nights: readonly NightRate[],
  run: { startIndex: number; nightCount: number },
): AvailabilityWindow {
  const checkIn = nights[run.startIndex].date;
  return {
    kind,
    checkIn,
    checkOut: addDays(checkIn, run.nightCount),
    nightCount: run.nightCount,
    startIndex: run.startIndex,
  };
}

/**
 * Returns the `min_stay` window always, and a `promo_free_days` window when the
 * villa has a `free_days` promotion whose threshold fits inside the horizon.
 *
 * The promo window is omitted when it would be identical to the min-stay window,
 * since two cache rows describing the same stay would just be duplicated work.
 */
export function findNextAvailableWindows(
  nights: readonly NightRate[],
  options: FindWindowsOptions,
): AvailabilityWindow[] {
  const minStayFor = (startIndex: number): number =>
    requiredNightsAt(nights, startIndex, options);

  const windows: AvailabilityWindow[] = [];

  const minStayRun = findEarliestRun(nights, minStayFor);
  if (minStayRun !== null) {
    windows.push(toWindow("min_stay", nights, minStayRun));
  }

  const thresholds = (options.promoNightCounts ?? []).filter(
    (count) => Number.isInteger(count) && count > 0,
  );

  if (thresholds.length > 0) {
    const threshold = Math.min(...thresholds);
    // A promo stay still has to clear the min stay of the night it starts on.
    const promoRun = findEarliestRun(nights, (startIndex) =>
      Math.max(threshold, requiredNightsAt(nights, startIndex, options)),
    );

    if (
      promoRun !== null &&
      (minStayRun === null ||
        promoRun.startIndex !== minStayRun.startIndex ||
        promoRun.nightCount !== minStayRun.nightCount)
    ) {
      windows.push(toWindow("promo_free_days", nights, promoRun));
    }
  }

  return windows;
}
