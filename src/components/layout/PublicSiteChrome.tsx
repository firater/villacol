import { headers } from "next/headers";
import { Suspense } from "react";

import { isAdminPathname } from "@/lib/admin-route";
import type { Locale } from "@/lib/locales";

import { listCategoryNavLinks } from "@/db/queries/categories.queries";
import { listLocationNavLinks } from "@/db/queries/locations.queries";

import { Footer } from "./Footer";
import { HeaderFallback } from "./HeaderFallback";
import { HeaderWithPreferences } from "./HeaderWithPreferences";
import { TopAnnouncementBar } from "./TopAnnouncementBar";

async function shouldRenderPublicChrome(): Promise<boolean> {
  const pathname = (await headers()).get("x-pathname") ?? "";
  return !isAdminPathname(pathname);
}

type Props = {
  locale: Locale;
};

/** Announcement + header; omitted on admin routes (server-side, not only client). */
export async function PublicSiteHeader({ locale }: Props) {
  if (!(await shouldRenderPublicChrome())) {
    return null;
  }

  return (
    <>
      <TopAnnouncementBar />
      <Suspense fallback={<HeaderFallback />}>
        <HeaderWithPreferences locale={locale} />
      </Suspense>
    </>
  );
}

export async function PublicSiteFooter({ locale }: Props) {
  if (!(await shouldRenderPublicChrome())) {
    return null;
  }

  const [destinations, featuredCategories] = await Promise.all([
    listLocationNavLinks(locale),
    listCategoryNavLinks(locale),
  ]);

  return (
    <Footer destinations={destinations} featuredCategories={featuredCategories} />
  );
}
