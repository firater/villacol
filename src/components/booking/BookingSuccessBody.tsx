import { connection } from "next/server";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { env } from "@/env";
import { verifyCheckoutSessionPayment } from "@/lib/stripe-checkout-verify";

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export async function BookingSuccessBody({ searchParams }: Props) {
  await connection();

  const resolved = await searchParams;
  const sessionId = resolved.session_id?.trim();

  const isStripeReturn =
    sessionId !== undefined &&
    sessionId.length > 0 &&
    env.STRIPE_SECRET_KEY !== undefined;

  let paymentConfirmed = false;
  if (isStripeReturn) {
    const verified = await verifyCheckoutSessionPayment(sessionId);
    paymentConfirmed = verified?.paid === true;
  }

  const t = await getTranslations(
    paymentConfirmed ? "booking.paymentSuccess" : "booking.success",
  );

  return (
    <div className="max-w-md text-center">
      <h1 className="font-serif text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t("title")}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
        {t("body")}
      </p>
      {paymentConfirmed ? (
        <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {t("confirmedHint")}
        </p>
      ) : null}
      <Link
        href="/villas"
        className="mt-8 inline-flex rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {t("backToVillas")}
      </Link>
    </div>
  );
}
