"use server";

import { and, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

import { dbPool } from "@/db/pool";
import { villaCalendar } from "@/db/schema";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth-guard";
import { enqueueVillaCacheRebuild } from "@/lib/cron/trigger";
import { enumerateDateRange, type DateString } from "@/lib/dates";
import {
  centsSchema,
  dateRangeSchema,
  idSchema,
} from "@/lib/validation";

const setCalendarPricesSchema = z.object({
  villaId: idSchema,
  range: dateRangeSchema,
  priceCents: centsSchema,
});

const setCalendarBlockedSchema = z.object({
  villaId: idSchema,
  range: dateRangeSchema,
  isBlocked: z.boolean(),
  note: z.string().trim().max(500).nullish(),
});

const setCalendarMinStaySchema = z.object({
  villaId: idSchema,
  range: dateRangeSchema,
  minStay: z.number().int().min(1).max(365),
});

const clearCalendarOverridesSchema = z.object({
  villaId: idSchema,
  range: dateRangeSchema,
});

function afterCalendarWrite(villaId: number): void {
  updateTag("villas");
  updateTag(`villa-${villaId}`);
  // Calendar edits move the next-available window, so the cached card price is
  // wrong until this runs.
  enqueueVillaCacheRebuild(villaId, "calendar_edit");
}

/**
 * Bulk-upserts one row per date in the range.
 *
 * `villa_calendar` is one row per villa-night by design, so every write here is
 * an upsert on `(villa_id, date)` rather than a range insert: ranges overlap,
 * and once they do "is this night free" stops having a single answer.
 */
export async function setCalendarPrices(
  input: z.input<typeof setCalendarPricesSchema>,
): Promise<ActionResult<{ villaId: number; dates: DateString[] }>> {
  try {
    await requireAdmin();

    const parsed = setCalendarPricesSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { villaId, range, priceCents } = parsed.data;
    const dates = enumerateDateRange(range.from, range.to);

    await dbPool.transaction(async (tx) => {
      for (const date of dates) {
        await tx
          .insert(villaCalendar)
          .values({ villaId, date, priceCents })
          .onConflictDoUpdate({
            target: [villaCalendar.villaId, villaCalendar.date],
            set: { priceCents, updatedAt: new Date() },
          });
      }
    });

    afterCalendarWrite(villaId);

    return ok({ villaId, dates });
  } catch (error) {
    return toActionError(error);
  }
}

export async function setCalendarBlocked(
  input: z.input<typeof setCalendarBlockedSchema>,
): Promise<ActionResult<{ villaId: number; dates: DateString[] }>> {
  try {
    await requireAdmin();

    const parsed = setCalendarBlockedSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { villaId, range, isBlocked, note } = parsed.data;
    const dates = enumerateDateRange(range.from, range.to);

    // `villa_calendar_block_source_check` requires a source whenever a night is
    // blocked, and unblocking must clear it so a later manual hold is not
    // mistaken for a booked night.
    const blockSource = isBlocked ? ("admin" as const) : null;

    await dbPool.transaction(async (tx) => {
      for (const date of dates) {
        await tx
          .insert(villaCalendar)
          .values({
            villaId,
            date,
            isBlocked,
            blockSource,
            note: note ?? null,
          })
          .onConflictDoUpdate({
            target: [villaCalendar.villaId, villaCalendar.date],
            set: {
              isBlocked,
              blockSource,
              note: note ?? null,
              updatedAt: new Date(),
            },
          });
      }
    });

    afterCalendarWrite(villaId);

    return ok({ villaId, dates });
  } catch (error) {
    return toActionError(error);
  }
}

export async function setCalendarMinStay(
  input: z.input<typeof setCalendarMinStaySchema>,
): Promise<ActionResult<{ villaId: number; dates: DateString[] }>> {
  try {
    await requireAdmin();

    const parsed = setCalendarMinStaySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { villaId, range, minStay } = parsed.data;
    const dates = enumerateDateRange(range.from, range.to);

    await dbPool.transaction(async (tx) => {
      for (const date of dates) {
        await tx
          .insert(villaCalendar)
          .values({ villaId, date, minStay })
          .onConflictDoUpdate({
            target: [villaCalendar.villaId, villaCalendar.date],
            set: { minStay, updatedAt: new Date() },
          });
      }
    });

    afterCalendarWrite(villaId);

    return ok({ villaId, dates });
  } catch (error) {
    return toActionError(error);
  }
}

/**
 * Drops admin overrides so the nights fall back to the villa defaults.
 *
 * Booked and iCal-imported nights are deliberately left alone: clearing a
 * `block_source = 'booking'` row would re-open a night a guest has already paid
 * for. Only rows with no source or an `admin` source are removed.
 */
export async function clearCalendarOverrides(
  input: z.input<typeof clearCalendarOverridesSchema>,
): Promise<
  ActionResult<{ villaId: number; clearedDates: DateString[]; preservedCount: number }>
> {
  try {
    await requireAdmin();

    const parsed = clearCalendarOverridesSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { villaId, range } = parsed.data;
    const requested = enumerateDateRange(range.from, range.to);

    const cleared = await dbPool
      .delete(villaCalendar)
      .where(
        and(
          eq(villaCalendar.villaId, villaId),
          gte(villaCalendar.date, range.from),
          lte(villaCalendar.date, range.to),
          or(
            isNull(villaCalendar.blockSource),
            inArray(villaCalendar.blockSource, ["admin"]),
          ),
        ),
      )
      .returning({ date: villaCalendar.date });

    const clearedDates = cleared.map((row) => String(row.date));

    afterCalendarWrite(villaId);

    return ok({
      villaId,
      clearedDates,
      preservedCount: requested.length - clearedDates.length,
    });
  } catch (error) {
    return toActionError(error);
  }
}
