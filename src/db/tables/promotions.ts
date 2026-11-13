import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import type { LocalizedText } from "@/lib/locales";

import { discountTypeEnum, promotionTriggerEnum } from "./enums";
import { villas } from "./villas";

export const promotions = pgTable(
  "promotions",
  {
    id: serial("id").primaryKey(),
    // Internal name for the admin list; `display_name_i18n` is what guests see.
    name: text("name").notNull(),
    displayNameI18n: jsonb("display_name_i18n").$type<LocalizedText>().notNull(),
    descriptionI18n: jsonb("description_i18n").$type<LocalizedText>(),

    discountType: discountTypeEnum("discount_type").notNull(),
    triggerType: promotionTriggerEnum("trigger_type").notNull().default("always"),

    // Exactly one of these three is populated, enforced by the CHECK below.
    // Basis points: 1000 = 10%. Integers only, so no float creeps into the chain.
    // On a `commission_waiver` row this is optional: null means "use the global
    // commission rate", which is what makes the waiver track a rate change.
    percentBp: integer("percent_bp"),
    fixedAmountCents: integer("fixed_amount_cents"),
    // Pay-6-stay-7 is free_nights = 1 with free_nights_threshold = 7.
    freeNights: integer("free_nights"),
    freeNightsThreshold: integer("free_nights_threshold"),

    // Trigger conditions.
    minNights: integer("min_nights"),
    maxNights: integer("max_nights"),
    /**
     * When this promotion applies, the effective minimum stay for the booking is
     * `min(calendar/default min_stay, override_min_nights)` — emergency flexibility.
     */
    overrideMinNights: integer("override_min_nights"),
    lastMinuteWithinDays: integer("last_minute_within_days"),
    earlyBirdMinDays: integer("early_bird_min_days"),
    // Non-null means the guest must supply this code for the promotion to apply.
    code: text("code"),

    // When the booking is made.
    bookingWindowStart: date("booking_window_start"),
    bookingWindowEnd: date("booking_window_end"),
    // When the stay happens.
    travelWindowStart: date("travel_window_start"),
    travelWindowEnd: date("travel_window_end"),

    // Lower runs first in the sequential chain.
    priorityOrder: integer("priority_order").notNull().default(100),
    // False means exclusive: if this one is selected, nothing else applies.
    isStackable: boolean("is_stackable").notNull().default(true),

    isActive: boolean("is_active").notNull().default(false),
    maxRedemptions: integer("max_redemptions"),
    redemptionCount: integer("redemption_count").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("promotions_active_priority_idx").on(
      table.isActive,
      table.priorityOrder,
    ),
    index("promotions_code_idx").on(table.code),
    index("promotions_trigger_type_idx").on(table.triggerType),

    // The discount value must match the discount type. Without this a
    // 'percentage' row with a null percent_bp would silently discount nothing.
    //
    // Compared as text, not as the enum: `ALTER TYPE ... ADD VALUE` and a
    // constraint naming the new label cannot share one transaction, and the
    // migrator runs each migration in exactly one.
    check(
      "promotions_value_shape_check",
      sql`(
        (${table.discountType}::text = 'percentage'
          AND ${table.percentBp} IS NOT NULL
          AND ${table.fixedAmountCents} IS NULL
          AND ${table.freeNights} IS NULL)
        OR (${table.discountType}::text = 'fixed_amount'
          AND ${table.fixedAmountCents} IS NOT NULL
          AND ${table.percentBp} IS NULL
          AND ${table.freeNights} IS NULL)
        OR (${table.discountType}::text = 'free_days'
          AND ${table.freeNights} IS NOT NULL
          AND ${table.freeNightsThreshold} IS NOT NULL
          AND ${table.percentBp} IS NULL
          AND ${table.fixedAmountCents} IS NULL)
        OR (${table.discountType}::text = 'commission_waiver'
          AND ${table.fixedAmountCents} IS NULL
          AND ${table.freeNights} IS NULL)
      )`,
    ),

    // A trigger without its condition column would match every booking.
    check(
      "promotions_trigger_shape_check",
      sql`(
        (${table.triggerType} = 'always')
        OR (${table.triggerType} = 'long_stay' AND ${table.minNights} IS NOT NULL)
        OR (${table.triggerType} = 'last_minute' AND ${table.lastMinuteWithinDays} IS NOT NULL)
        OR (${table.triggerType} = 'early_bird' AND ${table.earlyBirdMinDays} IS NOT NULL)
        OR (${table.triggerType} IN ('coupon', 'exit_intent') AND ${table.code} IS NOT NULL)
      )`,
    ),

    check(
      "promotions_percent_bp_range_check",
      sql`${table.percentBp} IS NULL OR (${table.percentBp} > 0 AND ${table.percentBp} <= 10000)`,
    ),

    check(
      "promotions_positive_amounts_check",
      sql`(${table.fixedAmountCents} IS NULL OR ${table.fixedAmountCents} > 0)
        AND (${table.freeNights} IS NULL OR ${table.freeNights} > 0)
        AND (${table.freeNightsThreshold} IS NULL OR ${table.freeNightsThreshold} > 0)`,
    ),

    // A free-days promotion that frees every night of the qualifying stay would
    // make the stay cost nothing.
    check(
      "promotions_free_nights_below_threshold_check",
      sql`${table.freeNights} IS NULL
        OR ${table.freeNightsThreshold} IS NULL
        OR ${table.freeNights} < ${table.freeNightsThreshold}`,
    ),

    check(
      "promotions_night_range_check",
      sql`${table.minNights} IS NULL
        OR ${table.maxNights} IS NULL
        OR ${table.minNights} <= ${table.maxNights}`,
    ),
  ],
);

export const villaPromotions = pgTable(
  "villa_promotions",
  {
    villaId: integer("villa_id")
      .notNull()
      .references(() => villas.id, { onDelete: "cascade" }),
    promotionId: integer("promotion_id")
      .notNull()
      .references(() => promotions.id, { onDelete: "cascade" }),
    // Lets one villa reorder a promotion it shares with every other villa.
    priorityOverride: integer("priority_override"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.villaId, table.promotionId] }),
    index("villa_promotions_promotion_id_idx").on(table.promotionId),
  ],
);
