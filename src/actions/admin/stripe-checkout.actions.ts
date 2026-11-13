"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { dbPool } from "@/db/pool";
import { bookings, villaTranslations } from "@/db/schema";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { buildBookingStatusUrl } from "@/lib/booking-urls";
import { requireAdmin } from "@/lib/auth-guard";
import type { Locale } from "@/lib/locales";
import { absoluteLocalizedUrl } from "@/lib/seo/urls";
import { getStripeServerClient } from "@/lib/stripe";
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

    const [booking] = await dbPool
      .select({
        id: bookings.id,
        status: bookings.status,
        guestEmail: bookings.guestEmail,
        accessToken: bookings.accessToken,
        displayCurrency: bookings.displayCurrency,
        displayTotalCents: bookings.displayTotalCents,
        checkIn: bookings.checkIn,
        checkOut: bookings.checkOut,
        villaId: bookings.villaId,
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (booking === undefined) {
      return { ok: false, error: "That booking does not exist." };
    }

    if (booking.status !== "awaiting_payment") {
      return {
        ok: false,
        error: "Payment links can only be generated for bookings awaiting payment.",
      };
    }

    if (booking.displayTotalCents <= 0) {
      return { ok: false, error: "This booking has no payable total." };
    }

    const [villaRow] = await dbPool
      .select({ title: villaTranslations.title })
      .from(villaTranslations)
      .where(
        and(
          eq(villaTranslations.villaId, booking.villaId),
          eq(villaTranslations.locale, locale),
        ),
      )
      .limit(1);

    const villaTitle = villaRow?.title ?? "Villa stay";
    const stripe = getStripeServerClient();

    const successUrl = `${absoluteLocalizedUrl(locale, "/booking-success")}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = buildBookingStatusUrl(locale, booking.accessToken);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: booking.guestEmail,
      client_reference_id: booking.id,
      metadata: {
        bookingId: booking.id,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: booking.displayCurrency.toLowerCase(),
            unit_amount: booking.displayTotalCents,
            product_data: {
              name: `Villa booking — ${villaTitle}`,
              description: `Stay ${String(booking.checkIn)} → ${String(booking.checkOut)}`,
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (session.url === null) {
      return { ok: false, error: "Stripe did not return a checkout URL." };
    }

    return ok({ checkoutUrl: session.url });
  } catch (error) {
    return toActionError(error);
  }
}
