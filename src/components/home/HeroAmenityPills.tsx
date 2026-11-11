import { getTranslations } from "next-intl/server";
import type { FilterFacetOption } from "@/db/queries/filter-facets.queries";
import { Link } from "@/i18n/navigation";

const MAX_PILLS = 4;

type Props = {
  amenities: FilterFacetOption[];
};

/** Quick amenity filters — same keys as listing `?amenities=`. */
export async function HeroAmenityPills({ amenities }: Props) {
  const t = await getTranslations("layout.home.amenityPills");
  const pills = amenities.slice(0, MAX_PILLS);
  if (pills.length === 0) return null;

  return (
    <nav aria-label={t("aria")} className="w-full">
      <div className="flex flex-wrap items-center gap-3">
        {pills.map((item, index) => (
          <Link
            key={item.value}
            href={{
              pathname: "/villas",
              query: { amenities: item.value },
            }}
            className={`flex items-center gap-2 border px-4 py-2 text-xs font-medium transition-all ${
              index === 0
                ? "border-brand bg-brand text-white shadow-md shadow-orange-200"
                : "border-neutral-200 bg-white text-neutral-600"
            }`}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/villas"
          className="relative flex items-center gap-2 border border-transparent bg-neutral-100 px-4 py-2"
        >
          <span className="text-xs font-bold text-neutral-700">{t("more")}</span>
        </Link>
      </div>
    </nav>
  );
}
