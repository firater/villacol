"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

import { dbPool } from "@/db/pool";
import { bookings, villaCalendar } from "@/db/schema";
import { bookingStatusEnum } from "@/db/tables/enums";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth-guard";
import { enqueueVillaCacheRebuild } from "@/lib/cron/trigger";
import { enumerateNights } from "@/lib/dates";
import { uuidSchema } from "@/lib/validation";

const updateBookingStatusSchema = z.object({
  bookingId: uuidSchema,
  status: z.enum(bookingStatusEnum.enumValues),
});

/** Statuses that must hold the calendar nights. */
const BLOCKING_STATUSES = new Set(["confirmed", "awaiting_payment"]);

/** Statuses that must release them again. */
const RELEASING_STATUSES = new Set(["cancelled"]);

export async function updateBookingStatus(
  input: z.input<typeof updateBookingStatusSchema>,
): Promise<
  ActionResult<{
    bookingId: string;
    status: (typeof bookingStatusEnum.enumValues)[number];
    villaId: number;
    blockedNights: number;
    releasedNights: number;
  }>
> {
  try {
    await requireAdmin();

    const parsed = updateBookingStatusSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { bookingId, status } = parsed.data;

    const result = await dbPool.transaction(async (tx) => {
      const [booking] = await tx
        .select({
          id: bookings.id,
          villaId: bookings.villaId,
          checkIn: bookings.checkIn,
          checkOut: bookings.checkOut,
        })
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

      if (booking === undefined) return null;

      await tx
        .update(bookings)
        .set({ status, updatedAt: new Date() })
        .where(eq(bookings.id, bookingId));

      let blockedNights = 0;
      let releasedNights = 0;

      if (BLOCKING_STATUSES.has(status)) {
        // The nights are blocked in the same transaction as the status change,
        // so there is no window in which a booking reads as confirmed while its
        // dates are still sellable to somebody else.
        const nights = enumerateNights(
          String(booking.checkIn),
          String(booking.checkOut),
        );

        for (const date of nights) {
          await tx
            .insert(villaCalendar)
            .values({
              villaId: booking.villaId,
              date,
              isBlocked: true,
              blockSource: "booking",
              bookingId: booking.id,
            })
            .onConflictDoUpdate({
              target: [villaCalendar.villaId, villaCalendar.date],
              set: {
                isBlocked: true,
                blockSource: "booking",
                bookingId: booking.id,
                updatedAt: new Date(),
              },
            });
        }

        blockedNights = nights.length;
      } else if (RELEASING_STATUSES.has(status)) {
        // Only this booking's own holds are released. An admin hold or another
        // booking covering the same night must survive.
        const released = await tx
          .delete(villaCalendar)
          .where(
            and(
              eq(villaCalendar.villaId, booking.villaId),
              eq(villaCalendar.bookingId, booking.id),
            ),
          )
          .returning({ date: villaCalendar.date });

        releasedNights = released.length;
      }

      return {
        villaId: booking.villaId,
        blockedNights,
        releasedNights,
      };
    });

    if (result === null) {
      return { ok: false, error: "That booking does not exist." };
    }

    updateTag("villas");
    updateTag(`villa-${result.villaId}`);

    if (result.blockedNights > 0 || result.releasedNights > 0) {
      // Availability moved, so the next-available window and the cached price
      // with it.
      enqueueVillaCacheRebuild(result.villaId, "calendar_edit");
    }

    return ok({
      bookingId,
      status,
      villaId: result.villaId,
      blockedNights: result.blockedNights,
      releasedNights: result.releasedNights,
    });
  } catch (error) {
    return toActionError(error);
  }
}
