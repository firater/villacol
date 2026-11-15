"use server";

import { z } from "zod";

import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth-guard";
import {
  createCheckoutSessionForBooking,
  StripeCheckoutSessionError,
} from "@/lib/stripe-checkout-session";
import { localeSchema, uuidSchema } from "@/lib/validation";

const createStripeCheckoutSessionSchema = z.object({
  bookingId: uuidSchema,
  locale: localeSchema,
});

export async function createStripeCheckoutSession(
  input: z.input<typeof createStripeCheckoutSessionSchema>,
): Promise<ActionResult<{ checkoutUrl: string }>> {
  try {
    await requireAdmin();

    const parsed = createStripeCheckoutSessionSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { bookingId, locale } = parsed.data;
    const checkoutUrl = await createCheckoutSessionForBooking(bookingId, locale);

    return ok({ checkoutUrl });
  } catch (error) {
    if (error instanceof StripeCheckoutSessionError) {
      return { ok: false, error: error.message };
    }
    return toActionError(error);
  }
}
