import type { VillaFilterFacets } from "@/db/queries/filter-facets.queries";
import type { Locale } from "@/lib/locales";

function catalogLine(
  label: string,
  rows: { value: string; label: string }[],
): string {
  if (rows.length === 0) return `${label}: (none)`;
  const items = rows.map((row) => `${row.value} (${row.label})`).join(", ");
  return `${label}: ${items}`;
}

export function buildAiSearchSystemPrompt(
  facets: VillaFilterFacets,
  locale: Locale,
): string {
  return [
    "You extract villa listing filters from natural-language search queries.",
    "Return ONLY a single JSON object with these optional fields:",
    '{"location": string|null, "category": string|null, "amenities": string[]|null, "guests": number|null, "bedrooms": number|null, "bathrooms": number|null}',
    "Rules:",
    "- Use ONLY exact slugs/keys from the catalogs below. If unsure, use null or [].",
    "- location and category are slugs (e.g. kalkan). amenities is an array of amenity keys (e.g. private_pool).",
    "- guests, bedrooms, bathrooms are positive integers when mentioned.",
    "- Do not invent slugs. No markdown, no explanation.",
    `Visitor locale: ${locale}.`,
    catalogLine("Location slugs", facets.locations),
    catalogLine("Category slugs", facets.categories),
    catalogLine("Amenity keys", facets.amenities),
  ].join("\n");
}