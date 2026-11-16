import { z } from "zod";

import type { VillaFilters } from "@/lib/search-params";
import { buildVillaFilterQuery } from "@/lib/search-params";

export const CONCIERGE_BUDGET_IDS = [
  "any",
  "up_to_2500",
  "up_to_5000",
  "up_to_10000",
  "above_10000",
] as const;

export type ConciergeBudgetId = (typeof CONCIERGE_BUDGET_IDS)[number];

const BUDGET_EURO_LIMITS: Record<
  Exclude<ConciergeBudgetId, "any">,
  { minEuros?: number; maxEuros?: number }
> = {
  up_to_2500: { maxEuros: 2500 },
  up_to_5000: { maxEuros: 5000 },
  up_to_10000: { maxEuros: 10000 },
  above_10000: { minEuros: 10_000 },
};

export type ConciergeCriteria = {
  locationSlug: string | null;
  categorySlug: string | null;
  nights: number;
  guests: number;
  budget: ConciergeBudgetId;
};

const positiveInt = z.coerce.number().int().min(1).max(100);

export const conciergeResultsSearchSchema = z.object({
  location: z.string().trim().min(1).max(160).optional().catch(undefined),
  category: z.string().trim().min(1).max(160).optional().catch(undefined),
  nights: positiveInt.max(90).optional().catch(undefined),
  guests: positiveInt.max(50).optional().catch(undefined),
  budget: z.enum(CONCIERGE_BUDGET_IDS).optional().catch(undefined),
});

export type ConciergeResultsSearch = z.infer<typeof conciergeResultsSearchSchema>;

export function parseConciergeResultsSearch(
  input: Record<string, string | string[] | undefined>,
): ConciergeCriteria {
  const raw = {
    location: readOne(input.location),
    category: readOne(input.category),
    nights: readOne(input.nights),
    guests: readOne(input.guests),
    budget: readOne(input.budget),
  };

  const parsed = conciergeResultsSearchSchema.safeParse(raw);
  const data = parsed.success ? parsed.data : {};

  return {
    locationSlug: data.location ?? null,
    categorySlug: data.category ?? null,
    nights: data.nights ?? 7,
    guests: data.guests ?? 2,
    budget: data.budget ?? "any",
  };
}

function readOne(
  value: string | string[] | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export function budgetToPriceEuros(
  budget: ConciergeBudgetId,
): { minPriceEuros?: number; maxPriceEuros?: number } {
  if (budget === "any") return {};
  const limits = BUDGET_EURO_LIMITS[budget];
  return {
    minPriceEuros: limits.minEuros,
    maxPriceEuros: limits.maxEuros,
  };
}

/** Maps concierge answers to the main listing query contract (`?guests=` etc.). */
export function conciergeCriteriaToVillaFilters(
  criteria: ConciergeCriteria,
): VillaFilters {
  const { minPriceEuros, maxPriceEuros } = budgetToPriceEuros(criteria.budget);

  return {
    guests: criteria.guests,
    minPrice: minPriceEuros,
    maxPrice: maxPriceEuros,
    location: criteria.locationSlug ?? undefined,
    category: criteria.categorySlug ?? undefined,
  };
}

export function buildConciergeResultsQuery(
  criteria: ConciergeCriteria,
): Record<string, string> {
  const query: Record<string, string> = {
    nights: String(criteria.nights),
    guests: String(criteria.guests),
    budget: criteria.budget,
  };
  if (criteria.locationSlug) query.location = criteria.locationSlug;
  if (criteria.categorySlug) query.category = criteria.categorySlug;
  return query;
}

export function buildConciergeListingHrefQuery(
  criteria: ConciergeCriteria,
): Record<string, string> {
  const params = buildVillaFilterQuery(conciergeCriteriaToVillaFilters(criteria));
  return Object.fromEntries(params.entries());
}