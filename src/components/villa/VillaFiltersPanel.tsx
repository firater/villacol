import { connection } from "next/server";

import { getVillaFilterFacets } from "@/db/queries/filter-facets.queries";
import { getBusinessToday } from "@/lib/dates";
import type { Locale } from "@/lib/locales";

import { VillaFilters } from "./VillaFilters";

type Props = {
  locale: Locale;
  lockOffersOnly?: boolean;
};

export async function VillaFiltersPanel({
  locale,
  lockOffersOnly = false,
}: Props) {
  await connection();
  const facets = await getVillaFilterFacets(locale);
  const listingPath = lockOffersOnly ? "/villa-offers" : "/villas";
  const minDate = getBusinessToday();
  return (
    <VillaFilters
      facets={facets}
      listingPath={listingPath}
      lockOffersOnly={lockOffersOnly}
      minDate={minDate}
    />
  );
}
