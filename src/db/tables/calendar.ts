import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { bookings } from "./bookings";
import { calendarBlockSourceEnum } from "./enums";
import { villas } from "./villas";

/**
 * The availability source of truth: exactly one row per villa-night.
 *
 * This replaces the usual pairing of a price table plus a range-based
 * availability table. Ranges overlap, and once they overlap "is this night
 * free" stops having a single answer. One row per night makes availability a
 * lookup instead of an interval intersection, and lets the next-available scan
 * be a single ordered index read.
 *
 * A night is bookable when a row exists with `is_blocked = false`, or when no
 * row exists and the villa has a `default_nightly_price_cents`.
 */
export const villaCalendar = pgTable(
  "villa_calendar",
  {
    villaId: integer("villa_id")
      .notNull()
      .references(() => villas.id, { onDelete: "cascade" }),
    date: date("date").notNull(),

    // EUR cents for this specific night; overrides the villa default.
    priceCents: integer("price_cents"),
    // Overrides `villas.default_min_stay` for stays starting on this night.
    minStay: integer("min_stay"),

    isBlocked: boolean("is_blocked").notNull().default(false),
    blockSource: calendarBlockSourceEnum("block_source"),
    bookingId: uuid("booking_id").references(() => bookings.id, {
      onDelete: "set null",
    }),

    note: text("note"),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Supplies the (villa_id, date) lookup and ordered range scan.
    primaryKey({ columns: [table.villaId, table.date] }),
    // The next-available-window scan only ever walks open nights, so keeping
    // blocked rows out of the index makes it cheap on a full calendar.
    index("villa_calendar_open_nights_idx")
      .on(table.villaId, table.date)
      .where(sql`${table.isBlocked} = false`),
    index("villa_calendar_date_idx").on(table.date),
    index("villa_calendar_booking_id_idx").on(table.bookingId),

    check(
      "villa_calendar_price_check",
      sql`${table.priceCents} IS NULL OR ${table.priceCents} >= 0`,
    ),
    check(
      "villa_calendar_min_stay_check",
      sql`${table.minStay} IS NULL OR ${table.minStay} > 0`,
    ),
    // A block always records where it came from, so an admin can tell a manual
    // hold from a booked night.
    check(
      "villa_calendar_block_source_check",
      sql`${table.isBlocked} = false OR ${table.blockSource} IS NOT NULL`,
    ),
  ],
);
