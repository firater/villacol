import { describe, expect, it } from "vitest";

import {
  dayOfYearFromDateString,
  pickCategoryOfTheDayIndex,
} from "@/lib/category-of-the-day-rotation";

describe("category of the day rotation", () => {
  it("computes day of year from business date strings", () => {
    expect(dayOfYearFromDateString("2026-01-01")).toBe(1);
    expect(dayOfYearFromDateString("2026-01-02")).toBe(2);
    expect(dayOfYearFromDateString("2026-12-31")).toBe(365);
  });

  it("wraps category index by day of year", () => {
    const count = 7;
    expect(pickCategoryOfTheDayIndex(count, "2026-01-01")).toBe(0);
    expect(pickCategoryOfTheDayIndex(count, "2026-01-08")).toBe(0);
    expect(pickCategoryOfTheDayIndex(count, "2026-01-03")).toBe(2);
  });
});