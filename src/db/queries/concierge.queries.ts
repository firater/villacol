/**
 * Concierge curated matches via the shared villa listing engine.
 */
import { getVillaListing } from "@/db/queries/villas.queries";
import {
  budgetToPriceEuros,
  type ConciergeCriteria,
} from "@/lib/concierge-params";
import type { Locale } from "@/lib/locales";
import { toCents } from "@/lib/money";

const CONCIERGE_PREVIEW_SIZE = 6;

export type ConciergeMatchResult = Awaited<ReturnType<typeof getVillaListing>>;

export async function findConciergeMatches(
  locale: Locale,
  criteria: ConciergeCriteria,
): Promise<ConciergeMatchResult> {
  const { minPriceEuros, maxPriceEuros } = budgetToPriceEuros(criteria.budget);

  return getVillaListing({
    locale,
    page: 1,
    pageSize: CONCIERGE_PREVIEW_SIZE,
    sort: "default",
    locationSlug: criteria.locationSlug ?? undefined,
    categorySlug: criteria.categorySlug ?? undefined,
    guests: criteria.guests,
    minPriceCents:
      minPriceEuros !== undefined ? toCents(minPriceEuros) : undefined,
    maxPriceCents:
      maxPriceEuros !== undefined ? toCents(maxPriceEuros) : undefined,
  });
}