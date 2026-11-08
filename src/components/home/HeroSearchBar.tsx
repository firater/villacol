"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { DateRange } from "react-day-picker";

import type { FilterFacetOption } from "@/db/queries/filter-facets.queries";
import {
  fromApiDate,
  pickerRangeToApiDates,
} from "@/components/villa/calendar/calendar-dates";
import { HeroDatePicker } from "@/components/home/HeroDatePicker";
import { useRouter } from "@/i18n/navigation";
import type { DateString } from "@/lib/dates";
import { buildVillaFilterQuery, parseVillaFilters } from "@/lib/search-params";

type Props = {
  locations: FilterFacetOption[];
  minDate: string;
  maxGuests: number;
};

function formatHeroDateRange(
  range: DateRange | undefined,
  locale: string,
  placeholder: string,
): string {
  if (!range?.from || !range.to) return placeholder;
  const fmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  return `${fmt.format(range.from)} – ${fmt.format(range.to)}`;
}

export function HeroSearchBar({ locations, minDate, maxGuests }: Props) {
  const t = useTranslations("layout.home.search");
  const locale = useLocale();
  const router = useRouter();
  const fieldId = useId();

  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("");
  const [pickerRange, setPickerRange] = useState<DateRange | undefined>();
  const [committedRange, setCommittedRange] = useState<DateRange | undefined>();
  const [datesOpen, setDatesOpen] = useState(false);
  const [twoMonths, setTwoMonths] = useState(false);

  const datesRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const locationSelectRef = useRef<HTMLSelectElement>(null);
  const guestsSelectRef = useRef<HTMLSelectElement>(null);

  const openNativeSelect = useCallback((select: HTMLSelectElement | null) => {
    if (!select) return;
    select.focus();
    if (typeof select.showPicker === "function") {
      try {
        select.showPicker();
      } catch {
        select.click();
      }
    }
  }, []);
  const minSelectable = useMemo(() => fromApiDate(minDate as DateString), [minDate]);
  const maxSelectable = useMemo(() => {
    const end = fromApiDate(minDate as DateString);
    end.setFullYear(end.getFullYear() + 2);
    return end;
  }, [minDate]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setTwoMonths(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!datesOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const inPopover = popoverRef.current?.contains(target) ?? false;
      const inDatesColumn = datesRef.current?.contains(target) ?? false;
      if (!inPopover && !inDatesColumn) {
        setDatesOpen(false);
        setPickerRange(committedRange);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [datesOpen, committedRange]);

  /**
   * `resetOnSelect` on the picker already restarts the range whenever a
   * completed one is on screen, so this only has to commit and close once both
   * ends are known.
   */
  const handleRangeSelect = useCallback((range: DateRange | undefined) => {
    setPickerRange(range);

    if (!range?.from || !range.to) return;

    const api = pickerRangeToApiDates(range.from, range.to);
    setCheckIn(api.checkIn ?? "");
    setCheckOut(api.checkOut ?? "");
    setCommittedRange(range);
    setDatesOpen(false);
  }, []);

  const openDatesPopover = useCallback(() => {
    setPickerRange(committedRange);
    setDatesOpen(true);
  }, [committedRange]);

  const datesLabel = formatHeroDateRange(committedRange, locale, t("addDates"));
  const hasDates = Boolean(committedRange?.from && committedRange.to);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const filters = parseVillaFilters({
      location: location === "" ? undefined : location,
      check_in: checkIn === "" ? undefined : checkIn,
      check_out: checkOut === "" ? undefined : checkOut,
      guests: guests === "" ? undefined : guests,
    });
    const query = Object.fromEntries(buildVillaFilterQuery(filters).entries());

    if (Object.keys(query).length === 0) {
      router.push("/villas");
      return;
    }
    router.push({ pathname: "/villas", query });
  };

  const monthCount = twoMonths ? 2 : 1;

  return (
    <div className="relative w-full">
      <form
        onSubmit={handleSubmit}
        aria-label={t("title")}
        className="flex w-full flex-col gap-0 overflow-hidden rounded-2xl border border-stone-200/60 bg-white md:flex-row md:items-stretch md:rounded-full md:p-2"
      >
        <Field
          label={t("destination")}
          htmlFor={`${fieldId}-location`}
          icon={<PinIcon />}
          interactive
          onClick={() => openNativeSelect(locationSelectRef.current)}
          className="min-w-0 flex-[1.35] rounded-t-2xl md:flex-[1.5] md:rounded-l-full md:rounded-tr-none"
        >
          <select
            ref={locationSelectRef}
            id={`${fieldId}-location`}
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="w-full cursor-pointer truncate bg-transparent font-sans text-base font-medium tracking-tight text-stone-900 outline-none"
          >
            <option value="">{t("anyDestination")}</option>
            {locations.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          ref={datesRef}
          label={t("dates")}
          htmlFor={`${fieldId}-dates`}
          icon={<CalendarIcon />}
          interactive
          asButton
          onClick={openDatesPopover}
          className="relative min-w-0 flex-[1.35] md:flex-[1.85]"
          aria-expanded={datesOpen}
          aria-haspopup="dialog"
        >
          <span
            id={`${fieldId}-dates`}
            className={`block w-full truncate font-serif text-base font-normal tracking-tight ${
              hasDates ? "text-stone-900" : "text-stone-400"
            }`}
          >
            {datesLabel}
          </span>
        </Field>

        <Field
          label={t("guests")}
          htmlFor={`${fieldId}-guests`}
          icon={<UserIcon />}
          interactive
          onClick={() => openNativeSelect(guestsSelectRef.current)}
          className="min-w-0 flex-[0.95]"
        >
          <select
            ref={guestsSelectRef}
            id={`${fieldId}-guests`}
            value={guests}
            onChange={(event) => setGuests(event.target.value)}
            className="w-full cursor-pointer bg-transparent font-sans text-base font-medium tracking-tight text-stone-900 outline-none"
          >
            <option value="">{t("anyGuests")}</option>
            {Array.from({ length: maxGuests }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </Field>

        <button
          type="submit"
          className="mx-3 mb-3 flex size-14 shrink-0 items-center justify-center self-end rounded-full bg-orange-600 text-white md:m-0 md:ms-2 md:self-center"
        >
          <SearchIcon className="size-6" />
          <span className="sr-only">{t("submit")}</span>
        </button>
      </form>

      {datesOpen ? (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={t("dates")}
          className="absolute top-full left-0 z-[200] mt-4 w-max max-w-[calc(100vw-2rem)] rounded-[2rem] border border-stone-200/80 bg-white p-5 shadow-2xl sm:p-6"
        >
          <HeroDatePicker
            numberOfMonths={monthCount}
            selected={pickerRange}
            onSelect={handleRangeSelect}
            defaultMonth={pickerRange?.from ?? committedRange?.from ?? minSelectable}
            startMonth={minSelectable}
            endMonth={maxSelectable}
            disabled={{ before: minSelectable, after: maxSelectable }}
          />
        </div>
      ) : null}
    </div>
  );
}

const Field = forwardRef<
  HTMLDivElement,
  {
    label: string;
    htmlFor: string;
    icon: ReactNode;
    children: ReactNode;
    className?: string;
    interactive?: boolean;
    asButton?: boolean;
    onClick?: () => void;
    "aria-expanded"?: boolean;
    "aria-haspopup"?: "dialog" | boolean;
  }
>(function Field(
  { label, htmlFor, icon, children, className, interactive, asButton, onClick, ...a11y },
  ref,
) {
  const isActivatable = Boolean(onClick);

  return (
    <div
      ref={ref}
      onClick={onClick}
      onKeyDown={
        isActivatable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      role={asButton ? "button" : undefined}
      tabIndex={isActivatable ? 0 : undefined}
      className={`flex min-h-[4.5rem] flex-col justify-center border-b border-neutral-100 px-4 py-3 transition-colors md:min-h-0 md:border-b-0 md:border-r md:border-neutral-100 md:px-6 md:py-4 ${
        interactive ? "cursor-pointer hover:bg-stone-50/90" : ""
      } ${className ?? "min-w-0 flex-1"}`}
      {...a11y}
    >
      <div className="flex items-center gap-2 text-brand">
        {icon}
        <label
          htmlFor={htmlFor}
          className="pointer-events-none font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-stone-500"
        >
          {label}
        </label>
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
});

function PinIcon() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 2a5 5 0 0 0-5 5c0 3.5 5 11 5 11s5-7.5 5-11a5 5 0 0 0-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M6 2v2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H8V2H6Zm10 8H4v8h12v-8Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6 8v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1h12Z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M8.5 3a5.5 5.5 0 1 0 3.45 9.82l4.38 4.38 1.06-1.06-4.38-4.38A5.48 5.48 0 0 0 8.5 3Zm0 2a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
    </svg>
  );
}
