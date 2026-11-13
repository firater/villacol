import { JsonLd } from "@/components/seo/JsonLd";
import {
  getBestValueLandingVillas,
  getFeaturedLandingVillas,
  getOfferLandingVillas,
} from "@/db/queries/landing.queries";
import type { Locale } from "@/lib/locales";
import {
  generateHomeVillaListJsonLd,
  type VillaListJsonLdItem,
} from "@/lib/seo/json-ld";

const HOME_RAIL_SIZE = 6;

type Props = {
  locale: Locale;
};

/**
 * Single homepage ItemList: merges visible villas from promo, featured, and
 * best-value rails without emitting per-card Product schemas.
 */
export async function HomePageVillaItemListJsonLd({ locale }: Props) {
  const [offers, featured, bestValue] = await Promise.all([
    getOfferLandingVillas(locale, HOME_RAIL_SIZE),
    getFeaturedLandingVillas(locale, HOME_RAIL_SIZE),
    getBestValueLandingVillas(locale, HOME_RAIL_SIZE),
  ]);

  const seen = new Set<string>();
  const items: VillaListJsonLdItem[] = [];

  for (const row of [...offers.rows, ...featured.rows, ...bestValue.rows]) {
    if (seen.has(row.slug)) {
      continue;
    }
    seen.add(row.slug);
    items.push({ name: row.title, slug: row.slug });
  }

  if (items.length === 0) {
    return null;
  }

  return <JsonLd data={generateHomeVillaListJsonLd(items, locale)} />;
}
