import { after, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

import { dbPool } from "@/db/pool";
import { bookings } from "@/db/schema";
import { env } from "@/env";
import { applyBookingStatusChange } from "@/lib/booking-status-update";
import {
  sendBookingConfirmedEmail,
  sendPaymentFailedEmail,
} from "@/lib/booking-status-notifications";
import { revalidateBookingPaymentViews } from "@/lib/revalidate-booking-views";
import { getStripeServerClient } from "@/lib/stripe";

const WEBHOOK_OK = NextResponse.json({ received: true }, { status: 200 });

async function resolveBookingIdFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
): Promise<string | null> {
  const fromMetadata = paymentIntent.metadata?.bookingId;
  if (fromMetadata !== undefined && fromMetadata.length > 0) {
    return fromMetadata;
  }

  const stripe = getStripeServerClient();
  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntent.id,
    limit: 1,
  });

  const session = sessions.data[0];
  const bookingId = session?.metadata?.bookingId;
  return bookingId !== undefined && bookingId.length > 0 ? bookingId : null;
}

function queuePaymentFailedNotification(bookingId: string): void {
  after(() => {
    void sendPaymentFailedEmail(bookingId).catch((error) => {
      console.error("[stripe webhook] payment failed email error:", bookingId, error);
    });
  });
}

function queueBookingConfirmedNotification(
  bookingId: string,
  statusChanged: boolean,
): void {
  if (!statusChanged) return;

  after(() => {
    void sendBookingConfirmedEmail(bookingId).catch((error) => {
      console.error("[stripe webhook] confirmed email error:", bookingId, error);
    });
  });
}

async function safeRevalidateBookingPaymentViews(villaId: number): Promise<void> {
  try {
    await revalidateBookingPaymentViews(villaId);
  } catch (error) {
    console.error("[stripe webhook] cache revalidation failed:", villaId, error);
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const bookingId = session.metadata?.bookingId;
  if (bookingId === undefined || bookingId.length === 0) {
    console.error("[stripe webhook] checkout.session.completed missing bookingId");
    return;
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
    return;
  }

  if (result === null) {
    console.error("[stripe webhook] booking not found:", bookingId);
    return;
  }

  await safeRevalidateBookingPaymentViews(result.villaId);
  console.log("Webhook success: status updated to confirmed");

  queueBookingConfirmedNotification(bookingId, !result.skipped);
}

async function handleCheckoutSessionExpired(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const bookingId = session.metadata?.bookingId;
  if (bookingId === undefined || bookingId.length === 0) {
    return;
  }

  const [row] = await dbPool
    .select({ status: bookings.status })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (row?.status === "confirmed") {
    return;
  }

  queuePaymentFailedNotification(bookingId);
}

async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> {
  const bookingId = await resolveBookingIdFromPaymentIntent(paymentIntent);
  if (bookingId === null) {
    return;
  }

  queuePaymentFailedNotification(bookingId);
}

async function dispatchStripeEvent(event: Stripe.Event): Promise<void> {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (
      session.payment_status !== "paid" &&
      session.payment_status !== "no_payment_required"
    ) {
      return;
    }

    await handleCheckoutSessionCompleted(session);
    return;
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutSessionExpired(session);
    return;
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    await handlePaymentIntentFailed(paymentIntent);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (webhookSecret === undefined || webhookSecret.length === 0) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (signature === null) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripeServerClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    console.error("[stripe webhook] signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    console.log("WEBHOOK HIT: Received event", event.type);
    await dispatchStripeEvent(event);
  } catch (error) {
    console.error("[stripe webhook] handler error:", error);
  }

  return WEBHOOK_OK;
}