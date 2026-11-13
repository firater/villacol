import type { PublishedGuestReviewRow } from "@/db/queries/guest-reviews.queries";
import type { VillaDetailBundle } from "@/db/queries/villas.queries";
import type { ExchangeRateMap } from "@/lib/currency";
import { convertCents } from "@/lib/currency";
import type { Currency, Locale } from "@/lib/locales";
import type { Cents } from "@/lib/money";

import { buildKalkanPostalAddress } from "./schema-address";
import { absoluteHomeUrl, absoluteLocalizedUrl } from "./urls";
import { getSiteOrigin, toAbsoluteUrl } from "./site-url";

const SCHEMA_CONTEXT = "https://schema.org";
const IN_STOCK = "https://schema.org/InStock";
const LIST_PRICE = "https://schema.org/ListPrice";
const SALE_PRICE = "https://schema.org/SalePrice";

const GUEST_REVIEW_BEST_RATING = 5;
const GUEST_REVIEW_WORST_RATING = 1;
const JSON_LD_REVIEW_LIMIT = 3;
const JSON_LD_MAX_IMAGES = 8;
const VILLA_ADDITIONAL_TYPE = "HolidayVillageRental";

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

function formatOfferPrice(
  cents: Cents,
  currency: Currency,
  rates: ExchangeRateMap,
): { price: string; priceCurrency: Currency } {
  const displayCents = convertCents(cents, currency, rates);
  const price = (displayCents / 100).toFixed(2);
  return { price, priceCurrency: currency };
}

type VillaDetailPriceCache = NonNullable<VillaDetailBundle["priceCache"]>;

function buildStayOffer(
  priceCache: VillaDetailPriceCache,
  pageUrl: string,
  currency: Currency,
  rates: ExchangeRateMap,
): Record<string, unknown> {
  const discounted = formatOfferPrice(
    priceCache.discountedTotalCents,
    currency,
    rates,
  );

  const offer: Record<string, unknown> = {
    "@type": "Offer",
    price: discounted.price,
    priceCurrency: discounted.priceCurrency,
    availability: IN_STOCK,
    url: pageUrl,
    priceValidUntil: priceCache.checkOut,
    validFrom: priceCache.checkIn,
  };

  const referenceQuantity = {
    "@type": "QuantitativeValue",
    value: priceCache.nightCount,
    unitCode: "DAY",
  };

  const showStrikethrough =
    priceCache.hasActiveDiscount &&
    priceCache.baseTotalCents > priceCache.discountedTotalCents;

  if (showStrikethrough) {
    const list = formatOfferPrice(priceCache.baseTotalCents, currency, rates);
    offer.priceSpecification = {
      "@type": "CompoundPriceSpecification",
      priceCurrency: discounted.priceCurrency,
      price: discounted.price,
      priceComponent: [
        {
          "@type": "UnitPriceSpecification",
          price: list.price,
          priceCurrency: list.priceCurrency,
          priceType: LIST_PRICE,
          referenceQuantity,
        },
        {
          "@type": "UnitPriceSpecification",
          price: discounted.price,
          priceCurrency: discounted.priceCurrency,
          priceType: SALE_PRICE,
          referenceQuantity,
        },
      ],
    };
  } else {
    offer.priceSpecification = {
      "@type": "UnitPriceSpecification",
      price: discounted.price,
      priceCurrency: discounted.priceCurrency,
      referenceQuantity,
    };
  }

  return offer;
}

function roundRatingValue(value: number): number {
  return Math.round(value * 10) / 10;
}

function buildGuestReviewSchema(
  guestReviews: PublishedGuestReviewRow[],
): Record<string, unknown> {
  if (guestReviews.length === 0) {
    return {};
  }

  const total = guestReviews.reduce((sum, review) => sum + review.rating, 0);
  const average = roundRatingValue(total / guestReviews.length);

  const latestReviews = guestReviews.slice(0, JSON_LD_REVIEW_LIMIT);

  return {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: average,
      reviewCount: guestReviews.length,
      bestRating: GUEST_REVIEW_BEST_RATING,
      worstRating: GUEST_REVIEW_WORST_RATING,
    },
    review: latestReviews.map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.guestName,
      },
      datePublished: review.publishedAt ?? review.stayCheckOut,
      reviewBody: review.reviewText,
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: GUEST_REVIEW_BEST_RATING,
        worstRating: GUEST_REVIEW_WORST_RATING,
      },
    })),
  };
}

export function generateVillaJsonLd(
  bundle: VillaJsonLdInput,
  locale: Locale,
  priceCache: VillaDetailBundle["priceCache"],
  currency: Currency,
  rates: ExchangeRateMap,
  guestReviews: PublishedGuestReviewRow[],
): JsonLdGraph {
  const { villa, images, amenities } = bundle;
  const description =
    villa.summary?.trim() ||
    villa.description?.trim() ||
    villa.title;

  const sortedImages = [...images].sort((a, b) => {
    if (a.isMain !== b.isMain) {
      return a.isMain ? -1 : 1;
    }
    return a.orderValue - b.orderValue;
  });
  const imageUrls = sortedImages
    .map((image) => toAbsoluteUrl(image.url))
    .filter((url) => url.length > 0)
    .slice(0, JSON_LD_MAX_IMAGES);

  const identifierValue =
    villa.refCode.trim().length > 0 ? villa.refCode : String(villa.id);

  const node: Record<string, unknown> = {
    "@type": "VacationRental",
    "@id": bundle.pageUrl,
    url: bundle.pageUrl,
    name: villa.title,
    description,
    additionalType: VILLA_ADDITIONAL_TYPE,
    identifier: identifierValue,
    image: imageUrls.length > 0 ? imageUrls : undefined,
    numberOfRooms: villa.bedrooms,
    containsPlace: {
      "@type": "Accommodation",
      additionalType: "EntirePlace",
      numberOfBedrooms: villa.bedrooms,
      numberOfBathroomsTotal: villa.bathrooms,
      bed: {
        "@type": "BedDetails",
        numberOfBeds: villa.bedrooms,
      },
      amenityFeature: amenities.map((amenity) => ({
        "@type": "LocationFeatureSpecification",
        name: amenity.label,
        value: true,
      })),
      occupancy: {
        "@type": "QuantitativeValue",
        value: villa.capacity,
        maxValue: villa.capacity,
      },
    },
    occupancy: {
      "@type": "QuantitativeValue",
      value: villa.capacity,
      maxValue: villa.capacity,
    },
    ...buildGuestReviewSchema(guestReviews),
  };

  node.address = buildKalkanPostalAddress(villa.locationName ?? "Kalkan");

  if (villa.latitude !== null && villa.longitude !== null) {
    node.geo = {
      "@type": "GeoCoordinates",
      latitude: villa.latitude,
      longitude: villa.longitude,
    };
  }

  if (priceCache !== null && priceCache.discountedTotalCents > 0) {
    node.offers = buildStayOffer(priceCache, bundle.pageUrl, currency, rates);
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

/** Homepage: one ItemList for all villas shown across rails (deduped by slug). */
export function generateHomeVillaListJsonLd(
  villas: VillaListJsonLdItem[],
  locale: Locale,
): JsonLdGraph {
  const listUrl = absoluteHomeUrl(locale);

  return withContext({
    "@type": "ItemList",
    "@id": `${getSiteOrigin()}/#home-villa-itemlist`,
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
