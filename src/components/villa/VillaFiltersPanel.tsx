import { getVillaFilterFacets } from "@/db/queries/filter-facets.queries";
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
  const facets = await getVillaFilterFacets(locale);
  const listingPath = lockOffersOnly ? "/villa-offers" : "/villas";
  return (
    <VillaFilters
      facets={facets}
      listingPath={listingPath}
      lockOffersOnly={lockOffersOnly}
    />
  );
}
