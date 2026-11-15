/** Derive a filter `key` slug from an English label (create-only fallback). */
export function labelToTaxonomyKey(label: string): string {
  const s = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.length > 0 ? s : "item";
}