"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

import { dbPool } from "@/db/pool";
import { features } from "@/db/schema";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth-guard";
import { enqueueFullSearchReindex } from "@/lib/cron/trigger";
import {
  idSchema,
  localizedTextSchema,
  orderValueSchema,
  reorderSchema,
  slugSchema,
} from "@/lib/validation";

const featureFieldsSchema = z.object({
  labelI18n: localizedTextSchema,
  icon: z.string().trim().max(80).nullish(),
  group: z.string().trim().max(80).nullish(),
  isFilterable: z.boolean(),
  orderValue: orderValueSchema,
});

const createFeatureSchema = z.object({
  key: slugSchema,
  ...featureFieldsSchema.partial().shape,
  labelI18n: localizedTextSchema,
});

const updateFeatureSchema = z.object({
  featureId: idSchema,
  key: slugSchema.optional(),
  ...featureFieldsSchema.partial().shape,
});

const reorderFeaturesSchema = z.object({ items: reorderSchema });

function afterFeatureWrite(): void {
  updateTag("villas");
}

export async function createFeature(
  input: z.input<typeof createFeatureSchema>,
): Promise<ActionResult<{ featureId: number }>> {
  try {
    await requireAdmin();

    const parsed = createFeatureSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const [created] = await dbPool
      .insert(features)
      .values({
        ...parsed.data,
        icon: parsed.data.icon ?? null,
        group: parsed.data.group ?? null,
      })
      .returning({ id: features.id });

    afterFeatureWrite();

    return ok({ featureId: created.id });
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateFeature(
  input: z.input<typeof updateFeatureSchema>,
): Promise<ActionResult<{ featureId: number }>> {
  try {
    await requireAdmin();

    const parsed = updateFeatureSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { featureId, ...changes } = parsed.data;

    if (Object.keys(changes).length === 0) return ok({ featureId });

    const [updated] = await dbPool
      .update(features)
      .set(changes)
      .where(eq(features.id, featureId))
      .returning({ id: features.id });

    if (updated === undefined) {
      return { ok: false, error: `Feature ${featureId} does not exist.` };
    }

    afterFeatureWrite();
    // Feature labels are indexed into every villa that has them.
    enqueueFullSearchReindex("admin_edit");

    return ok({ featureId });
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderFeatures(
  input: z.input<typeof reorderFeaturesSchema>,
): Promise<ActionResult<{ featureIds: number[] }>> {
  try {
    await requireAdmin();

    const parsed = reorderFeaturesSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { items } = parsed.data;

    await dbPool.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(features)
          .set({ orderValue: item.orderValue })
          .where(eq(features.id, item.id));
      }
    });

    afterFeatureWrite();

    return ok({ featureIds: items.map((item) => item.id) });
  } catch (error) {
    return toActionError(error);
  }
}
