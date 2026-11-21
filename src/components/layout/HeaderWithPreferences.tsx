import { Suspense } from "react";

import { getVillaFilterFacets } from "@/db/queries/filter-facets.queries";
import { listLocationNavLinks } from "@/db/queries/locations.queries";
import type { Locale } from "@/lib/locales";
import { resolvePreferences } from "@/lib/preferences";

import { Header } from "./Header";
import { NotificationBellFallback } from "./NotificationBellFallback";
import { NotificationBellGate } from "./NotificationBellGate";

type Props = {
  locale: Locale;
};

/**
 * Reads `villa_currency` from cookies. Kept separate from the root layout so the
 * shell can prerender: `cookies()` inside a suspended subtree does not block the
 * rest of the tree the way calling it in the layout body does.
 */
export async function HeaderWithPreferences({ locale }: Props) {
  const [preferences, facets, featuredLocations] = await Promise.all([
    resolvePreferences(),
    getVillaFilterFacets(locale),
    listLocationNavLinks(locale),
  ]);

  return (
    <Header
      locale={locale}
      currency={preferences.currency}
      categories={facets.categories.slice(0, 4)}
      featuredLocations={featuredLocations.slice(0, 4)}
      notificationsSlot={
        <Suspense fallback={<NotificationBellFallback />}>
          <NotificationBellGate />
        </Suspense>
      }
    />
  );
}
