/**
 * Public category landing reads (cached).
 */
import { and, asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { categories, categoryTranslations } from "@/db/schema";
import type { Locale } from "@/lib/locales";

export type CategoryDetailRow = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

export type CategoryNavLink = {
  slug: string;
  name: string;
};

export async function getCategoryBySlug(
  slug: string,
  locale: Locale,
): Promise<CategoryDetailRow | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories", `category-${slug}`);

  const [row] = await db
    .select({
      id: categories.id,
      slug: categoryTranslations.slug,
      name: categoryTranslations.name,
      description: categoryTranslations.description,
      metaTitle: categoryTranslations.metaTitle,
      metaDescription: categoryTranslations.metaDescription,
    })
    .from(categories)
    .innerJoin(
      categoryTranslations,
      and(
        eq(categoryTranslations.categoryId, categories.id),
        eq(categoryTranslations.locale, locale),
        eq(categoryTranslations.slug, slug),
      ),
    )
    .limit(1);

  if (row === undefined) return null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
  };
}

/** Localized slugs for `alternates.languages` metadata. */
export async function getCategorySlugAlternates(
  categoryId: number,
): Promise<Partial<Record<Locale, string>>> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories", `category-id-${categoryId}`);

  const rows = await db
    .select({
      locale: categoryTranslations.locale,
      slug: categoryTranslations.slug,
    })
    .from(categoryTranslations)
    .where(eq(categoryTranslations.categoryId, categoryId));

  return Object.fromEntries(
    rows.map((row) => [row.locale as Locale, row.slug]),
  ) as Partial<Record<Locale, string>>;
}

export async function listCategoryNavLinks(
  locale: Locale,
): Promise<CategoryNavLink[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");

  return db
    .select({
      slug: categoryTranslations.slug,
      name: categoryTranslations.name,
    })
    .from(categories)
    .innerJoin(
      categoryTranslations,
      and(
        eq(categoryTranslations.categoryId, categories.id),
        eq(categoryTranslations.locale, locale),
      ),
    )
    .where(eq(categories.isFeatured, true))
    .orderBy(asc(categories.orderValue), asc(categories.id));
}