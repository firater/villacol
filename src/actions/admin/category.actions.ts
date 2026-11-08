"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

import { dbPool } from "@/db/pool";
import { categories, categoryTranslations } from "@/db/schema";
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

const categoryFieldsSchema = z.object({
  isFeatured: z.boolean(),
  orderValue: orderValueSchema,
});

const createCategorySchema = z.object({
  ...categoryFieldsSchema.partial().shape,
  translations: translationsSchema,
});

const updateCategorySchema = z.object({
  categoryId: idSchema,
  ...categoryFieldsSchema.partial().shape,
});

const updateCategoryTranslationsSchema = z.object({
  categoryId: idSchema,
  translations: translationsSchema,
});

const reorderCategoriesSchema = z.object({ items: reorderSchema });

function afterCategoryWrite(slugs: readonly string[] = []): void {
  updateTag("villas");
  for (const slug of slugs) {
    updateTag(`category-${slug}`);
  }
}

export async function createCategory(
  input: z.input<typeof createCategorySchema>,
): Promise<ActionResult<{ categoryId: number }>> {
  try {
    await requireAdmin();

    const parsed = createCategorySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { translations, ...fields } = parsed.data;

    const categoryId = await dbPool.transaction(async (tx) => {
      const [created] = await tx
        .insert(categories)
        .values(fields)
        .returning({ id: categories.id });

      await tx.insert(categoryTranslations).values(
        translations.map((translation) => ({
          categoryId: created.id,
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

    afterCategoryWrite(translations.map((translation) => translation.slug));

    return ok({ categoryId });
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateCategory(
  input: z.input<typeof updateCategorySchema>,
): Promise<ActionResult<{ categoryId: number }>> {
  try {
    await requireAdmin();

    const parsed = updateCategorySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { categoryId, ...changes } = parsed.data;

    if (Object.keys(changes).length === 0) return ok({ categoryId });

    const [updated] = await dbPool
      .update(categories)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(categories.id, categoryId))
      .returning({ id: categories.id });

    if (updated === undefined) {
      return { ok: false, error: `Category ${categoryId} does not exist.` };
    }

    afterCategoryWrite();

    return ok({ categoryId });
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateCategoryTranslations(
  input: z.input<typeof updateCategoryTranslationsSchema>,
): Promise<ActionResult<{ categoryId: number; locales: string[] }>> {
  try {
    await requireAdmin();

    const parsed = updateCategoryTranslationsSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { categoryId, translations } = parsed.data;

    await dbPool.transaction(async (tx) => {
      for (const translation of translations) {
        await tx
          .insert(categoryTranslations)
          .values({
            categoryId,
            locale: translation.locale,
            slug: translation.slug,
            name: translation.name,
            description: translation.description ?? null,
            metaTitle: translation.metaTitle ?? null,
            metaDescription: translation.metaDescription ?? null,
          })
          .onConflictDoUpdate({
            target: [
              categoryTranslations.categoryId,
              categoryTranslations.locale,
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

    afterCategoryWrite(translations.map((translation) => translation.slug));
    // Category names are indexed into every villa that carries them.
    enqueueFullSearchReindex("admin_edit");

    return ok({
      categoryId,
      locales: translations.map((translation) => translation.locale),
    });
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderCategories(
  input: z.input<typeof reorderCategoriesSchema>,
): Promise<ActionResult<{ categoryIds: number[] }>> {
  try {
    await requireAdmin();

    const parsed = reorderCategoriesSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { items } = parsed.data;

    await dbPool.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(categories)
          .set({ orderValue: item.orderValue, updatedAt: new Date() })
          .where(eq(categories.id, item.id));
      }
    });

    afterCategoryWrite();

    return ok({ categoryIds: items.map((item) => item.id) });
  } catch (error) {
    return toActionError(error);
  }
}
