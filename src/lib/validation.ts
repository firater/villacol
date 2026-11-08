/**
 * Shared Zod primitives for server-action input.
 *
 * Kept out of the `'use server'` files because that directive only permits
 * async function exports, so a schema const cannot live beside the action that
 * uses it.
 */
import { z } from "zod";

import { diffInNights, isValidDateString } from "@/lib/dates";
import { LOCALES } from "@/lib/locales";

export const localeSchema = z.enum(LOCALES);

/**
 * Mirrors `LocalizedText`: English is required so there is always a fallback,
 * and the other locales may be filled in later by an editor.
 */
export const localizedTextSchema = z.object({
  en: z.string().trim().min(1),
  de: z.string().trim().min(1).optional(),
  ru: z.string().trim().min(1).optional(),
});

export const idSchema = z.number().int().positive();

export const uuidSchema = z.string().uuid();

/** Money is always integer EUR cents. */
export const centsSchema = z.number().int().min(0);

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Expected a lowercase, hyphen-separated slug",
  );

export const dateStringSchema = z
  .string()
  .refine(isValidDateString, "Expected a YYYY-MM-DD calendar date");

export const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected a HH:MM time");

/**
 * Two years. A bulk calendar write is one row per date, so an unbounded range
 * is an easy way to accidentally ask for a million inserts.
 */
export const MAX_CALENDAR_RANGE_DAYS = 730;

/** Inclusive on both ends: admin calendar ranges are dates, not stays. */
export const dateRangeSchema = z
  .object({
    from: dateStringSchema,
    to: dateStringSchema,
  })
  .refine((range) => range.from <= range.to, {
    message: "`from` must not be after `to`",
    path: ["from"],
  })
  .refine(
    (range) => diffInNights(range.from, range.to) + 1 <= MAX_CALENDAR_RANGE_DAYS,
    {
      message: `A range may not exceed ${MAX_CALENDAR_RANGE_DAYS} days`,
      path: ["to"],
    },
  );

export const orderValueSchema = z.number().int().min(0).max(1_000_000);

/** `{ id, orderValue }[]`, the payload every reorder action takes. */
export const reorderSchema = z
  .array(z.object({ id: idSchema, orderValue: orderValueSchema }))
  .min(1)
  .max(500);
