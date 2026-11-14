import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";

import { dbPool } from "@/db/pool";
import { villaTranslations } from "@/db/schema";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/locales";

/** Invalidate admin bookings and villa detail caches after a payment confirms. */
export async function revalidateBookingPaymentViews(
  villaId: number,
): Promise<void> {
  updateTag("villas");
  updateTag(`villa-${villaId}`);
  updateTag("admin-bookings");
  updateTag("bookings");

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/admin/bookings`, "page");
  }

  const slugRows = await dbPool
    .select({
      locale: villaTranslations.locale,
      slug: villaTranslations.slug,
    })
    .from(villaTranslations)
    .where(eq(villaTranslations.villaId, villaId));

  for (const row of slugRows) {
    const locale = row.locale as Locale;
    const path = getPathname({
      locale,
      href: { pathname: "/villas/[slug]", params: { slug: row.slug } },
    });
    revalidatePath(path, "page");
  }
}
