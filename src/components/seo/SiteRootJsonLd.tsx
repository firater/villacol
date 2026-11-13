import { JsonLd } from "@/components/seo/JsonLd";
import type { Locale } from "@/lib/locales";
import { generateSiteRootJsonLd } from "@/lib/seo/site-root-json-ld";

type Props = {
  locale: Locale;
};

/** Site-wide @graph: Organization, WebSite, TravelAgency — one script per locale shell. */
export function SiteRootJsonLd({ locale }: Props) {
  return <JsonLd data={generateSiteRootJsonLd(locale)} />;
}
