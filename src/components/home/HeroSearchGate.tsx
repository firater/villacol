import { connection } from "next/server";

import { getVillaFilterFacets } from "@/db/queries/filter-facets.queries";
import { getBusinessToday } from "@/lib/dates";
import type { Locale } from "@/lib/locales";

import { HeroAmenityPills } from "./HeroAmenityPills";
import { HeroSearchBar } from "./HeroSearchBar";

const MAX_GUESTS = 12;

type Props = {
  locale: Locale;
  layout: "desktop" | "mobile";
};

export async function HeroSearchGate({ locale, layout }: Props) {
  await connection();

  const facets = await getVillaFilterFacets(locale);

  return (
    <div className="space-y-3">
      {layout === "desktop" ? (
        <div className="mb-3">
          <HeroAmenityPills amenities={facets.amenities} />
        </div>
      ) : null}
      <HeroSearchBar
        locations={facets.locations}
        minDate={getBusinessToday()}
        maxGuests={MAX_GUESTS}
      />
      {layout === "mobile" ? (
        <HeroAmenityPills amenities={facets.amenities} />
      ) : null}
    </div>
  );
}
