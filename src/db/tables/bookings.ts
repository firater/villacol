import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { bookingStatusEnum, currencyEnum } from "./enums";
import { promotions } from "./promotions";
import { user } from "./auth";
import { villas } from "./villas";

export type ExtraGuest = { name: string; age?: number };

/**
 * Frozen snapshot of the engine's `PriceQuote`, written once at booking time.
 * Typed loosely here so the schema stays independent of the pricing module; the
 * engine's own `PriceQuote` is what gets serialized into it.
 */
export type PriceBreakdownSnapshot = Record<string, unknown>;

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    villaId: integer("villa_id")
      .notNull()
      .references(() => villas.id, { onDelete: "restrict" }),
    // Optional: guests book without an account. The `guest_*` columns below are
    // the snapshot, so deleting an account never orphans a booking's identity.
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),

    guestName: text("guest_name").notNull(),
    guestEmail: text("guest_email").notNull(),
    guestPhone: text("guest_phone").notNull(),
    guestAddress: text("guest_address"),
    guestNote: text("guest_note"),
    guestCount: integer("guest_count").notNull(),
    extraGuests: jsonb("extra_guests").$type<ExtraGuest[]>(),

    checkIn: date("check_in").notNull(),
    checkOut: date("check_out").notNull(),
    nightCount: integer("night_count").notNull(),
    status: bookingStatusEnum("status").notNull().default("inquiry"),

    /**
     * Opaque handle for the guest's confirmation link. Identifies the booking
     * only; access still requires an email OTP (`booking_otp_challenges`), so
     * a forwarded link is not a credential on its own.
     */
    accessToken: text("access_token").notNull().unique(),

    // What the guest actually saw, so a later FX move can't make the quote they
    // accepted look wrong.
    displayCurrency: currencyEnum("display_currency").notNull().default("EUR"),
    displayTotalCents: integer("display_total_cents").notNull(),
    fxRateUsed: numeric("fx_rate_used", { precision: 18, scale: 8 })
      .notNull()
      .default("1"),

    // Source of truth, always EUR cents.
    baseTotalCents: integer("base_total_cents").notNull(),
    totalDiscountCents: integer("total_discount_cents").notNull().default(0),
    nightlyTotalCents: integer("nightly_total_cents").notNull(),
    cleaningFeeCents: integer("cleaning_fee_cents").notNull().default(0),
    depositCents: integer("deposit_cents").notNull().default(0),
    grandTotalCents: integer("grand_total_cents").notNull(),

    priceBreakdown: jsonb("price_breakdown")
      .$type<PriceBreakdownSnapshot>()
      .notNull(),

    termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
    contractAcceptedAt: timestamp("contract_accepted_at", {
      withTimezone: true,
    }),

    // Payment-ready, not wired: see the `awaiting_payment` status.
    paymentProvider: text("payment_provider"),
    paymentIntentId: text("payment_intent_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("bookings_villa_dates_idx").on(
      table.villaId,
      table.checkIn,
      table.checkOut,
    ),
    index("bookings_status_idx").on(table.status),
    index("bookings_guest_email_idx").on(table.guestEmail),
    index("bookings_created_at_idx").on(table.createdAt),

    check("bookings_date_order_check", sql`${table.checkOut} > ${table.checkIn}`),
    check("bookings_night_count_check", sql`${table.nightCount} > 0`),
    check("bookings_guest_count_check", sql`${table.guestCount} > 0`),
    // The same invariants `assertQuoteInvariants` enforces in the engine, so a
    // bad write fails at the database rather than surfacing as a wrong total.
    check(
      "bookings_nightly_total_check",
      sql`${table.nightlyTotalCents} = ${table.baseTotalCents} - ${table.totalDiscountCents}`,
    ),
    check(
      "bookings_grand_total_check",
      sql`${table.grandTotalCents} = ${table.nightlyTotalCents} + ${table.cleaningFeeCents}`,
    ),
    check(
      "bookings_non_negative_totals_check",
      sql`${table.nightlyTotalCents} >= 0 AND ${table.totalDiscountCents} >= 0`,
    ),
  ],
);

/**
 * Queryable copy of the engine's discount chain. `step_index` preserves the
 * order the discounts were compounded in, which the jsonb breakdown also holds
 * but cannot be aggregated across bookings.
 */
export const bookingPromotions = pgTable(
  "booking_promotions",
  {
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    promotionId: integer("promotion_id")
      .notNull()
      .references(() => promotions.id, { onDelete: "restrict" }),
    discountCents: integer("discount_cents").notNull(),
    stepIndex: integer("step_index").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.bookingId, table.promotionId] }),
    index("booking_promotions_promotion_id_idx").on(table.promotionId),
  ],
);

/**
 * One-off codes minted when a visitor triggers exit intent. Keyed by the
 * `villa_visitor` cookie so a single visitor cannot farm codes; the partial
 * unique index below enforces at most one unredeemed code per visitor.
 */
export const exitIntentCodes = pgTable(
  "exit_intent_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    promotionId: integer("promotion_id")
      .notNull()
      .references(() => promotions.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
    bookingId: uuid("booking_id").references(() => bookings.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("exit_intent_codes_visitor_id_idx").on(table.visitorId),
    uniqueIndex("exit_intent_codes_live_per_visitor_idx")
      .on(table.visitorId)
      .where(sql`${table.redeemedAt} IS NULL`),
  ],
);
