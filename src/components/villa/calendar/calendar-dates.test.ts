import { describe, expect, it } from "vitest";

import {
  apiDatesToPickerRange,
  createDayIndexer,
  fromApiDate,
  maskHasDay,
  maskHasNight,
  pickerRangeToApiDates,
  toApiDate,
} from "./calendar-dates";

describe("toApiDate", () => {
  it("reads the local calendar day, not the UTC one", () => {
    // react-day-picker builds cells at local midnight; reading UTC fields here
    // would move the cell to the previous day for visitors west of UTC.
    const cell = new Date(2026, 10, 7);
    expect(toApiDate(cell)).toBe("2026-11-07");
  });

  it("round-trips through fromApiDate", () => {
    expect(toApiDate(fromApiDate("2027-03-01"))).toBe("2027-03-01");
  });
});

describe("createDayIndexer", () => {
  const indexOfDay = createDayIndexer("2026-11-07");

  it("returns the offset from the range start", () => {
    expect(indexOfDay(new Date(2026, 10, 7))).toBe(0);
    expect(indexOfDay(new Date(2026, 10, 8))).toBe(1);
    expect(indexOfDay(new Date(2027, 4, 1))).toBe(175);
  });

  it("is negative before the range", () => {
    expect(indexOfDay(new Date(2026, 10, 6))).toBe(-1);
  });

  it("is unaffected by DST transitions", () => {
    // Istanbul has no DST, but a visitor's zone may: the indexer must still
    // count whole days across a spring-forward boundary.
    const beforeShift = indexOfDay(new Date(2027, 2, 27));
    const afterShift = indexOfDay(new Date(2027, 2, 30));
    expect(afterShift - beforeShift).toBe(3);
  });
});

describe("mask lookups", () => {
  const mask = "00110";

  it("reads single days and rejects out-of-range indexes", () => {
    expect(maskHasDay(mask, 2)).toBe(true);
    expect(maskHasDay(mask, 1)).toBe(false);
    expect(maskHasDay(mask, -1)).toBe(false);
    expect(maskHasDay(mask, 5)).toBe(false);
  });

  it("detects a flagged night inside a stay", () => {
    expect(maskHasNight(mask, 0, 2)).toBe(false);
    expect(maskHasNight(mask, 0, 3)).toBe(true);
    expect(maskHasNight(mask, 4, 1)).toBe(false);
  });
});

describe("picker range conversion", () => {
  it("maps URL check-in and checkout days directly onto the picker", () => {
    const range = apiDatesToPickerRange("2026-11-08", "2026-11-11");
    expect(range && toApiDate(range.from)).toBe("2026-11-08");
    expect(range?.to && toApiDate(range.to)).toBe("2026-11-11");
  });

  it("round-trips Nov 8 → Nov 11 (3 nights, checkout on the 11th)", () => {
    expect(
      pickerRangeToApiDates(new Date(2026, 10, 8), new Date(2026, 10, 11)),
    ).toEqual({ checkIn: "2026-11-08", checkOut: "2026-11-11" });
    expect(apiDatesToPickerRange("2026-11-08", "2026-11-11")).toEqual({
      from: new Date(2026, 10, 8),
      to: new Date(2026, 10, 11),
    });
  });

  it("keeps an open-ended selection open", () => {
    const range = apiDatesToPickerRange("2026-11-07", null);
    expect(range?.to).toBeUndefined();
    expect(apiDatesToPickerRange(null, null)).toBeUndefined();
  });

  it("writes the picker end date as check_out without shifting", () => {
    expect(
      pickerRangeToApiDates(new Date(2026, 10, 7), new Date(2026, 10, 9)),
    ).toEqual({ checkIn: "2026-11-07", checkOut: "2026-11-09" });
  });

  it("reports no checkout while only the first night is picked", () => {
    expect(pickerRangeToApiDates(new Date(2026, 10, 7), undefined)).toEqual({
      checkIn: "2026-11-07",
      checkOut: null,
    });
    expect(pickerRangeToApiDates(undefined, undefined)).toEqual({
      checkIn: null,
      checkOut: null,
    });
  });
});
