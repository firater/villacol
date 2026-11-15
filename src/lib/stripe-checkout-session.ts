import { and, eq } from "drizzle-orm";

import { dbPool } from "@/db/pool";
import { bookings, villaTranslations } from "@/db/schema";
import { buildBookingStatusUrl } from "@/lib/booking-urls";
import type { Locale } from "@/lib/locales";
import { absoluteLocalizedUrl } from "@/lib/seo/urls";
import { getStripeServerClient } from "@/lib/stripe";

export class StripeCheckoutSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripeCheckoutSessionError";
  }
}

/**
 * Creates a Stripe Hosted Checkout session for an awaiting_payment booking.
 */
export async function createCheckoutSessionForBooking(
  bookingId: string,
  locale: Locale,
): Promise<string> {
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
    throw new StripeCheckoutSessionError("That booking does not exist.");
  }

  if (booking.status !== "awaiting_payment") {
    throw new StripeCheckoutSessionError(
      "Payment links can only be generated for bookings awaiting payment.",
    );
  }

  if (booking.displayTotalCents <= 0) {
    throw new StripeCheckoutSessionError("This booking has no payable total.");
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
    throw new StripeCheckoutSessionError("Stripe did not return a checkout URL.");
  }

  return session.url;
}
