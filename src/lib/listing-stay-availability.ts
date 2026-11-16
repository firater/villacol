import { sql } from "drizzle-orm";

import { villas } from "@/db/schema";
import type { DateString } from "@/lib/dates";

/**
 * SQL predicate: every night in `[checkIn, checkOut)` is bookable, matching
 * `buildNightRates` (blocked calendar rows or missing default nightly).
 */
export function villaBookableForStaySql(checkIn: DateString, checkOut: DateString) {
  return sql`NOT EXISTS (
    SELECT 1
    FROM generate_series(
      ${checkIn}::date,
      (${checkOut}::date - interval '1 day')::date,
      interval '1 day'
    ) AS gs(night)
    WHERE (
      EXISTS (
        SELECT 1 FROM villa_calendar vc
        WHERE vc.villa_id = ${villas.id}
          AND vc.date = gs.night::date
          AND (
            vc.is_blocked = true
            OR (
              vc.price_cents IS NULL
              AND ${villas.defaultNightlyPriceCents} IS NULL
            )
          )
      )
      OR (
        NOT EXISTS (
          SELECT 1 FROM villa_calendar vc
          WHERE vc.villa_id = ${villas.id}
            AND vc.date = gs.night::date
        )
        AND ${villas.defaultNightlyPriceCents} IS NULL
      )
    )
  )`;
}