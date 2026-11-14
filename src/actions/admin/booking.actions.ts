"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import { bookingStatusEnum } from "@/db/tables/enums";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { applyBookingStatusChange } from "@/lib/booking-status-update";
import { requireAdmin } from "@/lib/auth-guard";
import { uuidSchema } from "@/lib/validation";

const updateBookingStatusSchema = z.object({
  bookingId: uuidSchema,
  status: z.enum(bookingStatusEnum.enumValues),
});

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

    const result = await applyBookingStatusChange(bookingId, status);

    if (result === null) {
      return { ok: false, error: "That booking does not exist." };
    }

    updateTag("villas");
    updateTag(`villa-${result.villaId}`);
    updateTag("admin-bookings");
    updateTag("bookings");

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
