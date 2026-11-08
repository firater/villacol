"use server";

import { and, eq, inArray } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

import { dbPool } from "@/db/pool";
import { promotions, villaPromotions } from "@/db/schema";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth-guard";
import { enqueueVillaCacheRebuildMany } from "@/lib/cron/trigger";
import {
  centsSchema,
  dateStringSchema,
  idSchema,
  localizedTextSchema,
  orderValueSchema,
} from "@/lib/validation";

/**
 * The discount value shape, as a discriminated union.
 *
 * This mirrors `promotions_value_shape_check` in the schema. Validating it here
 * too means an admin gets "percentBp is required" on the field instead of a raw
 * constraint-violation error from Postgres.
 */
const discountValueSchema = z.discriminatedUnion("discountType", [
  z.object({
    discountType: z.literal("percentage"),
    percentBp: z.number().int().min(1).max(10_000),
  }),
  z.object({
    discountType: z.literal("fixed_amount"),
    fixedAmountCents: centsSchema.min(1),
  }),
  z.object({
    discountType: z.literal("free_days"),
    freeNights: z.number().int().min(1).max(364),
    freeNightsThreshold: z.number().int().min(2).max(365),
  }),
]);

/** Mirrors `promotions_trigger_shape_check`. */
const triggerSchema = z.discriminatedUnion("triggerType", [
  z.object({ triggerType: z.literal("always") }),
  z.object({
    triggerType: z.literal("long_stay"),
    minNights: z.number().int().min(1).max(365),
    maxNights: z.number().int().min(1).max(365).nullish(),
  }),
  z.object({
    triggerType: z.literal("last_minute"),
    lastMinuteWithinDays: z.number().int().min(0).max(365),
  }),
  z.object({
    triggerType: z.literal("early_bird"),
    earlyBirdMinDays: z.number().int().min(1).max(730),
  }),
  z.object({
    triggerType: z.literal("coupon"),
    code: z.string().trim().min(3).max(40),
  }),
  z.object({
    triggerType: z.literal("exit_intent"),
    code: z.string().trim().min(3).max(40),
  }),
]);

const promotionBaseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  displayNameI18n: localizedTextSchema,
  descriptionI18n: localizedTextSchema.nullish(),
  bookingWindowStart: dateStringSchema.nullish(),
  bookingWindowEnd: dateStringSchema.nullish(),
  travelWindowStart: dateStringSchema.nullish(),
  travelWindowEnd: dateStringSchema.nullish(),
  priorityOrder: orderValueSchema,
  isStackable: z.boolean(),
  isActive: z.boolean(),
  maxRedemptions: z.number().int().min(1).nullish(),
  overrideMinNights: z.number().int().min(1).max(365).nullish(),
});

const createPromotionSchema = z
  .object({
    ...promotionBaseSchema.shape,
    discount: discountValueSchema,
    trigger: triggerSchema,
  })
  .refine(
    (value) =>
      value.discount.discountType !== "free_days" ||
      value.discount.freeNights < value.discount.freeNightsThreshold,
    {
      message: "`freeNights` must be smaller than `freeNightsThreshold`",
      path: ["discount", "freeNights"],
    },
  )
  .refine(
    (value) =>
      value.bookingWindowStart == null ||
      value.bookingWindowEnd == null ||
      value.bookingWindowStart <= value.bookingWindowEnd,
    { message: "Booking window ends before it starts", path: ["bookingWindowEnd"] },
  )
  .refine(
    (value) =>
      value.travelWindowStart == null ||
      value.travelWindowEnd == null ||
      value.travelWindowStart <= value.travelWindowEnd,
    { message: "Travel window ends before it starts", path: ["travelWindowEnd"] },
  );

const updatePromotionSchema = z.object({
  promotionId: idSchema,
  ...promotionBaseSchema.partial().shape,
  discount: discountValueSchema.optional(),
  trigger: triggerSchema.optional(),
});

const setPromotionActiveSchema = z.object({
  promotionId: idSchema,
  isActive: z.boolean(),
});

const setPromotionPrioritySchema = z.object({
  promotionId: idSchema,
  priorityOrder: orderValueSchema,
});

const setPromotionStackableSchema = z.object({
  promotionId: idSchema,
  isStackable: z.boolean(),
});

const attachPromotionSchema = z.object({
  promotionId: idSchema,
  villaIds: z.array(idSchema).min(1).max(500),
  priorityOverride: orderValueSchema.nullish(),
});

const detachPromotionSchema = z.object({
  promotionId: idSchema,
  villaIds: z.array(idSchema).min(1).max(500),
});

/** Every discount column, so switching a promotion's type clears the old value. */
function discountColumns(
  discount: z.output<typeof discountValueSchema>,
): {
  discountType: "percentage" | "fixed_amount" | "free_days";
  percentBp: number | null;
  fixedAmountCents: number | null;
  freeNights: number | null;
  freeNightsThreshold: number | null;
} {
  return {
    discountType: discount.discountType,
    percentBp: discount.discountType === "percentage" ? discount.percentBp : null,
    fixedAmountCents:
      discount.discountType === "fixed_amount" ? discount.fixedAmountCents : null,
    freeNights: discount.discountType === "free_days" ? discount.freeNights : null,
    freeNightsThreshold:
      discount.discountType === "free_days"
        ? discount.freeNightsThreshold
        : null,
  };
}

/** Same idea for trigger conditions: a stale `min_nights` would re-gate the promo. */
function triggerColumns(trigger: z.output<typeof triggerSchema>): {
  triggerType: z.output<typeof triggerSchema>["triggerType"];
  minNights: number | null;
  maxNights: number | null;
  lastMinuteWithinDays: number | null;
  earlyBirdMinDays: number | null;
  code: string | null;
} {
  return {
    triggerType: trigger.triggerType,
    minNights: trigger.triggerType === "long_stay" ? trigger.minNights : null,
    maxNights:
      trigger.triggerType === "long_stay" ? (trigger.maxNights ?? null) : null,
    lastMinuteWithinDays:
      trigger.triggerType === "last_minute" ? trigger.lastMinuteWithinDays : null,
    earlyBirdMinDays:
      trigger.triggerType === "early_bird" ? trigger.earlyBirdMinDays : null,
    code:
      trigger.triggerType === "coupon" || trigger.triggerType === "exit_intent"
        ? trigger.code
        : null,
  };
}

/**
 * Every villa the promotion is attached to, so a single promotion edit rebuilds
 * each affected card rather than waiting for the nightly sweep.
 */
async function affectedVillaIds(promotionId: number): Promise<number[]> {
  const rows = await dbPool
    .select({ villaId: villaPromotions.villaId })
    .from(villaPromotions)
    .where(eq(villaPromotions.promotionId, promotionId));

  return rows.map((row) => row.villaId);
}

function afterPromotionWrite(villaIds: readonly number[]): void {
  updateTag("villas");
  updateTag("offers");
  for (const villaId of villaIds) {
    updateTag(`villa-${villaId}`);
  }
  enqueueVillaCacheRebuildMany(villaIds, "promotion_edit");
}

export async function createPromotion(
  input: z.input<typeof createPromotionSchema>,
): Promise<ActionResult<{ promotionId: number }>> {
  try {
    await requireAdmin();

    const parsed = createPromotionSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { discount, trigger, descriptionI18n, ...rest } = parsed.data;

    const [created] = await dbPool
      .insert(promotions)
      .values({
        ...rest,
        descriptionI18n: descriptionI18n ?? null,
        bookingWindowStart: rest.bookingWindowStart ?? null,
        bookingWindowEnd: rest.bookingWindowEnd ?? null,
        travelWindowStart: rest.travelWindowStart ?? null,
        travelWindowEnd: rest.travelWindowEnd ?? null,
        maxRedemptions: rest.maxRedemptions ?? null,
        ...discountColumns(discount),
        ...triggerColumns(trigger),
      })
      .returning({ id: promotions.id });

    // A brand-new promotion has no villas attached yet, so nothing to rebuild.
    updateTag("villas");
    updateTag("offers");

    return ok({ promotionId: created.id });
  } catch (error) {
    return toActionError(error);
  }
}

export async function updatePromotion(
  input: z.input<typeof updatePromotionSchema>,
): Promise<ActionResult<{ promotionId: number; affectedVillaIds: number[] }>> {
  try {
    await requireAdmin();

    const parsed = updatePromotionSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { promotionId, discount, trigger, descriptionI18n, ...rest } =
      parsed.data;

    const [updated] = await dbPool
      .update(promotions)
      .set({
        ...rest,
        ...(descriptionI18n === undefined
          ? {}
          : { descriptionI18n: descriptionI18n ?? null }),
        ...(discount === undefined ? {} : discountColumns(discount)),
        ...(trigger === undefined ? {} : triggerColumns(trigger)),
        updatedAt: new Date(),
      })
      .where(eq(promotions.id, promotionId))
      .returning({ id: promotions.id });

    if (updated === undefined) {
      return { ok: false, error: `Promotion ${promotionId} does not exist.` };
    }

    const villaIds = await affectedVillaIds(promotionId);
    afterPromotionWrite(villaIds);

    return ok({ promotionId, affectedVillaIds: villaIds });
  } catch (error) {
    return toActionError(error);
  }
}

export async function setPromotionActive(
  input: z.input<typeof setPromotionActiveSchema>,
): Promise<ActionResult<{ promotionId: number; affectedVillaIds: number[] }>> {
  try {
    await requireAdmin();

    const parsed = setPromotionActiveSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { promotionId, isActive } = parsed.data;

    const [updated] = await dbPool
      .update(promotions)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(promotions.id, promotionId))
      .returning({ id: promotions.id });

    if (updated === undefined) {
      return { ok: false, error: `Promotion ${promotionId} does not exist.` };
    }

    const villaIds = await affectedVillaIds(promotionId);
    afterPromotionWrite(villaIds);

    return ok({ promotionId, affectedVillaIds: villaIds });
  } catch (error) {
    return toActionError(error);
  }
}

export async function setPromotionPriority(
  input: z.input<typeof setPromotionPrioritySchema>,
): Promise<ActionResult<{ promotionId: number; affectedVillaIds: number[] }>> {
  try {
    await requireAdmin();

    const parsed = setPromotionPrioritySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { promotionId, priorityOrder } = parsed.data;

    const [updated] = await dbPool
      .update(promotions)
      .set({ priorityOrder, updatedAt: new Date() })
      .where(eq(promotions.id, promotionId))
      .returning({ id: promotions.id });

    if (updated === undefined) {
      return { ok: false, error: `Promotion ${promotionId} does not exist.` };
    }

    // Priority is the order discounts compound in, so this changes totals.
    const villaIds = await affectedVillaIds(promotionId);
    afterPromotionWrite(villaIds);

    return ok({ promotionId, affectedVillaIds: villaIds });
  } catch (error) {
    return toActionError(error);
  }
}

export async function setPromotionStackable(
  input: z.input<typeof setPromotionStackableSchema>,
): Promise<ActionResult<{ promotionId: number; affectedVillaIds: number[] }>> {
  try {
    await requireAdmin();

    const parsed = setPromotionStackableSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { promotionId, isStackable } = parsed.data;

    const [updated] = await dbPool
      .update(promotions)
      .set({ isStackable, updatedAt: new Date() })
      .where(eq(promotions.id, promotionId))
      .returning({ id: promotions.id });

    if (updated === undefined) {
      return { ok: false, error: `Promotion ${promotionId} does not exist.` };
    }

    const villaIds = await affectedVillaIds(promotionId);
    afterPromotionWrite(villaIds);

    return ok({ promotionId, affectedVillaIds: villaIds });
  } catch (error) {
    return toActionError(error);
  }
}

export async function attachPromotionToVillas(
  input: z.input<typeof attachPromotionSchema>,
): Promise<ActionResult<{ promotionId: number; villaIds: number[] }>> {
  try {
    await requireAdmin();

    const parsed = attachPromotionSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { promotionId, villaIds, priorityOverride } = parsed.data;

    await dbPool.transaction(async (tx) => {
      for (const villaId of villaIds) {
        await tx
          .insert(villaPromotions)
          .values({
            villaId,
            promotionId,
            priorityOverride: priorityOverride ?? null,
          })
          .onConflictDoUpdate({
            target: [villaPromotions.villaId, villaPromotions.promotionId],
            set: { priorityOverride: priorityOverride ?? null },
          });
      }
    });

    afterPromotionWrite(villaIds);

    return ok({ promotionId, villaIds });
  } catch (error) {
    return toActionError(error);
  }
}

export async function detachPromotionFromVillas(
  input: z.input<typeof detachPromotionSchema>,
): Promise<ActionResult<{ promotionId: number; villaIds: number[] }>> {
  try {
    await requireAdmin();

    const parsed = detachPromotionSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { promotionId, villaIds } = parsed.data;

    await dbPool
      .delete(villaPromotions)
      .where(
        and(
          eq(villaPromotions.promotionId, promotionId),
          inArray(villaPromotions.villaId, villaIds),
        ),
      );

    // The rebuild is what removes the now-phantom discount from each card.
    afterPromotionWrite(villaIds);

    return ok({ promotionId, villaIds });
  } catch (error) {
    return toActionError(error);
  }
}
