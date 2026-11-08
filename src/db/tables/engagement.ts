import {
  boolean,
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

import { contactStatusEnum, localeEnum } from "./enums";

/** Deals shown in the notification bell. */
export const deals = pgTable(
  "deals",
  {
    id: serial("id").primaryKey(),
    titleI18n: jsonb("title_i18n").$type<LocalizedText>().notNull(),
    bodyI18n: jsonb("body_i18n").$type<LocalizedText>().notNull(),
    link: text("link"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    orderValue: integer("order_value").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("deals_active_order_idx").on(table.isActive, table.orderValue),
    index("deals_window_idx").on(table.startsAt, table.endsAt),
  ],
);

/**
 * Read receipts keyed by the `villa_visitor` cookie rather than a user id, so
 * the bell's unread dot works for anonymous visitors. Unread is the set of
 * currently active deals with no matching row here.
 */
export const dealReads = pgTable(
  "deal_reads",
  {
    dealId: integer("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.dealId, table.visitorId] }),
    index("deal_reads_visitor_id_idx").on(table.visitorId),
  ],
);

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    message: text("message").notNull(),
    locale: localeEnum("locale").notNull().default("en"),
    status: contactStatusEnum("status").notNull().default("new"),
    adminNote: text("admin_note"),
    // Set when a visitor submits; used to rate-limit the public form.
    visitorId: text("visitor_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (table) => [
    index("contact_messages_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
    index("contact_messages_visitor_created_idx").on(
      table.visitorId,
      table.createdAt,
    ),
  ],
);
