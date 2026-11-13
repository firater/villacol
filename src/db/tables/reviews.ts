import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { bookings } from "./bookings";
import { localeEnum } from "./enums";
import { villas } from "./villas";

/**
 * Real guest reviews.
 *
 * `booking_id` is optional but preferred: a review that carries one is a
 * verified stay, and the partial unique index below stops the same booking
 * being reviewed twice. Reviews imported from elsewhere keep it null and are
 * flagged unverified rather than being rejected.
 *
 * The guest identity is snapshotted (`guest_name`) exactly like `bookings`
 * does, so deleting a booking never rewrites the review's attribution.
 */
export const guestReviews = pgTable(
  "guest_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    villaId: integer("villa_id")
      .notNull()
      .references(() => villas.id, { onDelete: "cascade" }),
    bookingId: uuid("booking_id").references(() => bookings.id, {
      onDelete: "set null",
    }),

    guestName: text("guest_name").notNull(),
    /** Language the review was written in; drives which locale shows it first. */
    locale: localeEnum("locale").notNull().default("en"),

    stayCheckIn: date("stay_check_in").notNull(),
    stayCheckOut: date("stay_check_out").notNull(),
    guestCount: integer("guest_count").notNull(),

    /** Whole stars, 1–5. Averages are computed on read, never stored. */
    rating: integer("rating").notNull(),
    reviewText: text("review_text").notNull(),

    /** Moderation gate: nothing is public until an admin publishes it. */
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("guest_reviews_villa_published_idx").on(
      table.villaId,
      table.isPublished,
      table.createdAt,
    ),
    index("guest_reviews_rating_idx").on(table.rating),
    // One review per verified booking; unverified rows are unconstrained.
    uniqueIndex("guest_reviews_booking_id_idx")
      .on(table.bookingId)
      .where(sql`${table.bookingId} IS NOT NULL`),

    check(
      "guest_reviews_rating_range_check",
      sql`${table.rating} >= 1 AND ${table.rating} <= 5`,
    ),
    check(
      "guest_reviews_stay_order_check",
      sql`${table.stayCheckOut} > ${table.stayCheckIn}`,
    ),
    check("guest_reviews_guest_count_check", sql`${table.guestCount} > 0`),
  ],
);
