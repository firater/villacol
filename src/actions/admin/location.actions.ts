"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

import { dbPool } from "@/db/pool";
import { locations, locationTranslations } from "@/db/schema";
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
  localeSchema,
  orderValueSchema,
  reorderSchema,
  slugSchema,
} from "@/lib/validation";

const translationSchema = z.object({
  locale: localeSchema,
  slug: slugSchema,
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(10_000).nullish(),
  metaTitle: z.string().trim().max(200).nullish(),
  metaDescription: z.string().trim().max(400).nullish(),
});

const translationsSchema = z
  .array(translationSchema)
  .min(1)
  .refine(
    (list) => list.some((entry) => entry.locale === "en"),
    "An English translation is required",
  )
  .refine(
    (list) => new Set(list.map((entry) => entry.locale)).size === list.length,
    "Each locale may appear only once",
  );

const locationFieldsSchema = z.object({
  // Kas > Kalkan > Islamlar; null means a top-level region.
  parentId: idSchema.nullish(),
  type: z.string().trim().min(1).max(40),
  isFeatured: z.boolean(),
  orderValue: orderValueSchema,
  latitude: z.number().min(-90).max(90).nullish(),
  longitude: z.number().min(-180).max(180).nullish(),
});

const createLocationSchema = z.object({
  ...locationFieldsSchema.partial().shape,
  translations: translationsSchema,
});

const updateLocationSchema = z.object({
  locationId: idSchema,
  ...locationFieldsSchema.partial().shape,
});

const updateLocationTranslationsSchema = z.object({
  locationId: idSchema,
  translations: translationsSchema,
});

const reorderLocationsSchema = z.object({ items: reorderSchema });

/**
 * Location names and slugs are embedded in cached villa listings and landing
 * pages, so a rename invalidates `villas` rather than only its own tag.
 */
function afterLocationWrite(slugs: readonly string[] = []): void {
  updateTag("villas");
  for (const slug of slugs) {
    updateTag(`location-${slug}`);
  }
}

export async function createLocation(
  input: z.input<typeof createLocationSchema>,
): Promise<ActionResult<{ locationId: number }>> {
  try {
    await requireAdmin();

    const parsed = createLocationSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { translations, ...fields } = parsed.data;

    const locationId = await dbPool.transaction(async (tx) => {
      const [created] = await tx
        .insert(locations)
        .values(fields)
        .returning({ id: locations.id });

      await tx.insert(locationTranslations).values(
        translations.map((translation) => ({
          locationId: created.id,
          locale: translation.locale,
          slug: translation.slug,
          name: translation.name,
          description: translation.description ?? null,
          metaTitle: translation.metaTitle ?? null,
          metaDescription: translation.metaDescription ?? null,
        })),
      );

      return created.id;
    });

    afterLocationWrite(translations.map((translation) => translation.slug));

    return ok({ locationId });
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateLocation(
  input: z.input<typeof updateLocationSchema>,
): Promise<ActionResult<{ locationId: number }>> {
  try {
    await requireAdmin();

    const parsed = updateLocationSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { locationId, ...changes } = parsed.data;

    if (Object.keys(changes).length === 0) return ok({ locationId });

    if (changes.parentId === locationId) {
      return {
        ok: false,
        error: "A location cannot be its own parent.",
        fieldErrors: { parentId: ["A location cannot be its own parent."] },
      };
    }

    const [updated] = await dbPool
      .update(locations)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(locations.id, locationId))
      .returning({ id: locations.id });

    if (updated === undefined) {
      return { ok: false, error: `Location ${locationId} does not exist.` };
    }

    afterLocationWrite();

    return ok({ locationId });
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateLocationTranslations(
  input: z.input<typeof updateLocationTranslationsSchema>,
): Promise<ActionResult<{ locationId: number; locales: string[] }>> {
  try {
    await requireAdmin();

    const parsed = updateLocationTranslationsSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { locationId, translations } = parsed.data;

    await dbPool.transaction(async (tx) => {
      for (const translation of translations) {
        await tx
          .insert(locationTranslations)
          .values({
            locationId,
            locale: translation.locale,
            slug: translation.slug,
            name: translation.name,
            description: translation.description ?? null,
            metaTitle: translation.metaTitle ?? null,
            metaDescription: translation.metaDescription ?? null,
          })
          .onConflictDoUpdate({
            target: [
              locationTranslations.locationId,
              locationTranslations.locale,
            ],
            set: {
              slug: translation.slug,
              name: translation.name,
              description: translation.description ?? null,
              metaTitle: translation.metaTitle ?? null,
              metaDescription: translation.metaDescription ?? null,
            },
          });
      }
    });

    afterLocationWrite(translations.map((translation) => translation.slug));
    // The location name is part of every search document that references it,
    // and a rename can touch more villas than is worth enqueueing one by one.
    enqueueFullSearchReindex("admin_edit");

    return ok({
      locationId,
      locales: translations.map((translation) => translation.locale),
    });
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderLocations(
  input: z.input<typeof reorderLocationsSchema>,
): Promise<ActionResult<{ locationIds: number[] }>> {
  try {
    await requireAdmin();

    const parsed = reorderLocationsSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { items } = parsed.data;

    await dbPool.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(locations)
          .set({ orderValue: item.orderValue, updatedAt: new Date() })
          .where(eq(locations.id, item.id));
      }
    });

    afterLocationWrite();

    return ok({ locationIds: items.map((item) => item.id) });
  } catch (error) {
    return toActionError(error);
  }
}
