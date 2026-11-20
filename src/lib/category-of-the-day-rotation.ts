import { parseDate, type DateString } from "@/lib/dates";

/** 1-based day index in the category's calendar year (business date string). */
export function dayOfYearFromDateString(date: DateString): number {
  const year = Number(date.slice(0, 4));
  const start = parseDate(`${year}-01-01`);
  const current = parseDate(date);
  return Math.floor((current.getTime() - start.getTime()) / 86_400_000) + 1;
}

export function pickCategoryOfTheDayIndex(
  categoryCount: number,
  date: DateString,
): number {
  if (categoryCount <= 0) {
    throw new Error("Cannot pick category of the day: no categories exist");
  }
  const dayIndex = dayOfYearFromDateString(date) - 1;
  return ((dayIndex % categoryCount) + categoryCount) % categoryCount;
}