"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

import { dbPool } from "@/db/pool";
import { villaRules } from "@/db/schema";
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
  reorderSchema,
  slugSchema,
} from "@/lib/validation";

const ruleFieldsSchema = z.object({
  labelI18n: localizedTextSchema,
  descriptionI18n: localizedTextSchema.nullish(),
  icon: z.string().trim().max(80).nullish(),
  orderValue: orderValueSchema,
});

const createVillaRuleSchema = z.object({
  key: slugSchema,
  ...ruleFieldsSchema.partial().shape,
  labelI18n: localizedTextSchema,
});

const updateVillaRuleSchema = z.object({
  ruleId: idSchema,
  key: slugSchema.optional(),
  ...ruleFieldsSchema.partial().shape,
});

const reorderVillaRulesSchema = z.object({ items: reorderSchema });

function afterRuleWrite(): void {
  updateTag("villas");
}

export async function createVillaRule(
  input: z.input<typeof createVillaRuleSchema>,
): Promise<ActionResult<{ ruleId: number }>> {
  try {
    await requireAdmin();

    const parsed = createVillaRuleSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const [created] = await dbPool
      .insert(villaRules)
      .values({
        ...parsed.data,
        descriptionI18n: parsed.data.descriptionI18n ?? null,
        icon: parsed.data.icon ?? null,
      })
      .returning({ id: villaRules.id });

    afterRuleWrite();

    return ok({ ruleId: created.id });
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateVillaRule(
  input: z.input<typeof updateVillaRuleSchema>,
): Promise<ActionResult<{ ruleId: number }>> {
  try {
    await requireAdmin();

    const parsed = updateVillaRuleSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { ruleId, descriptionI18n, ...changes } = parsed.data;

    const patch = {
      ...changes,
      ...(descriptionI18n === undefined
        ? {}
        : { descriptionI18n: descriptionI18n ?? null }),
    };

    if (Object.keys(patch).length === 0) return ok({ ruleId });

    const [updated] = await dbPool
      .update(villaRules)
      .set(patch)
      .where(eq(villaRules.id, ruleId))
      .returning({ id: villaRules.id });

    if (updated === undefined) {
      return { ok: false, error: `Villa rule ${ruleId} does not exist.` };
    }

    afterRuleWrite();

    return ok({ ruleId });
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderVillaRules(
  input: z.input<typeof reorderVillaRulesSchema>,
): Promise<ActionResult<{ ruleIds: number[] }>> {
  try {
    await requireAdmin();

    const parsed = reorderVillaRulesSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { items } = parsed.data;

    await dbPool.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(villaRules)
          .set({ orderValue: item.orderValue })
          .where(eq(villaRules.id, item.id));
      }
    });

    afterRuleWrite();

    return ok({ ruleIds: items.map((item) => item.id) });
  } catch (error) {
    return toActionError(error);
  }
}
