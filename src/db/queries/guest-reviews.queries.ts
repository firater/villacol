/**
 * Published guest reviews for the public villa detail page.
 */
import { and, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { guestReviews } from "@/db/schema";
import type { Locale } from "@/lib/locales";

export type PublishedGuestReviewRow = {
  id: string;
  guestName: string;
  stayCheckIn: string;
  stayCheckOut: string;
  guestCount: number;
  rating: number;
  reviewText: string;
};

export async function getPublishedGuestReviewsForVilla(
  villaId: number,
): Promise<PublishedGuestReviewRow[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("villas", `villa-${villaId}`, "guest-reviews");

  const rows = await db
    .select({
      id: guestReviews.id,
      guestName: guestReviews.guestName,
      stayCheckIn: guestReviews.stayCheckIn,
      stayCheckOut: guestReviews.stayCheckOut,
      guestCount: guestReviews.guestCount,
      rating: guestReviews.rating,
      reviewText: guestReviews.reviewText,
    })
    .from(guestReviews)
    .where(
      and(eq(guestReviews.villaId, villaId), eq(guestReviews.isPublished, true)),
    )
    .orderBy(desc(guestReviews.publishedAt), desc(guestReviews.createdAt));

  return rows.map((row) => ({
    id: row.id,
    guestName: row.guestName,
    stayCheckIn: String(row.stayCheckIn),
    stayCheckOut: String(row.stayCheckOut),
    guestCount: row.guestCount,
    rating: row.rating,
    reviewText: row.reviewText,
  }));
}
