import type Stripe from "stripe";

import { getStripeServerClient } from "@/lib/stripe";

export type VerifiedCheckoutPayment = {
  sessionId: string;
  bookingId: string;
  paid: boolean;
};

export async function verifyCheckoutSessionPayment(
  sessionId: string,
): Promise<VerifiedCheckoutPayment | null> {
  const stripe = getStripeServerClient();
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return null;
  }

  const bookingId = session.metadata?.bookingId;
  if (bookingId === undefined || bookingId.length === 0) {
    return null;
  }

  return {
    sessionId: session.id,
    bookingId,
    paid: session.payment_status === "paid",
  };
}
