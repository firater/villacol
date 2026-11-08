/**
 * Admin promotion reads (uncached).
 */
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { promotions, villaPromotions } from "@/db/schema";

export type AdminPromotionListRow = {
  id: number;
  name: string;
  discountType: string;
  triggerType: string;
  percentBp: number | null;
  fixedAmountCents: number | null;
  freeNights: number | null;
  freeNightsThreshold: number | null;
  isActive: boolean;
  priorityOrder: number;
};

export async function listAdminPromotions(): Promise<AdminPromotionListRow[]> {
  return db
    .select({
      id: promotions.id,
      name: promotions.name,
      discountType: promotions.discountType,
      triggerType: promotions.triggerType,
      percentBp: promotions.percentBp,
      fixedAmountCents: promotions.fixedAmountCents,
      freeNights: promotions.freeNights,
      freeNightsThreshold: promotions.freeNightsThreshold,
      isActive: promotions.isActive,
      priorityOrder: promotions.priorityOrder,
    })
    .from(promotions)
    .orderBy(asc(promotions.priorityOrder), asc(promotions.id));
}

export type AdminPromotionDetailRow = {
  id: number;
  name: string;
  displayNameI18n: { en: string; de?: string; ru?: string };
  discountType: string;
  triggerType: string;
  percentBp: number | null;
  fixedAmountCents: number | null;
  freeNights: number | null;
  freeNightsThreshold: number | null;
  minNights: number | null;
  maxNights: number | null;
  lastMinuteWithinDays: number | null;
  earlyBirdMinDays: number | null;
  code: string | null;
  isActive: boolean;
  isStackable: boolean;
  priorityOrder: number;
  overrideMinNights: number | null;
};

export type AdminActivePromotionOption = {
  id: number;
  name: string;
};

/** Active promotions available for linking to villas. */
export async function listActivePromotionsForVillaLink(): Promise<
  AdminActivePromotionOption[]
> {
  return db
    .select({
      id: promotions.id,
      name: promotions.name,
    })
    .from(promotions)
    .where(eq(promotions.isActive, true))
    .orderBy(asc(promotions.priorityOrder), asc(promotions.id));
}

export async function getPromotionIdsAttachedToVilla(
  villaId: number,
): Promise<number[]> {
  const rows = await db
    .select({ promotionId: villaPromotions.promotionId })
    .from(villaPromotions)
    .where(eq(villaPromotions.villaId, villaId));

  return rows.map((r) => r.promotionId);
}

export async function getAdminPromotionForEdit(
  promotionId: number,
): Promise<AdminPromotionDetailRow | null> {
  const [row] = await db
    .select({
      id: promotions.id,
      name: promotions.name,
      displayNameI18n: promotions.displayNameI18n,
      discountType: promotions.discountType,
      triggerType: promotions.triggerType,
      percentBp: promotions.percentBp,
      fixedAmountCents: promotions.fixedAmountCents,
      freeNights: promotions.freeNights,
      freeNightsThreshold: promotions.freeNightsThreshold,
      minNights: promotions.minNights,
      maxNights: promotions.maxNights,
      lastMinuteWithinDays: promotions.lastMinuteWithinDays,
      earlyBirdMinDays: promotions.earlyBirdMinDays,
      code: promotions.code,
      isActive: promotions.isActive,
      isStackable: promotions.isStackable,
      priorityOrder: promotions.priorityOrder,
      overrideMinNights: promotions.overrideMinNights,
    })
    .from(promotions)
    .where(eq(promotions.id, promotionId))
    .limit(1);

  if (row === undefined) return null;

  return {
    ...row,
    displayNameI18n: row.displayNameI18n as AdminPromotionDetailRow["displayNameI18n"],
  };
}
