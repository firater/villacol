import type { VillaDetailBundle } from "@/db/queries/villas.queries";
import type { ExchangeRateMap } from "@/lib/currency";
import { convertCents, formatMoney } from "@/lib/currency";
import type { Currency, Locale } from "@/lib/locales";
import type { Cents } from "@/lib/money";

import { absoluteHomeUrl, absoluteLocalizedUrl } from "./urls";
import { getSiteOrigin, toAbsoluteUrl } from "./site-url";

const SCHEMA_CONTEXT = "https://schema.org";
const IN_STOCK = "https://schema.org/InStock";

export type JsonLdGraph = Record<string, unknown> & {
  "@context": typeof SCHEMA_CONTEXT;
};

export type VillaJsonLdInput = VillaDetailBundle & {
  pageUrl: string;
};

export type VillaListJsonLdItem = {
  name: string;
  slug: string;
};

function withContext<T extends Record<string, unknown>>(node: T): JsonLdGraph {
  return { "@context": SCHEMA_CONTEXT, ...node };
}

function nightlyOfferPrice(
  avgNightlyCents: Cents,
  currency: Currency,
  locale: Locale,
  rates: ExchangeRateMap,
): { price: string; priceCurrency: Currency } {
  const displayCents = convertCents(avgNightlyCents, currency, rates);
  const price = (displayCents / 100).toFixed(2);
  return { price, priceCurrency: currency };
}

export function generateVillaJsonLd(
  bundle: VillaJsonLdInput,
  locale: Locale,
  priceCache: VillaDetailBundle["priceCache"],
  currency: Currency,
  rates: ExchangeRateMap,
): JsonLdGraph {
  const { villa, images, amenities } = bundle;
  const description =
    villa.summary?.trim() ||
    villa.description?.trim() ||
    villa.title;

  const imageUrls = images
    .map((image) => toAbsoluteUrl(image.url))
    .filter((url) => url.length > 0);

  const node: Record<string, unknown> = {
    "@type": "VacationRental",
    "@id": bundle.pageUrl,
    url: bundle.pageUrl,
    name: villa.title,
    description,
    image: imageUrls.length > 0 ? imageUrls : undefined,
    numberOfRooms: villa.bedrooms,
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: villa.capacity,
    },
    amenityFeature: amenities.map((amenity) => ({
      "@type": "LocationFeatureSpecification",
      name: amenity.label,
      value: true,
    })),
  };

  if (villa.locationName !== null) {
    node.address = {
      "@type": "PostalAddress",
      addressLocality: villa.locationName,
      addressCountry: "TR",
    };
  }

  if (villa.latitude !== null && villa.longitude !== null) {
    node.geo = {
      "@type": "GeoCoordinates",
      latitude: villa.latitude,
      longitude: villa.longitude,
    };
  }

  if (priceCache !== null && priceCache.avgNightlyCents > 0) {
    const { price, priceCurrency } = nightlyOfferPrice(
      priceCache.avgNightlyCents,
      currency,
      locale,
      rates,
    );
    node.offers = {
      "@type": "Offer",
      price,
      priceCurrency,
      availability: IN_STOCK,
      url: bundle.pageUrl,
      priceValidUntil: priceCache.checkOut,
      description: formatMoney(
        convertCents(priceCache.avgNightlyCents, currency, rates),
        currency,
        locale,
      ),
    };
  }

  return withContext(node);
}

export function generateVillaListJsonLd(
  villas: VillaListJsonLdItem[],
  locale: Locale,
  listPath: "/villas" | "/villa-offers",
): JsonLdGraph {
  const listUrl = absoluteLocalizedUrl(locale, listPath);

  return withContext({
    "@type": "ItemList",
    url: listUrl,
    numberOfItems: villas.length,
    itemListElement: villas.map((villa, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteLocalizedUrl(locale, {
        pathname: "/villas/[slug]",
        params: { slug: villa.slug },
      }),
      name: villa.name,
    })),
  });
}

export function generateWebsiteJsonLd(locale: Locale): JsonLdGraph {
  const siteUrl = absoluteHomeUrl(locale);
  const searchTarget = absoluteLocalizedUrl(locale, "/villas").concat(
    "?location={search_term_string}",
  );

  return withContext({
    "@type": "WebSite",
    "@id": `${getSiteOrigin()}/#website`,
    url: siteUrl,
    name: "Villa Collection",
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: searchTarget,
      },
      "query-input": "required name=search_term_string",
    },
  });
}

/** Safe JSON serialization for `<script type="application/ld+json">`. */
export function serializeJsonLd(data: JsonLdGraph | JsonLdGraph[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
