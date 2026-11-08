"use server";

import { randomInt } from "node:crypto";

import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { dbPool } from "@/db/pool";
import { exitIntentCodes, promotions } from "@/db/schema";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { localize, type Locale, type LocalizedText } from "@/lib/locales";
import { resolvePreferences } from "@/lib/preferences";

/** How long an issued code stays usable. */
const CODE_TTL_HOURS = 72;

/**
 * Crockford-style alphabet: no I, L, O, U, or 0/1, so a code read off a screen
 * and typed back by hand cannot be ambiguous.
 */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LENGTH = 8;

function generateCode(): string {
  let code = "";
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return `SAVE-${code}`;
}

export type ExitIntentOffer = {
  code: string;
  expiresAt: Date;
  promotionId: number;
  /** Localized `display_name_i18n` of the promotion behind the code. */
  offerName: string;
  /** True when an existing live code was returned instead of a new one. */
  reused: boolean;
};

/**
 * The exit-intent promotion to hand out: the active one with the lowest
 * `priority_order`, so an admin controls which offer wins by the same column
 * the pricing chain is ordered by.
 */
async function findExitIntentPromotion(now: Date): Promise<{
  id: number;
  code: string | null;
  displayNameI18n: LocalizedText;
} | null> {
  const [row] = await db
    .select({
      id: promotions.id,
      code: promotions.code,
      displayNameI18n: promotions.displayNameI18n,
      bookingWindowEnd: promotions.bookingWindowEnd,
    })
    .from(promotions)
    .where(
      and(
        eq(promotions.triggerType, "exit_intent"),
        eq(promotions.isActive, true),
      ),
    )
    .orderBy(asc(promotions.priorityOrder), asc(promotions.id))
    .limit(1);

  if (row === undefined) return null;

  // Issuing a code for an offer whose booking window has already closed would
  // produce a code the engine refuses the moment it is used.
  if (
    row.bookingWindowEnd !== null &&
    String(row.bookingWindowEnd) < now.toISOString().slice(0, 10)
  ) {
    return null;
  }

  return { id: row.id, code: row.code, displayNameI18n: row.displayNameI18n };
}

/**
 * Mints a code for the current visitor, or returns the one they already have.
 *
 * Idempotent by design, and enforced in the schema too: the partial unique
 * index on `(visitor_id) where redeemed_at is null` means a visitor cannot
 * accumulate codes by triggering exit intent repeatedly.
 */
export async function issueExitIntentCode(): Promise<
  ActionResult<ExitIntentOffer | null>
> {
  try {
    const { locale, visitorId } = await resolvePreferences();
    if (visitorId === null) {
      return {
        ok: false,
        error: "No visitor session. Reload the page and try again.",
      };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CODE_TTL_HOURS * 3_600_000);

    const promotion = await findExitIntentPromotion(now);
    // No offer configured is a normal state, not an error: the modal simply
    // does not open.
    if (promotion === null) return ok(null);

    const offerName = localize(promotion.displayNameI18n, locale);

    const [existing] = await db
      .select({
        id: exitIntentCodes.id,
        code: exitIntentCodes.code,
        expiresAt: exitIntentCodes.expiresAt,
        promotionId: exitIntentCodes.promotionId,
      })
      .from(exitIntentCodes)
      .where(
        and(
          eq(exitIntentCodes.visitorId, visitorId),
          isNull(exitIntentCodes.redeemedAt),
        ),
      )
      .limit(1);

    if (existing !== undefined) {
      if (existing.expiresAt > now) {
        return ok({
          code: existing.code,
          expiresAt: existing.expiresAt,
          promotionId: existing.promotionId,
          offerName,
          reused: true,
        });
      }

      // Expired but unredeemed, so the partial unique index still counts it.
      // Rewriting the row in place is what keeps that index from rejecting a
      // fresh insert for a visitor who came back a week later.
      const [refreshed] = await dbPool
        .update(exitIntentCodes)
        .set({
          code: generateCode(),
          promotionId: promotion.id,
          issuedAt: now,
          expiresAt,
        })
        .where(eq(exitIntentCodes.id, existing.id))
        .returning({
          code: exitIntentCodes.code,
          expiresAt: exitIntentCodes.expiresAt,
          promotionId: exitIntentCodes.promotionId,
        });

      return ok({
        code: refreshed.code,
        expiresAt: refreshed.expiresAt,
        promotionId: refreshed.promotionId,
        offerName,
        reused: false,
      });
    }

    const [created] = await dbPool
      .insert(exitIntentCodes)
      .values({
        code: generateCode(),
        promotionId: promotion.id,
        visitorId,
        issuedAt: now,
        expiresAt,
      })
      .returning({
        code: exitIntentCodes.code,
        expiresAt: exitIntentCodes.expiresAt,
        promotionId: exitIntentCodes.promotionId,
      });

    return ok({
      code: created.code,
      expiresAt: created.expiresAt,
      promotionId: created.promotionId,
      offerName,
      reused: false,
    });
  } catch (error) {
    return toActionError(error);
  }
}

const validateExitIntentCodeSchema = z.object({
  code: z.string().trim().min(1).max(60),
});

export type ExitIntentValidation = {
  valid: boolean;
  /** Localized offer name when valid, so the form can confirm what applied. */
  offerName: string | null;
  expiresAt: Date | null;
  locale: Locale;
};

/**
 * Checks a code before the guest commits to a stay. Says nothing about whether
 * the underlying promotion will actually apply: minimum nights and travel
 * windows are the engine's call, re-evaluated at quote time.
 */
export async function validateExitIntentCode(
  input: z.input<typeof validateExitIntentCodeSchema>,
): Promise<ActionResult<ExitIntentValidation>> {
  try {
    const parsed = validateExitIntentCodeSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { locale } = await resolvePreferences();
    const now = new Date();

    const [row] = await db
      .select({
        expiresAt: exitIntentCodes.expiresAt,
        displayNameI18n: promotions.displayNameI18n,
        isActive: promotions.isActive,
      })
      .from(exitIntentCodes)
      .innerJoin(promotions, eq(promotions.id, exitIntentCodes.promotionId))
      .where(
        and(
          eq(exitIntentCodes.code, parsed.data.code),
          isNull(exitIntentCodes.redeemedAt),
          gt(exitIntentCodes.expiresAt, now),
        ),
      )
      .limit(1);

    if (row === undefined || !row.isActive) {
      return ok({ valid: false, offerName: null, expiresAt: null, locale });
    }

    return ok({
      valid: true,
      offerName: localize(row.displayNameI18n, locale),
      expiresAt: row.expiresAt,
      locale,
    });
  } catch (error) {
    return toActionError(error);
  }
}
