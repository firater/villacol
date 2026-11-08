"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

import { dbPool } from "@/db/pool";
import { amenities } from "@/db/schema";
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

const amenityFieldsSchema = z.object({
  labelI18n: localizedTextSchema,
  icon: z.string().trim().max(80).nullish(),
  group: z.string().trim().max(80).nullish(),
  isFilterable: z.boolean(),
  orderValue: orderValueSchema,
});

const createAmenitySchema = z.object({
  /** Universal English key, also the `?amenities=` query value. */
  key: slugSchema,
  ...amenityFieldsSchema.partial().shape,
  labelI18n: localizedTextSchema,
});

const updateAmenitySchema = z.object({
  amenityId: idSchema,
  key: slugSchema.optional(),
  ...amenityFieldsSchema.partial().shape,
});

const reorderAmenitiesSchema = z.object({ items: reorderSchema });

/** Amenity labels are embedded in the cached villa detail bundle. */
function afterAmenityWrite(): void {
  updateTag("villas");
}

export async function createAmenity(
  input: z.input<typeof createAmenitySchema>,
): Promise<ActionResult<{ amenityId: number }>> {
  try {
    await requireAdmin();

    const parsed = createAmenitySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const [created] = await dbPool
      .insert(amenities)
      .values({
        ...parsed.data,
        icon: parsed.data.icon ?? null,
        group: parsed.data.group ?? null,
      })
      .returning({ id: amenities.id });

    afterAmenityWrite();

    return ok({ amenityId: created.id });
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateAmenity(
  input: z.input<typeof updateAmenitySchema>,
): Promise<ActionResult<{ amenityId: number }>> {
  try {
    await requireAdmin();

    const parsed = updateAmenitySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { amenityId, ...changes } = parsed.data;

    if (Object.keys(changes).length === 0) return ok({ amenityId });

    const [updated] = await dbPool
      .update(amenities)
      .set(changes)
      .where(eq(amenities.id, amenityId))
      .returning({ id: amenities.id });

    if (updated === undefined) {
      return { ok: false, error: `Amenity ${amenityId} does not exist.` };
    }

    afterAmenityWrite();
    // Amenity labels are indexed into every villa that has them.
    enqueueFullSearchReindex("admin_edit");

    return ok({ amenityId });
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderAmenities(
  input: z.input<typeof reorderAmenitiesSchema>,
): Promise<ActionResult<{ amenityIds: number[] }>> {
  try {
    await requireAdmin();

    const parsed = reorderAmenitiesSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { items } = parsed.data;

    await dbPool.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(amenities)
          .set({ orderValue: item.orderValue })
          .where(eq(amenities.id, item.id));
      }
    });

    afterAmenityWrite();

    return ok({ amenityIds: items.map((item) => item.id) });
  } catch (error) {
    return toActionError(error);
  }
}
