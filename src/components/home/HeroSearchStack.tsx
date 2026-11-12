"use client";

import { useCallback, useState } from "react";

import type { FilterFacetOption } from "@/db/queries/filter-facets.queries";

import { HeroAmenityPills } from "./HeroAmenityPills";
import { HeroSearchBar } from "./HeroSearchBar";

type Props = {
  layout: "desktop" | "mobile";
  amenities: FilterFacetOption[];
  locations: FilterFacetOption[];
  minDate: string;
  maxGuests: number;
};

export function HeroSearchStack({
  layout,
  amenities,
  locations,
  minDate,
  maxGuests,
}: Props) {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const toggleAmenity = useCallback((value: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  }, []);

  const pills = (
    <HeroAmenityPills
      amenities={amenities}
      selected={selectedAmenities}
      onToggle={toggleAmenity}
    />
  );

  return (
    <div className="space-y-3">
      {layout === "desktop" ? <div className="mb-3">{pills}</div> : null}
      <HeroSearchBar
        locations={locations}
        minDate={minDate}
        maxGuests={maxGuests}
        selectedAmenities={selectedAmenities}
      />
      {layout === "mobile" ? pills : null}
    </div>
  );
}
