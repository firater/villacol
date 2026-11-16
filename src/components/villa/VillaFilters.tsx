"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";

import type { VillaFilterFacets } from "@/db/queries/filter-facets.queries";
import { useRouter } from "@/i18n/navigation";
import type { DateString } from "@/lib/dates";
import {
  buildVillaFilterQuery,
  hasActiveFilters,
  normalizeVillaFilters,
  parseVillaFilters,
  type VillaFilters,
} from "@/lib/search-params";

import { VillaListingDateFilter } from "./VillaListingDateFilter";

type ListingPath = "/villas" | "/villa-offers";

type Props = {
  facets: VillaFilterFacets;
  listingPath: ListingPath;
  /** When true, `offers_only` stays on and the toggle is hidden. */
  lockOffersOnly?: boolean;
  minDate: DateString;
};

export function VillaFilters({
  facets,
  listingPath,
  lockOffersOnly = false,
  minDate,
}: Props) {
  const t = useTranslations("filters");
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseVillaFilters(searchParams),
    [searchParams],
  );

  const pushFilters = useCallback(
    (next: VillaFilters) => {
      const normalized = normalizeVillaFilters({
        ...next,
        offersOnly: lockOffersOnly ? true : next.offersOnly,
        page: undefined,
      });
      const query = Object.fromEntries(
        buildVillaFilterQuery(normalized).entries(),
      );
      if (Object.keys(query).length === 0) {
        router.push(listingPath);
      } else {
        router.push({ pathname: listingPath, query });
      }
    },
    [listingPath, lockOffersOnly, router],
  );

  const commitStayDates = useCallback(
    (checkIn: DateString | undefined, checkOut: DateString | undefined) => {
      pushFilters({
        ...filters,
        checkIn,
        checkOut,
      });
    },
    [filters, pushFilters],
  );

  const clearAll = useCallback(() => {
    router.push(listingPath);
  }, [listingPath, router]);

  const amenitySet = useMemo(
    () => new Set(filters.amenities ?? []),
    [filters.amenities],
  );

  const toggleAmenity = (key: string) => {
    const current = filters.amenities ?? [];
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    pushFilters({
      ...filters,
      amenities: next.length > 0 ? next : undefined,
    });
  };

  const showClear = hasActiveFilters(
    lockOffersOnly ? { ...filters, offersOnly: true } : filters,
  );

  return (
    <aside className="relative z-40 w-full shrink-0 overflow-visible rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 lg:w-72 lg:self-start">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-100">
          {t("heading")}
        </h2>
        {showClear ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-200"
          >
            {t("clearAll")}
          </button>
        ) : null}
      </div>

      <div className="mt-6 space-y-5">
        <VillaListingDateFilter
          filters={filters}
          minDate={minDate}
          onCommitStay={commitStayDates}
        />

        <label className="block">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {t("labels.location")}
          </span>
          <select
            className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            value={filters.location ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              pushFilters({
                ...filters,
                location: value.length > 0 ? value : undefined,
              });
            }}
          >
            <option value="">{t("placeholders.anyLocation")}</option>
            {facets.locations.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {t("labels.category")}
          </span>
          <select
            className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            value={filters.category ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              pushFilters({
                ...filters,
                category: value.length > 0 ? value : undefined,
              });
            }}
          >
            <option value="">{t("placeholders.anyCategory")}</option>
            {facets.categories.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {t("labels.min_price")}
            </span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              defaultValue={filters.minPrice ?? ""}
              key={`min-${filters.minPrice ?? "x"}`}
              onBlur={(e) => {
                const raw = e.target.value.trim();
                const value =
                  raw.length > 0 ? Number.parseInt(raw, 10) : undefined;
                if (value === filters.minPrice) return;
                pushFilters({
                  ...filters,
                  minPrice: Number.isFinite(value) ? value : undefined,
                });
              }}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {t("labels.max_price")}
            </span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              defaultValue={filters.maxPrice ?? ""}
              key={`max-${filters.maxPrice ?? "x"}`}
              onBlur={(e) => {
                const raw = e.target.value.trim();
                const value =
                  raw.length > 0 ? Number.parseInt(raw, 10) : undefined;
                if (value === filters.maxPrice) return;
                pushFilters({
                  ...filters,
                  maxPrice: Number.isFinite(value) ? value : undefined,
                });
              }}
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {t("labels.guests")}
          </span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            defaultValue={filters.guests ?? ""}
            key={`guests-${filters.guests ?? "x"}`}
            onBlur={(e) => {
              const raw = e.target.value.trim();
              const value =
                raw.length > 0 ? Number.parseInt(raw, 10) : undefined;
              if (value === filters.guests) return;
              pushFilters({
                ...filters,
                guests: Number.isFinite(value) ? value : undefined,
              });
            }}
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {t("labels.bedrooms")}
          </span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            defaultValue={filters.bedrooms ?? ""}
            key={`bedrooms-${filters.bedrooms ?? "x"}`}
            onBlur={(e) => {
              const raw = e.target.value.trim();
              const value =
                raw.length > 0 ? Number.parseInt(raw, 10) : undefined;
              if (value === filters.bedrooms) return;
              pushFilters({
                ...filters,
                bedrooms: Number.isFinite(value) ? value : undefined,
              });
            }}
          />
        </label>

        {!lockOffersOnly ? (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200/90 bg-amber-50/70 px-3.5 py-3 transition-colors hover:bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/25 dark:hover:bg-amber-950/40">
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 rounded border-amber-300 text-amber-700 focus:ring-amber-500/30 dark:border-amber-700 dark:text-amber-400"
              checked={filters.offersOnly === true}
              onChange={(e) => {
                pushFilters({
                  ...filters,
                  offersOnly: e.target.checked ? true : undefined,
                });
              }}
            />
            <span className="text-sm font-semibold leading-snug text-amber-950 dark:text-amber-100">
              {t("labels.offers_only")}
            </span>
          </label>
        ) : null}

        {facets.amenities.length > 0 ? (
          <fieldset>
            <legend className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {t("labels.amenities")}
            </legend>
            <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
              {facets.amenities.map((opt) => (
                <li key={opt.value}>
                  <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded border-zinc-300"
                      checked={amenitySet.has(opt.value)}
                      onChange={() => toggleAmenity(opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ) : null}
      </div>
    </aside>
  );
}
