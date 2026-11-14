import { and, eq } from "drizzle-orm";

import { dbPool } from "@/db/pool";
import { bookings, villaCalendar } from "@/db/schema";
import type { bookingStatusEnum } from "@/db/tables/enums";
import { enqueueVillaCacheRebuild } from "@/lib/cron/trigger";
import { enumerateNights } from "@/lib/dates";

type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];

/** Statuses that must hold the calendar nights. */
const BLOCKING_STATUSES = new Set<BookingStatus>(["confirmed", "awaiting_payment"]);

/** Statuses that must release them again. */
const RELEASING_STATUSES = new Set<BookingStatus>(["cancelled"]);

export type BookingPaymentPatch = {
  paymentProvider: string;
  paymentIntentId: string;
  paidAt: Date;
};

export type ApplyBookingStatusResult = {
  bookingId: string;
  status: BookingStatus;
  villaId: number;
  blockedNights: number;
  releasedNights: number;
  skipped: boolean;
};

/**
 * Core status transition used by admin UI and Stripe webhooks.
 * Calendar blocks/unblocks run in the same transaction as the status write.
 */
export async function applyBookingStatusChange(
  bookingId: string,
  status: BookingStatus,
  paymentPatch?: BookingPaymentPatch,
): Promise<ApplyBookingStatusResult | null> {
  const result = await dbPool.transaction(async (tx) => {
    const [booking] = await tx
      .select({
        id: bookings.id,
        villaId: bookings.villaId,
        checkIn: bookings.checkIn,
        checkOut: bookings.checkOut,
        status: bookings.status,
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (booking === undefined) return null;

    const statusUnchanged = booking.status === status;
    if (statusUnchanged && paymentPatch === undefined) {
      return {
        villaId: booking.villaId,
        blockedNights: 0,
        releasedNights: 0,
        skipped: true,
      };
    }

    await tx
      .update(bookings)
      .set({
        status,
        updatedAt: new Date(),
        ...(paymentPatch !== undefined
          ? {
              paymentProvider: paymentPatch.paymentProvider,
              paymentIntentId: paymentPatch.paymentIntentId,
              paidAt: paymentPatch.paidAt,
            }
          : {}),
      })
      .where(eq(bookings.id, bookingId));

    let blockedNights = 0;
    let releasedNights = 0;

    if (statusUnchanged) {
      return {
        villaId: booking.villaId,
        blockedNights: 0,
        releasedNights: 0,
        skipped: false,
      };
    }

    if (BLOCKING_STATUSES.has(status)) {
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
      skipped: false,
    };
  });

  if (result === null) {
    return null;
  }

  if (!result.skipped && (result.blockedNights > 0 || result.releasedNights > 0)) {
    enqueueVillaCacheRebuild(result.villaId, "calendar_edit");
  }

  return {
    bookingId,
    status,
    villaId: result.villaId,
    blockedNights: result.blockedNights,
    releasedNights: result.releasedNights,
    skipped: result.skipped,
  };
}
