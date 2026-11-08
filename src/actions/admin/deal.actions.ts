"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

import { dbPool } from "@/db/pool";
import { deals } from "@/db/schema";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth-guard";
import {
  idSchema,
  localizedTextSchema,
  orderValueSchema,
} from "@/lib/validation";

const dealFieldsSchema = z.object({
  titleI18n: localizedTextSchema,
  bodyI18n: localizedTextSchema,
  link: z.string().trim().max(2_000).nullish(),
  startsAt: z.coerce.date().nullish(),
  endsAt: z.coerce.date().nullish(),
  isActive: z.boolean(),
  orderValue: orderValueSchema,
});

const createDealSchema = z
  .object({
    ...dealFieldsSchema.partial().shape,
    titleI18n: localizedTextSchema,
    bodyI18n: localizedTextSchema,
  })
  .refine(
    (value) =>
      value.startsAt == null ||
      value.endsAt == null ||
      value.startsAt <= value.endsAt,
    { message: "A deal cannot end before it starts", path: ["endsAt"] },
  );

const updateDealSchema = z.object({
  dealId: idSchema,
  ...dealFieldsSchema.partial().shape,
});

const setDealActiveSchema = z.object({
  dealId: idSchema,
  isActive: z.boolean(),
});

const deleteDealSchema = z.object({ dealId: idSchema });

/** `deal_reads` cascades on delete, so unread counts stay consistent. */
function afterDealWrite(): void {
  updateTag("deals");
}

export async function createDeal(
  input: z.input<typeof createDealSchema>,
): Promise<ActionResult<{ dealId: number }>> {
  try {
    await requireAdmin();

    const parsed = createDealSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const [created] = await dbPool
      .insert(deals)
      .values({
        ...parsed.data,
        link: parsed.data.link ?? null,
        startsAt: parsed.data.startsAt ?? null,
        endsAt: parsed.data.endsAt ?? null,
      })
      .returning({ id: deals.id });

    afterDealWrite();

    return ok({ dealId: created.id });
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateDeal(
  input: z.input<typeof updateDealSchema>,
): Promise<ActionResult<{ dealId: number }>> {
  try {
    await requireAdmin();

    const parsed = updateDealSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { dealId, link, startsAt, endsAt, ...changes } = parsed.data;

    const patch = {
      ...changes,
      ...(link === undefined ? {} : { link: link ?? null }),
      ...(startsAt === undefined ? {} : { startsAt: startsAt ?? null }),
      ...(endsAt === undefined ? {} : { endsAt: endsAt ?? null }),
    };

    if (Object.keys(patch).length === 0) return ok({ dealId });

    const [updated] = await dbPool
      .update(deals)
      .set(patch)
      .where(eq(deals.id, dealId))
      .returning({ id: deals.id });

    if (updated === undefined) {
      return { ok: false, error: `Deal ${dealId} does not exist.` };
    }

    afterDealWrite();

    return ok({ dealId });
  } catch (error) {
    return toActionError(error);
  }
}

export async function setDealActive(
  input: z.input<typeof setDealActiveSchema>,
): Promise<ActionResult<{ dealId: number; isActive: boolean }>> {
  try {
    await requireAdmin();

    const parsed = setDealActiveSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { dealId, isActive } = parsed.data;

    const [updated] = await dbPool
      .update(deals)
      .set({ isActive })
      .where(eq(deals.id, dealId))
      .returning({ id: deals.id });

    if (updated === undefined) {
      return { ok: false, error: `Deal ${dealId} does not exist.` };
    }

    afterDealWrite();

    return ok({ dealId, isActive });
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteDeal(
  input: z.input<typeof deleteDealSchema>,
): Promise<ActionResult<{ dealId: number }>> {
  try {
    await requireAdmin();

    const parsed = deleteDealSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const [deleted] = await dbPool
      .delete(deals)
      .where(eq(deals.id, parsed.data.dealId))
      .returning({ id: deals.id });

    if (deleted === undefined) {
      return { ok: false, error: `Deal ${parsed.data.dealId} does not exist.` };
    }

    afterDealWrite();

    return ok({ dealId: deleted.id });
  } catch (error) {
    return toActionError(error);
  }
}
