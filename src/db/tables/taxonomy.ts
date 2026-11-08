import {
  type AnyPgColumn,
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import type { LocalizedText } from "@/lib/locales";

import { localeEnum } from "./enums";

/**
 * Hybrid i18n: short labels sit inline as jsonb, while anything that needs a
 * localized slug or full-text search gets its own `*_translations` row.
 */

export const locations = pgTable(
  "locations",
  {
    id: serial("id").primaryKey(),
    // Kas > Kalkan > Islamlar. Null means a top-level region.
    parentId: integer("parent_id").references((): AnyPgColumn => locations.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull().default("district"),
    isFeatured: boolean("is_featured").notNull().default(false),
    orderValue: integer("order_value").notNull().default(0),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("locations_parent_id_idx").on(table.parentId),
    index("locations_order_value_idx").on(table.orderValue),
  ],
);

export const locationTranslations = pgTable(
  "location_translations",
  {
    id: serial("id").primaryKey(),
    locationId: integer("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
  },
  (table) => [
    uniqueIndex("location_translations_location_locale_idx").on(
      table.locationId,
      table.locale,
    ),
    // Slugs only need to be unique within a locale, so /en/kalkan-villas and
    // /de/kalkan-villen can coexist and a locale can reuse another's wording.
    uniqueIndex("location_translations_locale_slug_idx").on(
      table.locale,
      table.slug,
    ),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    isFeatured: boolean("is_featured").notNull().default(false),
    orderValue: integer("order_value").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("categories_order_value_idx").on(table.orderValue)],
);

export const categoryTranslations = pgTable(
  "category_translations",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
  },
  (table) => [
    uniqueIndex("category_translations_category_locale_idx").on(
      table.categoryId,
      table.locale,
    ),
    uniqueIndex("category_translations_locale_slug_idx").on(
      table.locale,
      table.slug,
    ),
  ],
);

export const amenities = pgTable(
  "amenities",
  {
    id: serial("id").primaryKey(),
    // Universal English key, also used as the `?amenities=` query value.
    key: text("key").notNull().unique(),
    labelI18n: jsonb("label_i18n").$type<LocalizedText>().notNull(),
    icon: text("icon"),
    // Column is `group_key` rather than `group`, which is a reserved SQL word.
    group: text("group_key"),
    isFilterable: boolean("is_filterable").notNull().default(true),
    orderValue: integer("order_value").notNull().default(0),
  },
  (table) => [index("amenities_order_value_idx").on(table.orderValue)],
);

export const features = pgTable(
  "features",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull().unique(),
    labelI18n: jsonb("label_i18n").$type<LocalizedText>().notNull(),
    icon: text("icon"),
    group: text("group_key"),
    isFilterable: boolean("is_filterable").notNull().default(true),
    orderValue: integer("order_value").notNull().default(0),
  },
  (table) => [index("features_order_value_idx").on(table.orderValue)],
);

export const villaRules = pgTable(
  "villa_rules",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull().unique(),
    labelI18n: jsonb("label_i18n").$type<LocalizedText>().notNull(),
    descriptionI18n: jsonb("description_i18n").$type<LocalizedText>(),
    icon: text("icon"),
    orderValue: integer("order_value").notNull().default(0),
  },
  (table) => [index("villa_rules_order_value_idx").on(table.orderValue)],
);
