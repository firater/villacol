/**
 * Display-time FX rates (EUR base). Never used by the pricing engine.
 */
import { asc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { exchangeRates } from "@/db/schema";
import type { Currency } from "@/lib/locales";

export type ExchangeRateRow = {
  quoteCurrency: Currency;
  /** Stored as numeric string from Postgres; parse at display time if needed. */
  rate: string;
  fetchedAt: Date;
  source: string | null;
};

export async function getExchangeRates(): Promise<ExchangeRateRow[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("exchange-rates");

  return db
    .select({
      quoteCurrency: exchangeRates.quoteCurrency,
      rate: exchangeRates.rate,
      fetchedAt: exchangeRates.fetchedAt,
      source: exchangeRates.source,
    })
    .from(exchangeRates)
    .orderBy(asc(exchangeRates.quoteCurrency));
}
