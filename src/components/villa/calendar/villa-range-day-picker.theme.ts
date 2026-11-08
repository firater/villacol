import type { ClassNames, CustomComponents, ModifiersClassNames } from "react-day-picker";

import { VillaPublicDayButton } from "./VillaPublicDayButton";

/**
 * Shared react-day-picker theme for public range selection (villa detail + hero).
 */
export const VILLA_RANGE_MODIFIERS_CLASS_NAMES: ModifiersClassNames = {
  blocked:
    "[&_button]:cursor-not-allowed [&_button]:border-red-200 [&_button]:bg-red-100 [&_button]:text-red-800 [&_button]:line-through [&_button]:opacity-75 dark:[&_button]:border-red-900 dark:[&_button]:bg-red-950/60 dark:[&_button]:text-red-200",
  customPrice:
    "[&_button]:border-amber-200 [&_button]:bg-amber-50 [&_button]:text-amber-950 dark:[&_button]:border-amber-900 dark:[&_button]:bg-amber-950/45 dark:[&_button]:text-amber-100",
  holiday:
    "[&_button]:border-violet-300 [&_button]:bg-violet-50/80 [&_button]:ring-2 [&_button]:ring-inset [&_button]:ring-violet-400/80 dark:[&_button]:border-violet-800 dark:[&_button]:bg-violet-950/35 dark:[&_button]:ring-violet-600",
  selected:
    "[&_button]:!border-sky-600 [&_button]:!bg-sky-700 [&_button]:!text-white [&_button]:![text-decoration-none] [&_button]:!opacity-100 [&_button]:shadow-sm dark:[&_button]:!border-sky-400 dark:[&_button]:!bg-sky-600",
  range_start:
    "[&_button]:!border-sky-600 [&_button]:!bg-sky-700 [&_button]:!text-white dark:[&_button]:!border-sky-400 dark:[&_button]:!bg-sky-600",
  range_end:
    "[&_button]:!border-sky-600 [&_button]:!bg-sky-700/80 [&_button]:!text-white [&_button]:ring-2 [&_button]:ring-inset [&_button]:ring-white/40 dark:[&_button]:!border-sky-400 dark:[&_button]:!bg-sky-600/85",
  range_middle:
    "[&_button]:!border-sky-200 [&_button]:!bg-sky-100 [&_button]:!text-sky-900 dark:[&_button]:!border-sky-800 dark:[&_button]:!bg-sky-950/55 dark:[&_button]:!text-sky-100",
};

export const VILLA_RANGE_DAY_BUTTON_CLASS =
  "villa-cal-day-btn flex h-full min-h-[3rem] w-full flex-col items-center justify-center gap-0.5 rounded-lg border border-zinc-200/90 bg-white px-0.5 py-1 text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-700/80 dark:bg-zinc-900/50 dark:text-zinc-100 dark:hover:bg-zinc-800/80";

const SHARED_CLASS_NAMES: Partial<ClassNames> = {
  caption_label: "text-sm font-semibold text-zinc-900 dark:text-zinc-100",
  day: "p-0.5 align-top",
  day_button: VILLA_RANGE_DAY_BUTTON_CLASS,
};

export const VILLA_RANGE_SINGLE_MONTH_CLASS_NAMES: Partial<ClassNames> = {
  ...SHARED_CLASS_NAMES,
  months: "relative flex justify-center",
};

export const VILLA_RANGE_MULTI_MONTH_CLASS_NAMES: Partial<ClassNames> = {
  ...SHARED_CLASS_NAMES,
  months:
    "relative grid grid-cols-1 justify-items-center gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3",
  month: "w-full max-w-[19rem]",
};

export const VILLA_RANGE_DAY_PICKER_COMPONENTS: Partial<CustomComponents> = {
  DayButton: VillaPublicDayButton as CustomComponents["DayButton"],
};

export function villaRangeClassNames(numberOfMonths: number): Partial<ClassNames> {
  return numberOfMonths > 1
    ? VILLA_RANGE_MULTI_MONTH_CLASS_NAMES
    : VILLA_RANGE_SINGLE_MONTH_CLASS_NAMES;
}
