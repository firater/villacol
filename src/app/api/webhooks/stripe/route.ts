import { eq } from "drizzle-orm";
import type Stripe from "stripe";

import { dbPool } from "@/db/pool";
import { bookings } from "@/db/schema";
import { env } from "@/env";
import { applyBookingStatusChange } from "@/lib/booking-status-update";
import { revalidateBookingPaymentViews } from "@/lib/revalidate-booking-views";
import { getStripeServerClient } from "@/lib/stripe";

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<Response> {
  const bookingId = session.metadata?.bookingId;
  if (bookingId === undefined || bookingId.length === 0) {
    console.error("[stripe webhook] checkout.session.completed missing bookingId");
    return Response.json({ received: true }, { status: 200 });
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? session.id);

  const paidAt = new Date();

  console.log("ATTEMPTING UPDATE for booking:", bookingId);
  let result;
  try {
    result = await applyBookingStatusChange(bookingId, "confirmed", {
      paymentProvider: "stripe",
      paymentIntentId,
      paidAt,
    });
    console.log("UPDATE SUCCESSFUL");
  } catch (error) {
    console.error("WEBHOOK DB ERROR:", error);
    return Response.json({ error: "Database update failed" }, { status: 500 });
  }

  if (result === null) {
    console.error("[stripe webhook] booking not found:", bookingId);
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  await revalidateBookingPaymentViews(result.villaId);
  console.log("Webhook success: status updated to confirmed");

  return Response.json({ received: true }, { status: 200 });
}

export async function POST(request: Request): Promise<Response> {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (webhookSecret === undefined || webhookSecret.length === 0) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return Response.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (signature === null) {
    return Response.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripeServerClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    console.error("[stripe webhook] signature verification failed:", message);
    return Response.json({ error: message }, { status: 400 });
  }

  console.log("WEBHOOK HIT: Received event", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (
      session.payment_status !== "paid" &&
      session.payment_status !== "no_payment_required"
    ) {
      return Response.json({ received: true }, { status: 200 });
    }

    return handleCheckoutSessionCompleted(session);
  }

  return Response.json({ received: true }, { status: 200 });
}
