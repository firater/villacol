"use server";

import { and, eq, ne } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

import { dbPool } from "@/db/pool";
import { villaImages } from "@/db/schema";
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
  uuidSchema,
} from "@/lib/validation";

const createVillaImageSchema = z.object({
  villaId: idSchema,
  url: z.string().url().max(2_000),
  altI18n: localizedTextSchema.nullish(),
  orderValue: orderValueSchema.optional(),
  isMain: z.boolean().optional(),
});

const updateVillaImageSchema = z.object({
  imageId: uuidSchema,
  url: z.string().url().max(2_000).optional(),
  altI18n: localizedTextSchema.nullish(),
  orderValue: orderValueSchema.optional(),
});

const reorderVillaImagesSchema = z.object({
  villaId: idSchema,
  items: z
    .array(z.object({ imageId: uuidSchema, orderValue: orderValueSchema }))
    .min(1)
    .max(200),
});

const setMainImageSchema = z.object({
  villaId: idSchema,
  imageId: uuidSchema,
});

const deleteVillaImageSchema = z.object({ imageId: uuidSchema });

/** Images never affect price, so no cache rebuild is queued here. */
function afterImageWrite(villaId: number): void {
  updateTag("villas");
  updateTag(`villa-${villaId}`);
}

export async function createVillaImage(
  input: z.input<typeof createVillaImageSchema>,
): Promise<ActionResult<{ imageId: string }>> {
  try {
    await requireAdmin();

    const parsed = createVillaImageSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { villaId, url, altI18n, orderValue, isMain } = parsed.data;

    const imageId = await dbPool.transaction(async (tx) => {
      const [created] = await tx
        .insert(villaImages)
        .values({
          villaId,
          url,
          altI18n: altI18n ?? null,
          orderValue: orderValue ?? 0,
          isMain: isMain ?? false,
        })
        .returning({ id: villaImages.id });

      // Exactly one main image per villa, enforced here rather than hoped for.
      if (isMain === true) {
        await tx
          .update(villaImages)
          .set({ isMain: false })
          .where(
            and(
              eq(villaImages.villaId, villaId),
              ne(villaImages.id, created.id),
            ),
          );
      }

      return created.id;
    });

    afterImageWrite(villaId);

    return ok({ imageId });
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateVillaImage(
  input: z.input<typeof updateVillaImageSchema>,
): Promise<ActionResult<{ imageId: string }>> {
  try {
    await requireAdmin();

    const parsed = updateVillaImageSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { imageId, altI18n, ...changes } = parsed.data;

    const patch = {
      ...changes,
      ...(altI18n === undefined ? {} : { altI18n: altI18n ?? null }),
    };

    if (Object.keys(patch).length === 0) return ok({ imageId });

    const [updated] = await dbPool
      .update(villaImages)
      .set(patch)
      .where(eq(villaImages.id, imageId))
      .returning({ villaId: villaImages.villaId });

    if (updated === undefined) {
      return { ok: false, error: "That image does not exist." };
    }

    afterImageWrite(updated.villaId);

    return ok({ imageId });
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderVillaImages(
  input: z.input<typeof reorderVillaImagesSchema>,
): Promise<ActionResult<{ villaId: number; imageIds: string[] }>> {
  try {
    await requireAdmin();

    const parsed = reorderVillaImagesSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { villaId, items } = parsed.data;

    await dbPool.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(villaImages)
          .set({ orderValue: item.orderValue })
          // Scoped by villa so a stray id cannot reorder another villa's gallery.
          .where(
            and(
              eq(villaImages.id, item.imageId),
              eq(villaImages.villaId, villaId),
            ),
          );
      }
    });

    afterImageWrite(villaId);

    return ok({ villaId, imageIds: items.map((item) => item.imageId) });
  } catch (error) {
    return toActionError(error);
  }
}

export async function setMainImage(
  input: z.input<typeof setMainImageSchema>,
): Promise<ActionResult<{ villaId: number; imageId: string }>> {
  try {
    await requireAdmin();

    const parsed = setMainImageSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { villaId, imageId } = parsed.data;

    const promoted = await dbPool.transaction(async (tx) => {
      const [target] = await tx
        .update(villaImages)
        .set({ isMain: true })
        .where(
          and(eq(villaImages.id, imageId), eq(villaImages.villaId, villaId)),
        )
        .returning({ id: villaImages.id });

      if (target === undefined) return null;

      await tx
        .update(villaImages)
        .set({ isMain: false })
        .where(
          and(eq(villaImages.villaId, villaId), ne(villaImages.id, imageId)),
        );

      return target.id;
    });

    if (promoted === null) {
      return { ok: false, error: "That image does not belong to this villa." };
    }

    afterImageWrite(villaId);

    return ok({ villaId, imageId });
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteVillaImage(
  input: z.input<typeof deleteVillaImageSchema>,
): Promise<ActionResult<{ imageId: string; villaId: number }>> {
  try {
    await requireAdmin();

    const parsed = deleteVillaImageSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const [deleted] = await dbPool
      .delete(villaImages)
      .where(eq(villaImages.id, parsed.data.imageId))
      .returning({ villaId: villaImages.villaId });

    if (deleted === undefined) {
      return { ok: false, error: "That image does not exist." };
    }

    afterImageWrite(deleted.villaId);

    return ok({ imageId: parsed.data.imageId, villaId: deleted.villaId });
  } catch (error) {
    return toActionError(error);
  }
}
