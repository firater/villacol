/**
 * Refreshes the display-only FX table. Every stored amount stays EUR cents, so
 * a bad rate here can never corrupt a price - only how one is rendered.
 */
import { revalidateTag } from "next/cache";

import { dbPool } from "@/db/pool";
import { exchangeRates } from "@/db/schema";
import { env } from "@/env";
import { BASE_CURRENCY } from "@/lib/money";

import type { CronJobResult } from "../types";

/** Everything in `CURRENCIES` except the base currency. */
const QUOTE_CURRENCIES = ["GBP", "RUB"] as const;

type QuoteCurrency = (typeof QUOTE_CURRENCIES)[number];

type FxResponse = {
  rates?: Record<string, unknown>;
};

async function fetchRates(): Promise<Record<string, number>> {
  const url = new URL(env.FX_API_URL);
  url.searchParams.set("from", BASE_CURRENCY);
  url.searchParams.set("to", QUOTE_CURRENCIES.join(","));
  if (env.FX_API_KEY !== undefined) {
    url.searchParams.set("apikey", env.FX_API_KEY);
  }

  // `no-store`: the whole point of this job is to bypass any cache.
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `FX provider responded ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as FxResponse;
  const rates = body.rates ?? {};
  const parsed: Record<string, number> = {};

  for (const currency of QUOTE_CURRENCIES) {
    const value = rates[currency];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      parsed[currency] = value;
    }
  }

  return parsed;
}

/**
 * Upserts EUR->GBP and EUR->RUB.
 *
 * A missing or non-positive rate is skipped rather than written: the previous
 * row survives and the run is marked failed, because showing yesterday's rate
 * is recoverable and writing a zero makes every converted price read as free.
 */
export async function refreshExchangeRates(): Promise<CronJobResult> {
  const rates = await fetchRates();
  const fetchedAt = new Date();

  let processedCount = 0;
  const missing: QuoteCurrency[] = [];

  for (const currency of QUOTE_CURRENCIES) {
    const rate = rates[currency];
    if (rate === undefined) {
      missing.push(currency);
      continue;
    }

    await dbPool
      .insert(exchangeRates)
      .values({
        baseCurrency: BASE_CURRENCY,
        quoteCurrency: currency,
        // `numeric` round-trips as a string; formatting here keeps the stored
        // scale predictable instead of depending on float formatting.
        rate: rate.toFixed(8),
        fetchedAt,
        source: env.FX_API_URL,
      })
      .onConflictDoUpdate({
        target: [exchangeRates.baseCurrency, exchangeRates.quoteCurrency],
        set: {
          rate: rate.toFixed(8),
          fetchedAt,
          source: env.FX_API_URL,
        },
      });

    processedCount += 1;
  }

  revalidateTag("exchange-rates", "max");

  if (missing.length > 0) {
    throw new Error(
      `FX provider returned no usable rate for ${missing.join(", ")}; kept the last known values`,
    );
  }

  return {
    processedCount,
    failedCount: 0,
    payload: {
      baseCurrency: BASE_CURRENCY,
      updated: QUOTE_CURRENCIES.filter((currency) => rates[currency] !== undefined),
      source: env.FX_API_URL,
    },
  };
}
