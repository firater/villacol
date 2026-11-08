import { pgEnum } from "drizzle-orm/pg-core";

import { CURRENCIES, LOCALES } from "@/lib/locales";

/** Derived from `LOCALES` so the DB enum can never drift from the app's list. */
export const localeEnum = pgEnum("locale_enum", LOCALES);

export const currencyEnum = pgEnum("currency_enum", CURRENCIES);

export const userRoleEnum = pgEnum("user_role_enum", [
  "admin",
  "editor",
  "guest",
]);

export const bookingStatusEnum = pgEnum("booking_status_enum", [
  "inquiry",
  "pending",
  "awaiting_payment",
  "confirmed",
  "cancelled",
  "completed",
]);

export const discountTypeEnum = pgEnum("discount_type_enum", [
  "percentage",
  "fixed_amount",
  "free_days",
]);

export const promotionTriggerEnum = pgEnum("promotion_trigger_enum", [
  "always",
  "long_stay",
  "last_minute",
  "early_bird",
  "coupon",
  "exit_intent",
]);

export const calendarBlockSourceEnum = pgEnum("calendar_block_source_enum", [
  "admin",
  "booking",
  "ical",
]);

export const priceCacheWindowEnum = pgEnum("price_cache_window_enum", [
  "min_stay",
  "promo_free_days",
]);

export const cronRunStatusEnum = pgEnum("cron_run_status_enum", [
  "running",
  "succeeded",
  "failed",
  "skipped_locked",
]);

export const contactStatusEnum = pgEnum("contact_status_enum", [
  "new",
  "read",
  "archived",
]);

export const priceCacheSourceEnum = pgEnum("price_cache_source_enum", [
  "cron",
  "admin_edit",
]);

export const synonymKindEnum = pgEnum("synonym_kind_enum", [
  "location",
  "category",
  "amenity",
  "misc",
]);

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];
export type DiscountType = (typeof discountTypeEnum.enumValues)[number];
export type PromotionTrigger = (typeof promotionTriggerEnum.enumValues)[number];
export type CalendarBlockSource =
  (typeof calendarBlockSourceEnum.enumValues)[number];
export type PriceCacheWindow = (typeof priceCacheWindowEnum.enumValues)[number];
export type PriceCacheSource = (typeof priceCacheSourceEnum.enumValues)[number];
export type CronRunStatus = (typeof cronRunStatusEnum.enumValues)[number];
export type ContactStatus = (typeof contactStatusEnum.enumValues)[number];
export type SynonymKind = (typeof synonymKindEnum.enumValues)[number];
