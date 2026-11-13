import type { Locale } from "@/lib/locales";

import { SITE_NAME } from "./site-metadata";
import { buildKalkanPostalAddress } from "./schema-address";
import type { JsonLdGraph } from "./json-ld";
import { absoluteHomeUrl, absoluteLocalizedUrl } from "./urls";
import { getSiteOrigin, toAbsoluteUrl } from "./site-url";

const SCHEMA = "https://schema.org";

const CONTACT_EMAIL = "concierge@villacollection.com";
const CONTACT_PHONE = "+90 555 123 4567";
const PRICE_RANGE = "€€€";
const BRAND_ADDRESS = buildKalkanPostalAddress("Kalkan");

/** Placeholder social profiles — replace when marketing URLs are final. */
const SAME_AS = [
  "https://www.instagram.com/villacollection",
  "https://www.facebook.com/villacollection",
] as const;

export function generateSiteRootJsonLd(locale: Locale): JsonLdGraph {
  const origin = getSiteOrigin();
  const homeUrl = absoluteHomeUrl(locale);
  const organizationId = `${origin}/#organization`;
  const websiteId = `${origin}/#website`;
  const agencyId = `${origin}/#travel-agency`;

  const searchTemplate = `${absoluteLocalizedUrl(locale, "/villas")}?q={search_term_string}`;

  return {
    "@context": SCHEMA,
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE_NAME,
        url: homeUrl,
        telephone: CONTACT_PHONE,
        priceRange: PRICE_RANGE,
        address: BRAND_ADDRESS,
        logo: {
          "@type": "ImageObject",
          url: toAbsoluteUrl("/best.png"),
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: CONTACT_EMAIL,
            telephone: CONTACT_PHONE,
            availableLanguage: ["English", "German", "Russian"],
            areaServed: "TR",
          },
        ],
        sameAs: [...SAME_AS],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: homeUrl,
        name: SITE_NAME,
        inLanguage: locale,
        publisher: { "@id": organizationId },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: searchTemplate,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "TravelAgency",
        "@id": agencyId,
        name: SITE_NAME,
        url: homeUrl,
        image: toAbsoluteUrl("/best.png"),
        telephone: CONTACT_PHONE,
        priceRange: PRICE_RANGE,
        address: BRAND_ADDRESS,
        areaServed: [
          { "@type": "Place", name: "Kalkan" },
          { "@type": "Place", name: "Kaş" },
          { "@type": "Place", name: "İslamlar" },
        ],
        knowsAbout: [
          "Luxury Villas",
          "Private Pools",
          "Mediterranean Holidays",
          "Kalkan Villa Rentals",
          "Direct Booking",
        ],
        parentOrganization: { "@id": organizationId },
      },
    ],
  };
}
