import Stripe from "stripe";

import { env } from "@/env";

let stripeClient: Stripe | null = null;

export function requireStripeSecretKey(): string {
  const key = env.STRIPE_SECRET_KEY;
  if (key === undefined || key.length === 0) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add your Stripe test secret key to the environment.",
    );
  }
  return key;
}

export function getStripeServerClient(): Stripe {
  if (stripeClient === null) {
    stripeClient = new Stripe(requireStripeSecretKey(), {
      apiVersion: "2026-10-28.endive",
      typescript: true,
    });
  }
  return stripeClient;
}
