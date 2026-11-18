import { sql } from "drizzle-orm";

import {
  promotions,
  villaCalendar,
  villaPromotions,
  villas,
} from "@/db/schema";
import type { DateString } from "@/lib/dates";

/** Night count for half-open stay `[checkIn, checkOut)`. */
export function listingStayRequestedNightsSql(
  checkIn: DateString,
  checkOut: DateString,
) {
  return sql`(${checkOut}::date - ${checkIn}::date)`;
}

/**
 * Mirrors `resolveEffectiveMinStay` at listing scale: check-in night calendar
 * min stay, villa default, then promotion `override_min_nights` overrides.
 */
export function listingEffectiveMinStaySql(checkIn: DateString) {
  const calendarMin = sql`(
    SELECT ${villaCalendar.minStay}
    FROM ${villaCalendar}
    WHERE ${villaCalendar.villaId} = ${villas.id}
      AND ${villaCalendar.date} = ${checkIn}::date
    LIMIT 1
  )`;
  const baseMin = sql`COALESCE(${calendarMin}, ${villas.defaultMinStay})`;
  const promoOverride = sql`(
    SELECT MIN(${promotions.overrideMinNights})
    FROM ${villaPromotions}
    INNER JOIN ${promotions} ON ${promotions.id} = ${villaPromotions.promotionId}
    WHERE ${villaPromotions.villaId} = ${villas.id}
      AND ${promotions.isActive} = true
      AND ${promotions.overrideMinNights} IS NOT NULL
      AND ${promotions.overrideMinNights} > 0
  )`;
  return sql`LEAST(${baseMin}, COALESCE(${promoOverride}, ${baseMin}))`;
}

/** `0` = stay length meets min stay; `1` = min stay not met (sort after tier `0`). */
export function listingMinStaySortTierSql(
  checkIn: DateString,
  checkOut: DateString,
) {
  const requested = listingStayRequestedNightsSql(checkIn, checkOut);
  const effective = listingEffectiveMinStaySql(checkIn);
  return sql`CASE WHEN ${requested} >= ${effective} THEN 0 ELSE 1 END`;
}