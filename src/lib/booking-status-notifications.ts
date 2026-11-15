import { and, eq } from "drizzle-orm";

import { dbPool } from "@/db/pool";
import { bookings, villaTranslations } from "@/db/schema";
import type { PriceBreakdownSnapshot } from "@/db/tables/bookings";
import type { BookingStatus } from "@/db/tables/enums";
import { sendEmail } from "@/lib/email/send";
import {
  renderAwaitingPaymentEmail,
  renderBookingCancelledEmail,
  renderBookingConfirmedEmail,
  renderPaymentFailedEmail,
} from "@/lib/email/templates";
import {
  DEFAULT_LOCALE,
  isLocale,
  type Currency,
  type Locale,
} from "@/lib/locales";
import type { Cents } from "@/lib/money";
import { createCheckoutSessionForBooking } from "@/lib/stripe-checkout-session";

type BookingEmailContext = {
  id: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  locale: Locale;
  displayCurrency: Currency;
  displayTotalCents: Cents;
  villaTitle: string;
};

function resolveBookingLocale(priceBreakdown: PriceBreakdownSnapshot): Locale {
  const quoted = priceBreakdown.quotedLocale;
  if (typeof quoted === "string" && isLocale(quoted)) {
    return quoted;
  }
  return DEFAULT_LOCALE;
}

async function loadBookingEmailContext(
  bookingId: string,
): Promise<BookingEmailContext | null> {
  const [row] = await dbPool
    .select({
      id: bookings.id,
      guestName: bookings.guestName,
      guestEmail: bookings.guestEmail,
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
      displayCurrency: bookings.displayCurrency,
      displayTotalCents: bookings.displayTotalCents,
      priceBreakdown: bookings.priceBreakdown,
      villaId: bookings.villaId,
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (row === undefined) return null;

  const locale = resolveBookingLocale(row.priceBreakdown);

  const [villaRow] = await dbPool
    .select({ title: villaTranslations.title })
    .from(villaTranslations)
    .where(
      and(
        eq(villaTranslations.villaId, row.villaId),
        eq(villaTranslations.locale, locale),
      ),
    )
    .limit(1);

  return {
    id: row.id,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    checkIn: String(row.checkIn),
    checkOut: String(row.checkOut),
    locale,
    displayCurrency: row.displayCurrency,
    displayTotalCents: row.displayTotalCents,
    villaTitle: villaRow?.title ?? "Villa",
  };
}

async function deliver(
  ctx: BookingEmailContext,
  email: {
    subject: string;
    html: string;
    text: string;
  },
): Promise<void> {
  await sendEmail({
    to: ctx.guestEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

export async function sendBookingConfirmedEmail(bookingId: string): Promise<void> {
  const ctx = await loadBookingEmailContext(bookingId);
  if (ctx === null) return;
  const email = renderBookingConfirmedEmail(ctx);
  await deliver(ctx, email);
}

export async function sendPaymentFailedEmail(bookingId: string): Promise<void> {
  const ctx = await loadBookingEmailContext(bookingId);
  if (ctx === null) return;
  const email = renderPaymentFailedEmail(ctx);
  await deliver(ctx, email);
}

export async function sendBookingCancelledEmail(bookingId: string): Promise<void> {
  const ctx = await loadBookingEmailContext(bookingId);
  if (ctx === null) return;
  const email = renderBookingCancelledEmail(ctx);
  await deliver(ctx, email);
}

export async function sendAwaitingPaymentEmail(bookingId: string): Promise<void> {
  const ctx = await loadBookingEmailContext(bookingId);
  if (ctx === null) return;

  const checkoutUrl = await createCheckoutSessionForBooking(bookingId, ctx.locale);
  const email = renderAwaitingPaymentEmail({ ...ctx, checkoutUrl });
  await deliver(ctx, email);
}

/**
 * Fire-and-forget dispatcher for admin status changes (never blocks the admin UI).
 */
export function queueBookingStatusNotification(
  bookingId: string,
  status: BookingStatus,
  options: { statusChanged: boolean },
): void {
  if (!options.statusChanged) return;

  const run = async () => {
    if (status === "awaiting_payment") {
      await sendAwaitingPaymentEmail(bookingId);
      return;
    }
    if (status === "confirmed") {
      await sendBookingConfirmedEmail(bookingId);
      return;
    }
    if (status === "cancelled") {
      await sendBookingCancelledEmail(bookingId);
    }
  };

  void run().catch((error) => {
    console.error("[booking status email]", status, bookingId, error);
  });
}
