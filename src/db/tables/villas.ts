import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { LocalizedText } from "@/lib/locales";

import {
  amenities,
  categories,
  features,
  locations,
  villaRules,
} from "./taxonomy";
import { guestPolicyEnum, localeEnum } from "./enums";

export const villas = pgTable(
  "villas",
  {
    id: serial("id").primaryKey(),
    locationId: integer("location_id").references(() => locations.id, {
      onDelete: "set null",
    }),
    refCode: text("ref_code").notNull().unique(),
    // Brand slug, identical in every locale (e.g. "villa-sunset"). Localized
    // slugs live in `villa_translations`.
    slug: text("slug").notNull().unique(),

    capacity: integer("capacity").notNull().default(2),
    bedrooms: integer("bedrooms").notNull().default(1),
    bathrooms: integer("bathrooms").notNull().default(1),

    defaultMinStay: integer("default_min_stay").notNull().default(5),
    // Used for any night inside the horizon with no `villa_calendar` row.
    defaultNightlyPriceCents: integer("default_nightly_price_cents"),
    // Charged once per booking and never part of the nightly total.
    cleaningFeeCents: integer("cleaning_fee_cents").notNull().default(0),
    depositCents: integer("deposit_cents").notNull().default(0),

    checkInTime: text("check_in_time").notNull().default("16:00"),
    checkOutTime: text("check_out_time").notNull().default("10:00"),

    /**
     * Free text, per villa, shown beside the quote. Inline jsonb rather than a
     * `villa_translations` column because it needs no slug and no full-text
     * search — the same hybrid-i18n rule the taxonomy labels follow.
     */
    cancellationPolicyI18n: jsonb("cancellation_policy_i18n").$type<LocalizedText>(),
    /** Who may book. `createBookingInquiry` rejects a party that violates it. */
    guestPolicy: guestPolicyEnum("guest_policy").notNull().default("everyone"),
    /**
     * Internal editorial score on a 1–10 scale, one decimal. `numeric` rather
     * than a float so the stored value is exactly what the editor typed; the
     * query layer parses it to a number for display.
     */
    editorRating: numeric("editor_rating", {
      precision: 3,
      scale: 1,
      mode: "number",
    }),

    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),

    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    /** Curated concierge picks — only these appear in the AI concierge funnel. */
    isEditorsChoice: boolean("is_editors_choice").notNull().default(false),
    /** Editorially flagged price-to-quality picks for the landing page rail. */
    isBestValue: boolean("is_best_value").notNull().default(false),
    // Primary sort key for every listing page.
    orderValue: integer("order_value").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("villas_location_id_idx").on(table.locationId),
    index("villas_order_value_idx").on(table.orderValue),
    index("villas_active_order_idx").on(table.isActive, table.orderValue),
    index("villas_capacity_idx").on(table.capacity),
    index("villas_bedrooms_idx").on(table.bedrooms),

    check(
      "villas_editor_rating_range_check",
      sql`${table.editorRating} IS NULL
        OR (${table.editorRating} >= 1 AND ${table.editorRating} <= 10)`,
    ),
  ],
);

export const villaTranslations = pgTable(
  "villa_translations",
  {
    id: serial("id").primaryKey(),
    villaId: integer("villa_id")
      .notNull()
      .references(() => villas.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    description: text("description"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
  },
  (table) => [
    uniqueIndex("villa_translations_villa_locale_idx").on(
      table.villaId,
      table.locale,
    ),
    uniqueIndex("villa_translations_locale_slug_idx").on(
      table.locale,
      table.slug,
    ),
  ],
);

export const villaImages = pgTable(
  "villa_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    villaId: integer("villa_id")
      .notNull()
      .references(() => villas.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    altI18n: jsonb("alt_i18n").$type<LocalizedText>(),
    orderValue: integer("order_value").notNull().default(0),
    isMain: boolean("is_main").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("villa_images_villa_order_idx").on(table.villaId, table.orderValue),
  ],
);

export const villaAmenities = pgTable(
  "villa_amenities",
  {
    villaId: integer("villa_id")
      .notNull()
      .references(() => villas.id, { onDelete: "cascade" }),
    amenityId: integer("amenity_id")
      .notNull()
      .references(() => amenities.id, { onDelete: "cascade" }),
    isHighlighted: boolean("is_highlighted").notNull().default(false),
  },
  (table) => [
    primaryKey({ columns: [table.villaId, table.amenityId] }),
    index("villa_amenities_amenity_id_idx").on(table.amenityId),
  ],
);

export const villaFeatures = pgTable(
  "villa_features",
  {
    villaId: integer("villa_id")
      .notNull()
      .references(() => villas.id, { onDelete: "cascade" }),
    featureId: integer("feature_id")
      .notNull()
      .references(() => features.id, { onDelete: "cascade" }),
    isHighlighted: boolean("is_highlighted").notNull().default(false),
  },
  (table) => [
    primaryKey({ columns: [table.villaId, table.featureId] }),
    index("villa_features_feature_id_idx").on(table.featureId),
  ],
);

export const villaCategories = pgTable(
  "villa_categories",
  {
    villaId: integer("villa_id")
      .notNull()
      .references(() => villas.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.villaId, table.categoryId] }),
    index("villa_categories_category_id_idx").on(table.categoryId),
  ],
);

export const villaRuleLinks = pgTable(
  "villa_rule_links",
  {
    villaId: integer("villa_id")
      .notNull()
      .references(() => villas.id, { onDelete: "cascade" }),
    ruleId: integer("rule_id")
      .notNull()
      .references(() => villaRules.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.villaId, table.ruleId] }),
    index("villa_rule_links_rule_id_idx").on(table.ruleId),
  ],
);
