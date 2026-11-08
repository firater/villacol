"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

import { dbPool } from "@/db/pool";
import {
  villaAmenities,
  villaCategories,
  villaFeatures,
  villaRuleLinks,
} from "@/db/schema";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth-guard";
import { enqueueSearchReindex, enqueueSimilarVillasRebuild } from "@/lib/cron/trigger";
import { idSchema } from "@/lib/validation";

/**
 * Each of these is a full replacement rather than an add/remove pair: the admin
 * form submits the complete set it wants, which makes the action idempotent and
 * avoids a diff the client could get wrong.
 */
const highlightedLinksSchema = z.object({
  villaId: idSchema,
  items: z
    .array(
      z.object({
        id: idSchema,
        isHighlighted: z.boolean().default(false),
      }),
    )
    .max(200)
    .refine(
      (list) => new Set(list.map((entry) => entry.id)).size === list.length,
      "Each id may appear only once",
    ),
});

const plainLinksSchema = z.object({
  villaId: idSchema,
  ids: z
    .array(idSchema)
    .max(200)
    .refine((list) => new Set(list).size === list.length, "Each id may appear only once"),
});

function revalidateVillaTaxonomy(villaId: number): void {
  updateTag("villas");
  updateTag(`villa-${villaId}`);
}

export async function setVillaAmenities(
  input: z.input<typeof highlightedLinksSchema>,
): Promise<ActionResult<{ villaId: number; amenityIds: number[] }>> {
  try {
    await requireAdmin();

    const parsed = highlightedLinksSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { villaId, items } = parsed.data;

    await dbPool.transaction(async (tx) => {
      await tx.delete(villaAmenities).where(eq(villaAmenities.villaId, villaId));

      if (items.length > 0) {
        await tx.insert(villaAmenities).values(
          items.map((item) => ({
            villaId,
            amenityId: item.id,
            isHighlighted: item.isHighlighted,
          })),
        );
      }
    });

    revalidateVillaTaxonomy(villaId);
    // Amenity labels are part of the villa's search document.
    enqueueSearchReindex([villaId]);

    return ok({ villaId, amenityIds: items.map((item) => item.id) });
  } catch (error) {
    return toActionError(error);
  }
}

export async function setVillaFeatures(
  input: z.input<typeof highlightedLinksSchema>,
): Promise<ActionResult<{ villaId: number; featureIds: number[] }>> {
  try {
    await requireAdmin();

    const parsed = highlightedLinksSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { villaId, items } = parsed.data;

    await dbPool.transaction(async (tx) => {
      await tx.delete(villaFeatures).where(eq(villaFeatures.villaId, villaId));

      if (items.length > 0) {
        await tx.insert(villaFeatures).values(
          items.map((item) => ({
            villaId,
            featureId: item.id,
            isHighlighted: item.isHighlighted,
          })),
        );
      }
    });

    revalidateVillaTaxonomy(villaId);
    enqueueSearchReindex([villaId]);

    return ok({ villaId, featureIds: items.map((item) => item.id) });
  } catch (error) {
    return toActionError(error);
  }
}

export async function setVillaCategories(
  input: z.input<typeof plainLinksSchema>,
): Promise<ActionResult<{ villaId: number; categoryIds: number[] }>> {
  try {
    await requireAdmin();

    const parsed = plainLinksSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { villaId, ids } = parsed.data;

    await dbPool.transaction(async (tx) => {
      await tx.delete(villaCategories).where(eq(villaCategories.villaId, villaId));

      if (ids.length > 0) {
        await tx
          .insert(villaCategories)
          .values(ids.map((categoryId) => ({ villaId, categoryId })));
      }
    });

    revalidateVillaTaxonomy(villaId);
    // Categories drive both the search document and the sibling-category leg of
    // the similarity score.
    enqueueSearchReindex([villaId]);
    enqueueSimilarVillasRebuild(villaId);

    return ok({ villaId, categoryIds: ids });
  } catch (error) {
    return toActionError(error);
  }
}

export async function setVillaRuleLinks(
  input: z.input<typeof plainLinksSchema>,
): Promise<ActionResult<{ villaId: number; ruleIds: number[] }>> {
  try {
    await requireAdmin();

    const parsed = plainLinksSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { villaId, ids } = parsed.data;

    await dbPool.transaction(async (tx) => {
      await tx.delete(villaRuleLinks).where(eq(villaRuleLinks.villaId, villaId));

      if (ids.length > 0) {
        await tx
          .insert(villaRuleLinks)
          .values(ids.map((ruleId) => ({ villaId, ruleId })));
      }
    });

    revalidateVillaTaxonomy(villaId);

    return ok({ villaId, ruleIds: ids });
  } catch (error) {
    return toActionError(error);
  }
}
