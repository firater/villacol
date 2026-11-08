import { sql } from "drizzle-orm";
import {
  boolean,
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
} from "drizzle-orm/pg-core";

import type { LocalizedText } from "@/lib/locales";

import {
  currencyEnum,
  type DiscountType,
  priceCacheSourceEnum,
  priceCacheWindowEnum,
} from "./enums";
import { villas } from "./villas";

/** Exactly what a villa card and the detail page render for each discount. */
export type AppliedPromotionSnapshot = {
  promotionId: number;
  name: string;
  displayNameI18n: LocalizedText;
  discountType: DiscountType;
  discountCents: number;
};

/**
 * Nightly pre-computed pricing, so a listing page never runs the engine.
 *
 * Keyed by `(villa_id, window_kind)` rather than villa alone: the min-stay
 * window and the pay-6-stay-7 window are two different stays with two
 * different totals, and giving each its own row avoids a second set of nullable
 * `promo_*` columns on a single row.
 */
export const villaPriceCache = pgTable(
  "villa_price_cache",
  {
    villaId: integer("villa_id")
      .notNull()
      .references(() => villas.id, { onDelete: "cascade" }),
    windowKind: priceCacheWindowEnum("window_kind").notNull(),

    checkIn: date("check_in").notNull(),
    checkOut: date("check_out").notNull(),
    nightCount: integer("night_count").notNull(),

    baseTotalCents: integer("base_total_cents").notNull(),
    totalDiscountCents: integer("total_discount_cents").notNull().default(0),
    discountedTotalCents: integer("discounted_total_cents").notNull(),
    avgNightlyCents: integer("avg_nightly_cents").notNull(),
    minNightlyCents: integer("min_nightly_cents").notNull(),
    maxNightlyCents: integer("max_nightly_cents").notNull(),

    // Carried for display only. Never included in any total on this row.
    cleaningFeeCents: integer("cleaning_fee_cents").notNull().default(0),

    appliedPromotions: jsonb("applied_promotions")
      .$type<AppliedPromotionSnapshot[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    hasActiveDiscount: boolean("has_active_discount").notNull().default(false),

    computedAt: timestamp("computed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    computedBy: priceCacheSourceEnum("computed_by").notNull().default("cron"),
    // Bump `PRICING_ENGINE_VERSION` to force every row to be recomputed.
    engineVersion: integer("engine_version").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.villaId, table.windowKind] }),
    // Price sorting on the listing page.
    index("villa_price_cache_window_price_idx").on(
      table.windowKind,
      table.discountedTotalCents,
    ),
    // The offers page filters on this before anything else.
    index("villa_price_cache_has_discount_idx").on(table.hasActiveDiscount),
    index("villa_price_cache_check_in_idx").on(table.checkIn),

    check("villa_price_cache_night_count_check", sql`${table.nightCount} > 0`),
    check(
      "villa_price_cache_date_order_check",
      sql`${table.checkOut} > ${table.checkIn}`,
    ),
    check(
      "villa_price_cache_discount_math_check",
      sql`${table.discountedTotalCents} = ${table.baseTotalCents} - ${table.totalDiscountCents}`,
    ),
    check(
      "villa_price_cache_non_negative_check",
      sql`${table.discountedTotalCents} >= 0 AND ${table.totalDiscountCents} >= 0`,
    ),
  ],
);

/**
 * Pre-grouped alternatives, so the detail page loads them with one indexed
 * read instead of scoring every villa on request.
 */
export const similarVillas = pgTable(
  "similar_villas",
  {
    villaId: integer("villa_id")
      .notNull()
      .references(() => villas.id, { onDelete: "cascade" }),
    similarVillaId: integer("similar_villa_id")
      .notNull()
      .references(() => villas.id, { onDelete: "cascade" }),
    score: integer("score").notNull().default(0),
    // Admin picks survive the nightly regroup.
    isManual: boolean("is_manual").notNull().default(false),
    computedAt: timestamp("computed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.villaId, table.similarVillaId] }),
    index("similar_villas_villa_score_idx").on(table.villaId, table.score),
    check(
      "similar_villas_no_self_reference_check",
      sql`${table.villaId} <> ${table.similarVillaId}`,
    ),
  ],
);

/**
 * Display-time conversion only. Every stored amount stays in EUR cents; this
 * table never participates in the pricing engine.
 */
export const exchangeRates = pgTable(
  "exchange_rates",
  {
    baseCurrency: currencyEnum("base_currency").notNull().default("EUR"),
    quoteCurrency: currencyEnum("quote_currency").notNull(),
    rate: numeric("rate", { precision: 18, scale: 8 }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    source: text("source"),
  },
  (table) => [
    primaryKey({ columns: [table.baseCurrency, table.quoteCurrency] }),
    check("exchange_rates_positive_rate_check", sql`${table.rate} > 0`),
  ],
);
