import { connection } from "next/server";

import { getVillaFilterFacets } from "@/db/queries/filter-facets.queries";
import { getBusinessToday } from "@/lib/dates";
import type { Locale } from "@/lib/locales";

import { HeroSearchStack } from "./HeroSearchStack";

const MAX_GUESTS = 12;

type Props = {
  locale: Locale;
  layout: "desktop" | "mobile";
};

export async function HeroSearchGate({ locale, layout }: Props) {
  await connection();

  const facets = await getVillaFilterFacets(locale);

  return (
    <HeroSearchStack
      layout={layout}
      amenities={facets.amenities}
      locations={facets.locations}
      minDate={getBusinessToday()}
      maxGuests={MAX_GUESTS}
    />
  );
}
