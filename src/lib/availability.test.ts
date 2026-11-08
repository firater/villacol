import { describe, expect, it } from "vitest";

import { findNextAvailableWindows } from "@/lib/availability";
import { addDays, type DateString } from "@/lib/dates";
import type { Cents } from "@/lib/money";
import type { NightRate } from "@/lib/pricing.types";

const START: DateString = "2026-06-01";

type NightOverride = { blocked?: boolean; minStay?: number; priceCents?: number };

/**
 * Builds a horizon of `count` open nights from `START`, with per-index overrides.
 * Index 0 is `START`, which keeps the expectations readable as day offsets.
 */
function horizon(
  count: number,
  overrides: Record<number, NightOverride> = {},
): NightRate[] {
  return Array.from({ length: count }, (_unused, index) => {
    const override = overrides[index] ?? {};
    return {
      date: addDays(START, index),
      priceCents: (override.priceCents ?? 20_000) as Cents,
      minStay: override.minStay ?? null,
      isBlocked: override.blocked ?? false,
    };
  });
}

function blocked(...indexes: number[]): Record<number, NightOverride> {
  return Object.fromEntries(indexes.map((index) => [index, { blocked: true }]));
}

describe("findNextAvailableWindows — the min-stay window", () => {
  it("starts on the first night of a wide-open horizon", () => {
    const [window] = findNextAvailableWindows(horizon(30), { defaultMinStay: 5 });

    expect(window).toMatchObject({
      kind: "min_stay",
      checkIn: "2026-06-01",
      checkOut: "2026-06-06",
      nightCount: 5,
      startIndex: 0,
    });
  });

  it("resumes after a blocker instead of retrying every start inside the run", () => {
    // Nights 2..8 are held, so no run of five fits before them and the first
    // start that can work is night 9.
    const windows = findNextAvailableWindows(
      horizon(30, blocked(2, 3, 4, 5, 6, 7, 8)),
      { defaultMinStay: 5 },
    );

    expect(windows[0]).toMatchObject({
      kind: "min_stay",
      startIndex: 9,
      checkIn: addDays(START, 9),
      nightCount: 5,
    });
  });

  it("skips a leading blocked night", () => {
    const windows = findNextAvailableWindows(horizon(10, blocked(0)), {
      defaultMinStay: 3,
    });

    expect(windows[0]).toMatchObject({ startIndex: 1, nightCount: 3 });
  });

  it("returns nothing when no run is long enough", () => {
    // Four open nights, a blocker, four more — a five-night stay never fits.
    expect(
      findNextAvailableWindows(horizon(9, blocked(4)), { defaultMinStay: 5 }),
    ).toEqual([]);
  });

  it("returns nothing when the whole horizon is blocked", () => {
    const nights = horizon(10).map((night) => ({ ...night, isBlocked: true }));

    expect(findNextAvailableWindows(nights, { defaultMinStay: 2 })).toEqual([]);
  });

  it("returns nothing for an empty horizon", () => {
    expect(findNextAvailableWindows([], { defaultMinStay: 5 })).toEqual([]);
  });

  it("will not run past the end of the horizon", () => {
    // Exactly five nights for a five-night minimum is the boundary case.
    expect(
      findNextAvailableWindows(horizon(5), { defaultMinStay: 5 })[0],
    ).toMatchObject({ startIndex: 0, nightCount: 5 });

    expect(findNextAvailableWindows(horizon(4), { defaultMinStay: 5 })).toEqual(
      [],
    );
  });

  it("honours the check-in night's own min_stay override", () => {
    const windows = findNextAvailableWindows(
      horizon(30, { 0: { minStay: 10 } }),
      { defaultMinStay: 3 },
    );

    expect(windows[0]).toMatchObject({ startIndex: 0, nightCount: 10 });
  });

  it("ignores min_stay overrides on nights it is not checking in on", () => {
    // The 14-night override on night 3 is irrelevant: the stay starts on night
    // 0 and only the check-in night's minimum governs the window.
    const windows = findNextAvailableWindows(
      horizon(30, { 3: { minStay: 14 } }),
      { defaultMinStay: 4 },
    );

    expect(windows[0]).toMatchObject({ startIndex: 0, nightCount: 4 });
  });

  it("re-reads the override after resuming on a later night", () => {
    const windows = findNextAvailableWindows(
      horizon(30, { ...blocked(0, 1), 2: { minStay: 8 } }),
      { defaultMinStay: 3 },
    );

    expect(windows[0]).toMatchObject({ startIndex: 2, nightCount: 8 });
  });
});

describe("findNextAvailableWindows — the promo window", () => {
  it("adds a second window for a free-days threshold above the min stay", () => {
    const windows = findNextAvailableWindows(horizon(30), {
      defaultMinStay: 5,
      promoNightCounts: [7],
    });

    expect(windows.map((window) => window.kind)).toEqual([
      "min_stay",
      "promo_free_days",
    ]);
    expect(windows[1]).toMatchObject({
      checkIn: "2026-06-01",
      checkOut: "2026-06-08",
      nightCount: 7,
      startIndex: 0,
    });
  });

  it("omits the promo window when it describes the same stay", () => {
    // Threshold equals the min stay, so a second row would be duplicated work.
    const windows = findNextAvailableWindows(horizon(30), {
      defaultMinStay: 7,
      promoNightCounts: [7],
    });

    expect(windows.map((window) => window.kind)).toEqual(["min_stay"]);
  });

  it("picks the smallest threshold, which is the earliest honest offer", () => {
    const windows = findNextAvailableWindows(horizon(40), {
      defaultMinStay: 3,
      promoNightCounts: [21, 7, 14],
    });

    expect(windows[1].nightCount).toBe(7);
  });

  it("still clears the check-in night's min stay when that is the longer of the two", () => {
    const windows = findNextAvailableWindows(
      horizon(40, { 0: { minStay: 12 } }),
      { defaultMinStay: 3, promoNightCounts: [7] },
    );

    expect(windows[0]).toMatchObject({ startIndex: 0, nightCount: 12 });
    // Both requirements land on 12 nights, so the promo window collapses into
    // the min-stay one rather than being written twice.
    expect(windows).toHaveLength(1);
  });

  it("can start the promo window later than the min-stay window", () => {
    // A three-night stay fits before the blocker at night 4; a seven-night one
    // has to wait until night 5.
    const windows = findNextAvailableWindows(horizon(30, blocked(4)), {
      defaultMinStay: 3,
      promoNightCounts: [7],
    });

    expect(windows[0]).toMatchObject({ startIndex: 0, nightCount: 3 });
    expect(windows[1]).toMatchObject({
      kind: "promo_free_days",
      startIndex: 5,
      nightCount: 7,
    });
  });

  it("keeps the min-stay window when the threshold does not fit the horizon", () => {
    const windows = findNextAvailableWindows(horizon(10), {
      defaultMinStay: 5,
      promoNightCounts: [30],
    });

    expect(windows.map((window) => window.kind)).toEqual(["min_stay"]);
  });

  it("ignores thresholds that are not usable night counts", () => {
    const windows = findNextAvailableWindows(horizon(30), {
      defaultMinStay: 5,
      promoNightCounts: [0, -4, 2.5],
    });

    expect(windows.map((window) => window.kind)).toEqual(["min_stay"]);
  });

  it("treats an empty threshold list the same as none at all", () => {
    expect(
      findNextAvailableWindows(horizon(30), {
        defaultMinStay: 5,
        promoNightCounts: [],
      }),
    ).toEqual(findNextAvailableWindows(horizon(30), { defaultMinStay: 5 }));
  });

  it("produces only the promo window when the min stay is not a usable length", () => {
    // A villa with `default_min_stay` 0 has no meaningful min-stay window, but
    // a free-days threshold is still a real number of nights to advertise.
    const windows = findNextAvailableWindows(horizon(30), {
      defaultMinStay: 0,
      promoNightCounts: [7],
    });

    expect(windows.map((window) => window.kind)).toEqual(["promo_free_days"]);
    expect(windows[0]).toMatchObject({ startIndex: 0, nightCount: 7 });
  });
});

describe("findNextAvailableWindows — checkOut arithmetic", () => {
  it("sets checkOut to the morning after the last night, across a month boundary", () => {
    const nights = horizon(10).map((night, index) => ({
      ...night,
      date: addDays("2026-06-28", index),
    }));

    const [window] = findNextAvailableWindows(nights, { defaultMinStay: 5 });

    expect(window.checkIn).toBe("2026-06-28");
    expect(window.checkOut).toBe("2026-07-03");
  });
});
