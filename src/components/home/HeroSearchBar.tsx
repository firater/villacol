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
  type MouseEvent,
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
  selectedAmenities?: string[];
};

const VALUE_CLASS =
  "hero-search-value block w-full truncate font-serif text-xl font-normal tracking-tight";

function formatHeroDateRange(
  range: DateRange | undefined,
  locale: string,
  placeholder: string,
): string {
  if (!range?.from || !range.to) return placeholder;
  const fmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  return `${fmt.format(range.from)} – ${fmt.format(range.to)}`;
}

export function HeroSearchBar({
  locations,
  minDate,
  maxGuests,
  selectedAmenities = [],
}: Props) {
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
  const [locationOpen, setLocationOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [twoMonths, setTwoMonths] = useState(false);

  const barRef = useRef<HTMLDivElement>(null);
  const datesRef = useRef<HTMLDivElement>(null);
  const datesPopoverRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const locationMenuRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef<HTMLDivElement>(null);
  const guestsMenuRef = useRef<HTMLDivElement>(null);

  const minSelectable = useMemo(() => fromApiDate(minDate as DateString), [minDate]);
  const maxSelectable = useMemo(() => {
    const end = fromApiDate(minDate as DateString);
    end.setFullYear(end.getFullYear() + 2);
    return end;
  }, [minDate]);

  const locationLabel = useMemo(() => {
    if (location === "") return t("anyDestination");
    return locations.find((item) => item.value === location)?.label ?? location;
  }, [location, locations, t]);

  const guestCounts = useMemo(
    () => Array.from({ length: maxGuests }, (_, index) => index + 1),
    [maxGuests],
  );

  const guestsLabel = guests === "" ? t("anyGuests") : guests;

  const closeMenus = useCallback(() => {
    setDatesOpen(false);
    setLocationOpen(false);
    setGuestsOpen(false);
    setPickerRange(committedRange);
  }, [committedRange]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setTwoMonths(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const anyOpen = datesOpen || locationOpen || guestsOpen;
    if (!anyOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const inside =
        datesRef.current?.contains(target) ||
        datesPopoverRef.current?.contains(target) ||
        locationRef.current?.contains(target) ||
        locationMenuRef.current?.contains(target) ||
        guestsRef.current?.contains(target) ||
        guestsMenuRef.current?.contains(target);
      if (!inside) closeMenus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [closeMenus, datesOpen, guestsOpen, locationOpen]);

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
    setLocationOpen(false);
    setGuestsOpen(false);
    setPickerRange(committedRange);
    setDatesOpen(true);
  }, [committedRange]);

  const openLocationMenu = useCallback(() => {
    setDatesOpen(false);
    setGuestsOpen(false);
    setLocationOpen((open) => !open);
  }, []);

  const openGuestsMenu = useCallback(() => {
    setDatesOpen(false);
    setLocationOpen(false);
    setGuestsOpen((open) => !open);
  }, []);

  const datesLabel = formatHeroDateRange(committedRange, locale, t("addDates"));
  const hasDates = Boolean(committedRange?.from && committedRange.to);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const filters = parseVillaFilters({
      location: location === "" ? undefined : location,
      check_in: checkIn === "" ? undefined : checkIn,
      check_out: checkOut === "" ? undefined : checkOut,
      guests: guests === "" ? undefined : guests,
      amenities:
        selectedAmenities.length > 0 ? selectedAmenities : undefined,
    });
    const query = Object.fromEntries(buildVillaFilterQuery(filters).entries());

    if (Object.keys(query).length === 0) {
      router.push("/villas");
      return;
    }
    router.push({ pathname: "/villas", query });
  };

  const monthCount = twoMonths ? 2 : 1;
  const locationMenuId = `${fieldId}-location-menu`;
  const guestsMenuId = `${fieldId}-guests-menu`;

  return (
    <div ref={barRef} className="relative w-full">
      <form
        onSubmit={handleSubmit}
        aria-label={t("title")}
        className="hero-search-bar flex w-full flex-col gap-0 overflow-visible rounded-2xl border border-stone-300/90 bg-white md:flex-row md:items-stretch md:rounded-full md:p-2"
      >
        <Field
          ref={locationRef}
          label={t("destination")}
          htmlFor={`${fieldId}-location`}
          icon={<PinIcon />}
          interactive
          asButton
          onClick={openLocationMenu}
          aria-expanded={locationOpen}
          aria-haspopup="listbox"
          className="relative z-[210] min-w-0 flex-[1.35] rounded-t-2xl md:flex-[1.5] md:rounded-l-full md:rounded-tr-none"
        >
          <span
            id={`${fieldId}-location`}
            role="combobox"
            aria-controls={locationMenuId}
            aria-expanded={locationOpen}
            className={`${VALUE_CLASS} ${location === "" ? "text-stone-400" : "text-stone-900"}`}
          >
            {locationLabel}
          </span>
          {locationOpen ? (
            <div
              ref={locationMenuRef}
              id={locationMenuId}
              role="listbox"
              aria-labelledby={`${fieldId}-location`}
              className="absolute top-[calc(100%+0.35rem)] left-0 z-[220] max-h-64 min-w-[min(100%,16rem)] w-max max-w-[calc(100vw-3rem)] overflow-y-auto rounded-2xl border border-stone-200/90 bg-white py-2 shadow-2xl"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <HeroSearchMenuOption
                selected={location === ""}
                label={t("anyDestination")}
                onPick={() => {
                  setLocation("");
                  setLocationOpen(false);
                }}
              />
              {locations.map((option) => (
                <HeroSearchMenuOption
                  key={option.value}
                  selected={location === option.value}
                  label={option.label}
                  onPick={() => {
                    setLocation(option.value);
                    setLocationOpen(false);
                  }}
                />
              ))}
            </div>
          ) : null}
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
            className={`${VALUE_CLASS} ${hasDates ? "text-stone-900" : "text-stone-400"}`}
          >
            {datesLabel}
          </span>
        </Field>

        <Field
          ref={guestsRef}
          label={t("guests")}
          htmlFor={`${fieldId}-guests`}
          icon={<UserIcon />}
          interactive
          asButton
          onClick={openGuestsMenu}
          aria-expanded={guestsOpen}
          aria-haspopup="listbox"
          className="relative z-[210] min-w-0 flex-[0.95]"
        >
          <span
            id={`${fieldId}-guests`}
            role="combobox"
            aria-controls={guestsMenuId}
            aria-expanded={guestsOpen}
            className={`${VALUE_CLASS} ${guests === "" ? "text-stone-400" : "text-stone-900"}`}
          >
            {guestsLabel}
          </span>
          {guestsOpen ? (
            <div
              ref={guestsMenuRef}
              id={guestsMenuId}
              role="listbox"
              aria-labelledby={`${fieldId}-guests`}
              className="absolute top-[calc(100%+0.35rem)] left-0 z-[220] max-h-64 min-w-[min(100%,12rem)] overflow-y-auto rounded-2xl border border-stone-200/90 bg-white py-2 shadow-2xl"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <HeroSearchMenuOption
                selected={guests === ""}
                label={t("anyGuests")}
                onPick={() => {
                  setGuests("");
                  setGuestsOpen(false);
                }}
              />
              {guestCounts.map((count) => (
                <HeroSearchMenuOption
                  key={count}
                  selected={guests === String(count)}
                  label={String(count)}
                  onPick={() => {
                    setGuests(String(count));
                    setGuestsOpen(false);
                  }}
                />
              ))}
            </div>
          ) : null}
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
          ref={datesPopoverRef}
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

function HeroSearchMenuOption({
  label,
  selected,
  onPick,
}: {
  label: string;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={(event) => {
        event.stopPropagation();
        onPick();
      }}
      className={`w-full px-5 py-2.5 text-left font-serif text-lg tracking-tight transition-colors ${
        selected
          ? "bg-orange-50 text-stone-900"
          : "text-stone-800 hover:bg-stone-50"
      }`}
    >
      {label}
    </button>
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
    onClick?: (event: MouseEvent<HTMLDivElement>) => void;
    "aria-expanded"?: boolean;
    "aria-haspopup"?: "dialog" | "listbox" | boolean;
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
                onClick?.(event);
              }
            }
          : undefined
      }
      role={asButton ? "button" : undefined}
      tabIndex={isActivatable ? 0 : undefined}
      className={`flex min-h-[4.5rem] flex-col justify-center border-b border-stone-200/90 px-4 py-3 transition-colors md:min-h-0 md:border-b-0 md:border-r md:border-stone-200/90 md:px-6 md:py-4 ${
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
