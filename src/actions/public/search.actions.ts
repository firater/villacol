"use server";

import { z } from "zod";

import {
  getSearchSynonyms,
  searchVillaDocuments,
} from "@/db/queries/search.queries";
import {
  getVillaListing,
  type VillaCardRow,
  type VillaListingFilters,
} from "@/db/queries/villas.queries";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { resolvePreferences } from "@/lib/preferences";
import { parseSearchIntent, type IntentFilters } from "@/lib/search/intent";
import { centsSchema, localeSchema } from "@/lib/validation";

/**
 * How many ranked document hits are fetched before filters are applied.
 *
 * Generous on purpose: relevance and the structured filters are independent, so
 * a narrow candidate set would hide matches that rank 30th but are the only
 * ones with 4 bedrooms.
 */
const SEARCH_CANDIDATE_LIMIT = 50;

/**
 * Filters the caller already knows, using the universal English keys from the
 * Phase 8 URL contract. These win over anything the intent parser infers: an
 * explicit `?guests=4` is a user decision, intent is a guess.
 */
const filtersSchema = z
  .object({
    offersOnly: z.boolean().optional(),
    location: z.string().trim().min(1).max(160).optional(),
    category: z.string().trim().min(1).max(160).optional(),
    amenities: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
    features: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
    guests: z.number().int().min(1).max(100).optional(),
    bedrooms: z.number().int().min(0).max(50).optional(),
    bathrooms: z.number().int().min(0).max(50).optional(),
    minPriceCents: centsSchema.optional(),
    maxPriceCents: centsSchema.optional(),
    sort: z
      .enum(["default", "price_asc", "price_desc", "bedrooms_desc", "relevance"])
      .optional(),
    page: z.number().int().min(1).max(500).optional(),
    pageSize: z.number().int().min(1).max(48).optional(),
  })
  .default({});

const searchSchema = z.object({
  query: z.string().trim().max(200).default(""),
  locale: localeSchema.optional(),
  filters: filtersSchema,
});

export type SearchVillasResult = {
  rows: VillaCardRow[];
  total: number;
  /** What the parser pulled out of the free text, for "did you mean" chips. */
  intentFilters: IntentFilters;
  /** The text left after intent extraction; what was actually full-text matched. */
  residualQuery: string;
  /** True when ordering came from relevance rather than the catalogue order. */
  rankedByRelevance: boolean;
};

export async function searchVillas(
  input: z.input<typeof searchSchema>,
): Promise<ActionResult<SearchVillasResult>> {
  try {
    const parsed = searchSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const preferences = await resolvePreferences();
    const locale = parsed.data.locale ?? preferences.locale;
    const explicit = parsed.data.filters;

    const synonyms = await getSearchSynonyms(locale);
    const intent = parseSearchIntent(parsed.data.query, locale, synonyms);

    // Relevance ranking is only available when there is text left to rank by.
    const hits =
      intent.residualQuery.length > 0
        ? await searchVillaDocuments({
            query: intent.residualQuery,
            locale,
            limit: SEARCH_CANDIDATE_LIMIT,
          })
        : [];

    const hasTextMatch = intent.residualQuery.length > 0;

    // A query with residual text that matched nothing is an empty result, not
    // an unfiltered catalogue dump.
    if (hasTextMatch && hits.length === 0) {
      return ok({
        rows: [],
        total: 0,
        intentFilters: intent.filters,
        residualQuery: intent.residualQuery,
        rankedByRelevance: false,
      });
    }

    const listingFilters: VillaListingFilters = {
      locale,
      villaIds: hasTextMatch ? hits.map((hit) => hit.villaId) : undefined,
      offersOnly: explicit.offersOnly,
      locationSlug: explicit.location ?? intent.filters.location,
      categorySlug: explicit.category ?? intent.filters.category,
      amenityKeys: explicit.amenities ?? intent.filters.amenities,
      featureKeys: explicit.features,
      guests: explicit.guests ?? intent.filters.guests,
      bedrooms: explicit.bedrooms ?? intent.filters.bedrooms,
      bathrooms: explicit.bathrooms ?? intent.filters.bathrooms,
      minPriceCents: explicit.minPriceCents,
      maxPriceCents: explicit.maxPriceCents,
      sort: explicit.sort ?? (hasTextMatch ? "relevance" : "default"),
      page: explicit.page,
      pageSize: explicit.pageSize,
    };

    const listing = await getVillaListing(listingFilters);

    return ok({
      rows: listing.rows,
      total: listing.total,
      intentFilters: intent.filters,
      residualQuery: intent.residualQuery,
      rankedByRelevance: listingFilters.sort === "relevance",
    });
  } catch (error) {
    return toActionError(error);
  }
}

const suggestSchema = z.object({
  query: z.string().trim().min(2).max(200),
  locale: localeSchema.optional(),
  limit: z.number().int().min(1).max(10).optional(),
});

/**
 * Typeahead: the same ranking as `searchVillas` but without the listing join,
 * so the dropdown does not pay for `villa_price_cache` and image lookups.
 */
export async function suggestVillas(
  input: z.input<typeof suggestSchema>,
): Promise<
  ActionResult<{
    villaIds: number[];
    intentFilters: IntentFilters;
    residualQuery: string;
  }>
> {
  try {
    const parsed = suggestSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const preferences = await resolvePreferences();
    const locale = parsed.data.locale ?? preferences.locale;

    const synonyms = await getSearchSynonyms(locale);
    const intent = parseSearchIntent(parsed.data.query, locale, synonyms);

    const hits =
      intent.residualQuery.length > 0
        ? await searchVillaDocuments({
            query: intent.residualQuery,
            locale,
            limit: parsed.data.limit ?? 8,
          })
        : [];

    return ok({
      villaIds: hits.map((hit) => hit.villaId),
      intentFilters: intent.filters,
      residualQuery: intent.residualQuery,
    });
  } catch (error) {
    return toActionError(error);
  }
}
