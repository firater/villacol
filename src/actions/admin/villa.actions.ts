"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

import { dbPool } from "@/db/pool";
import { villas, villaTranslations } from "@/db/schema";
import { guestPolicyEnum } from "@/db/tables/enums";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth-guard";
import {
  enqueueSearchReindex,
  enqueueSimilarVillasRebuild,
  enqueueVillaCacheRebuild,
} from "@/lib/cron/trigger";
import {
  centsSchema,
  editorRatingSchema,
  idSchema,
  localeSchema,
  localizedTextSchema,
  orderValueSchema,
  reorderSchema,
  slugSchema,
  timeOfDaySchema,
} from "@/lib/validation";

const translationSchema = z.object({
  locale: localeSchema,
  slug: slugSchema,
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(500).nullish(),
  description: z.string().trim().max(20_000).nullish(),
  metaTitle: z.string().trim().max(200).nullish(),
  metaDescription: z.string().trim().max(400).nullish(),
});

/** English is the fallback locale, so a villa without it cannot render at all. */
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

const villaFieldsSchema = z.object({
  locationId: idSchema.nullish(),
  capacity: z.number().int().min(1).max(100),
  bedrooms: z.number().int().min(0).max(50),
  bathrooms: z.number().int().min(0).max(50),
  defaultMinStay: z.number().int().min(1).max(365),
  defaultNightlyPriceCents: centsSchema.nullish(),
  cleaningFeeCents: centsSchema,
  depositCents: centsSchema,
  checkInTime: timeOfDaySchema,
  checkOutTime: timeOfDaySchema,
  latitude: z.number().min(-90).max(90).nullish(),
  longitude: z.number().min(-180).max(180).nullish(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isEditorsChoice: z.boolean(),
  isBestValue: z.boolean(),
  orderValue: orderValueSchema,
  cancellationPolicyI18n: localizedTextSchema.nullish(),
  guestPolicy: z.enum(guestPolicyEnum.enumValues),
  editorRating: editorRatingSchema.nullish(),
});

const createVillaSchema = z.object({
  refCode: z.string().trim().min(1).max(40),
  slug: slugSchema,
  ...villaFieldsSchema.partial().shape,
  translations: translationsSchema,
});

const updateVillaSchema = z.object({
  villaId: idSchema,
  refCode: z.string().trim().min(1).max(40).optional(),
  slug: slugSchema.optional(),
  ...villaFieldsSchema.partial().shape,
});

const updateVillaTranslationsSchema = z.object({
  villaId: idSchema,
  translations: translationsSchema,
});

const setVillaActiveSchema = z.object({
  villaId: idSchema,
  isActive: z.boolean(),
});

const updateVillaOrderValueSchema = z.object({
  items: reorderSchema,
});

/**
 * Invalidation for a villa edit.
 *
 * `updateTag` rather than `revalidateTag`: an admin who just saved must see
 * their own write on the next read, not stale-while-revalidate content.
 * The price rebuild is queued with `after()` so the save returns immediately.
 */
function revalidateVilla(villaId: number): void {
  updateTag("villas");
  updateTag(`villa-${villaId}`);
}

export async function createVilla(
  input: z.input<typeof createVillaSchema>,
): Promise<ActionResult<{ villaId: number }>> {
  try {
    await requireAdmin();

    const parsed = createVillaSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { translations, ...villaFields } = parsed.data;

    const villaId = await dbPool.transaction(async (tx) => {
      const [created] = await tx
        .insert(villas)
        .values(villaFields)
        .returning({ id: villas.id });

      await tx.insert(villaTranslations).values(
        translations.map((translation) => ({
          villaId: created.id,
          locale: translation.locale,
          slug: translation.slug,
          title: translation.title,
          summary: translation.summary ?? null,
          description: translation.description ?? null,
          metaTitle: translation.metaTitle ?? null,
          metaDescription: translation.metaDescription ?? null,
        })),
      );

      return created.id;
    });

    revalidateVilla(villaId);
    enqueueVillaCacheRebuild(villaId, "admin_edit");
    enqueueSimilarVillasRebuild(villaId);
    enqueueSearchReindex([villaId]);

    return ok({ villaId });
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateVilla(
  input: z.input<typeof updateVillaSchema>,
): Promise<ActionResult<{ villaId: number }>> {
  try {
    await requireAdmin();

    const parsed = updateVillaSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { villaId, ...changes } = parsed.data;

    if (Object.keys(changes).length === 0) {
      return ok({ villaId });
    }

    const [updated] = await dbPool
      .update(villas)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(villas.id, villaId))
      .returning({ id: villas.id });

    if (updated === undefined) {
      return { ok: false, error: `Villa ${villaId} does not exist.` };
    }

    revalidateVilla(villaId);
    // Capacity, bedrooms, price, and min stay all feed the cached quote and the
    // similarity score, so both rebuilds are queued on any field change.
    enqueueVillaCacheRebuild(villaId, "admin_edit");
    enqueueSimilarVillasRebuild(villaId);
    // `locationId` and `refCode` are both part of the search document.
    enqueueSearchReindex([villaId]);

    return ok({ villaId });
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateVillaTranslations(
  input: z.input<typeof updateVillaTranslationsSchema>,
): Promise<ActionResult<{ villaId: number; locales: string[] }>> {
  try {
    await requireAdmin();

    const parsed = updateVillaTranslationsSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { villaId, translations } = parsed.data;

    await dbPool.transaction(async (tx) => {
      for (const translation of translations) {
        await tx
          .insert(villaTranslations)
          .values({
            villaId,
            locale: translation.locale,
            slug: translation.slug,
            title: translation.title,
            summary: translation.summary ?? null,
            description: translation.description ?? null,
            metaTitle: translation.metaTitle ?? null,
            metaDescription: translation.metaDescription ?? null,
          })
          .onConflictDoUpdate({
            target: [villaTranslations.villaId, villaTranslations.locale],
            set: {
              slug: translation.slug,
              title: translation.title,
              summary: translation.summary ?? null,
              description: translation.description ?? null,
              metaTitle: translation.metaTitle ?? null,
              metaDescription: translation.metaDescription ?? null,
            },
          });
      }
    });

    revalidateVilla(villaId);
    // Title, summary, and description are the bulk of the search document.
    enqueueSearchReindex([villaId]);

    return ok({
      villaId,
      locales: translations.map((translation) => translation.locale),
    });
  } catch (error) {
    return toActionError(error);
  }
}

export async function setVillaActive(
  input: z.input<typeof setVillaActiveSchema>,
): Promise<ActionResult<{ villaId: number; isActive: boolean }>> {
  try {
    await requireAdmin();

    const parsed = setVillaActiveSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { villaId, isActive } = parsed.data;

    const [updated] = await dbPool
      .update(villas)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(villas.id, villaId))
      .returning({ id: villas.id });

    if (updated === undefined) {
      return { ok: false, error: `Villa ${villaId} does not exist.` };
    }

    revalidateVilla(villaId);
    // Deactivating must clear the cached price rows and the search documents;
    // both jobs delete them when the villa no longer resolves as active.
    enqueueVillaCacheRebuild(villaId, "admin_edit");
    enqueueSimilarVillasRebuild(villaId);
    enqueueSearchReindex([villaId]);

    return ok({ villaId, isActive });
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateVillaOrderValue(
  input: z.input<typeof updateVillaOrderValueSchema>,
): Promise<ActionResult<{ villaIds: number[] }>> {
  try {
    await requireAdmin();

    const parsed = updateVillaOrderValueSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { items } = parsed.data;

    await dbPool.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(villas)
          .set({ orderValue: item.orderValue, updatedAt: new Date() })
          .where(eq(villas.id, item.id));
      }
    });

    updateTag("villas");
    for (const item of items) {
      updateTag(`villa-${item.id}`);
    }

    return ok({ villaIds: items.map((item) => item.id) });
  } catch (error) {
    return toActionError(error);
  }
}