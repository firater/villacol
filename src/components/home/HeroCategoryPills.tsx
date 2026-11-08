import { Link } from "@/i18n/navigation";
import type { FilterFacetOption } from "@/db/queries/filter-facets.queries";

type Props = {
  categories: FilterFacetOption[];
};

/**
 * Quick category filters above the hero search — same slugs as listing `?category=`.
 */
export function HeroCategoryPills({ categories }: Props) {
  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="Categories"
      className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto pb-1"
    >
      {categories.map((category) => (
        <Link
          key={category.value}
          href={{
            pathname: "/villas",
            query: { category: category.value },
          }}
          className="shrink-0 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition hover:border-brand/40 hover:text-brand"
        >
          {category.label}
        </Link>
      ))}
    </nav>
  );
}
