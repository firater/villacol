"use client";

import {
  DayPicker,
  type CustomComponents,
  type DateRange,
  type DayPickerProps,
  type Matcher,
} from "react-day-picker";

import { calendarMinHeightClass } from "./calendar-layout";

import {
  VILLA_RANGE_DAY_PICKER_COMPONENTS,
  VILLA_RANGE_MODIFIERS_CLASS_NAMES,
  villaRangeClassNames,
} from "./villa-range-day-picker.theme";

import "react-day-picker/style.css";

export type VillaRangeDayPickerProps = {
  wrapperClassName: string;
  numberOfMonths?: number;
  selected: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  disabled?: Matcher | Matcher[];
  modifiers?: DayPickerProps["modifiers"];
  defaultMonth?: Date;
  startMonth?: Date;
  endMonth?: Date;
  excludeDisabled?: boolean;
  components?: Partial<CustomComponents>;
};

export function VillaRangeDayPicker({
  wrapperClassName,
  numberOfMonths = 1,
  selected,
  onSelect,
  disabled,
  modifiers,
  defaultMonth,
  startMonth,
  endMonth,
  excludeDisabled,
  components,
}: VillaRangeDayPickerProps) {
  const rootClass = [
    "villa-day-picker",
    calendarMinHeightClass(numberOfMonths),
    wrapperClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      <DayPicker
        mode="range"
        excludeDisabled={excludeDisabled}
        numberOfMonths={numberOfMonths}
        defaultMonth={defaultMonth}
        startMonth={startMonth}
        endMonth={endMonth}
        selected={selected}
        onSelect={onSelect}
        disabled={disabled}
        modifiers={modifiers}
        modifiersClassNames={VILLA_RANGE_MODIFIERS_CLASS_NAMES}
        components={components}
        classNames={villaRangeClassNames(numberOfMonths)}
        showOutsideDays={false}
        fixedWeeks
      />
    </div>
  );
}

export { VILLA_RANGE_DAY_PICKER_COMPONENTS };
