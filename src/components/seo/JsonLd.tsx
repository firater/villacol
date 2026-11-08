import type { JsonLdGraph } from "@/lib/seo/json-ld";
import { serializeJsonLd } from "@/lib/seo/json-ld";

type Props = {
  data: JsonLdGraph | JsonLdGraph[];
};

/** Server-rendered structured data for crawlers (initial HTML payload). */
export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
