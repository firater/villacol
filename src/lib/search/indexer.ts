/**
 * Keeps `villa_search_documents` in sync with the data it flattens.
 *
 * The document is one blob per villa per locale: title, summary, location name,
 * category names, and amenity labels. `tsv` is written explicitly with
 * `to_tsvector(<config>, document)` because the config depends on the row's own
 * locale, which a GENERATED column cannot read (it needs an immutable
 * expression, and `locale -> regconfig` is not one).
 */
import { and, eq, inArray, notInArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { dbPool } from "@/db/pool";
import {
  amenities,
  categories,
  categoryTranslations,
  features,
  locationTranslations,
  villaAmenities,
  villaCategories,
  villaFeatures,
  villaSearchDocuments,
  villas,
  villaTranslations,
} from "@/db/schema";
import {
  localize,
  LOCALES,
  TEXT_SEARCH_CONFIG,
  type Locale,
  type LocalizedText,
} from "@/lib/locales";

/** Villas reindexed per batch, matching the price-cache job's bounded concurrency. */
export const SEARCH_INDEX_BATCH_SIZE = 25;

export type SearchIndexResult = {
  processedCount: number;
  failedCount: number;
  documentCount: number;
};

function chunk<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

/** Dedupes, drops empties, and joins with newlines for readable debugging. */
function composeDocument(parts: readonly (string | null | undefined)[]): string {
  const seen = new Set<string>();
  for (const part of parts) {
    const trimmed = part?.trim();
    if (trimmed !== undefined && trimmed.length > 0) seen.add(trimmed);
  }
  return [...seen].join("\n");
}

type VillaIndexSources = {
  villaId: number;
  refCode: string;
  translations: Map<
    Locale,
    { title: string; summary: string | null; description: string | null }
  >;
  locationNames: Map<Locale, string>;
  categoryNames: Map<Locale, string[]>;
  amenityLabels: LocalizedText[];
  featureLabels: LocalizedText[];
};

async function loadSources(
  villaIds: readonly number[],
): Promise<Map<number, VillaIndexSources>> {
  const ids = [...villaIds];
  const sources = new Map<number, VillaIndexSources>();

  const villaRows = await db
    .select({
      id: villas.id,
      refCode: villas.refCode,
      locationId: villas.locationId,
    })
    .from(villas)
    // Inactive villas resolve to no source, which routes them to the delete
    // branch below so a hidden villa stops being searchable.
    .where(and(inArray(villas.id, ids), eq(villas.isActive, true)));

  for (const row of villaRows) {
    sources.set(row.id, {
      villaId: row.id,
      refCode: row.refCode,
      translations: new Map(),
      locationNames: new Map(),
      categoryNames: new Map(),
      amenityLabels: [],
      featureLabels: [],
    });
  }

  if (sources.size === 0) return sources;

  const [translationRows, locationRows, categoryRows, amenityRows, featureRows] =
    await Promise.all([
      db
        .select({
          villaId: villaTranslations.villaId,
          locale: villaTranslations.locale,
          title: villaTranslations.title,
          summary: villaTranslations.summary,
          description: villaTranslations.description,
        })
        .from(villaTranslations)
        .where(inArray(villaTranslations.villaId, ids)),

      db
        .select({
          villaId: villas.id,
          locale: locationTranslations.locale,
          name: locationTranslations.name,
        })
        .from(villas)
        .innerJoin(
          locationTranslations,
          eq(locationTranslations.locationId, villas.locationId),
        )
        .where(inArray(villas.id, ids)),

      db
        .select({
          villaId: villaCategories.villaId,
          locale: categoryTranslations.locale,
          name: categoryTranslations.name,
        })
        .from(villaCategories)
        .innerJoin(categories, eq(categories.id, villaCategories.categoryId))
        .innerJoin(
          categoryTranslations,
          eq(categoryTranslations.categoryId, categories.id),
        )
        .where(inArray(villaCategories.villaId, ids)),

      db
        .select({
          villaId: villaAmenities.villaId,
          labelI18n: amenities.labelI18n,
        })
        .from(villaAmenities)
        .innerJoin(amenities, eq(amenities.id, villaAmenities.amenityId))
        .where(inArray(villaAmenities.villaId, ids)),

      db
        .select({
          villaId: villaFeatures.villaId,
          labelI18n: features.labelI18n,
        })
        .from(villaFeatures)
        .innerJoin(features, eq(features.id, villaFeatures.featureId))
        .where(inArray(villaFeatures.villaId, ids)),
    ]);

  for (const row of translationRows) {
    sources.get(row.villaId)?.translations.set(row.locale, {
      title: row.title,
      summary: row.summary,
      description: row.description,
    });
  }

  for (const row of locationRows) {
    sources.get(row.villaId)?.locationNames.set(row.locale, row.name);
  }

  for (const row of categoryRows) {
    const bucket = sources.get(row.villaId)?.categoryNames;
    if (bucket === undefined) continue;
    bucket.set(row.locale, [...(bucket.get(row.locale) ?? []), row.name]);
  }

  for (const row of amenityRows) {
    sources.get(row.villaId)?.amenityLabels.push(row.labelI18n);
  }

  for (const row of featureRows) {
    sources.get(row.villaId)?.featureLabels.push(row.labelI18n);
  }

  return sources;
}

/**
 * Builds the per-locale documents for one villa.
 *
 * A locale with no villa translation is skipped rather than indexed from the
 * English text: a German document stemmed with the German config out of English
 * words matches nothing useful and pollutes the trigram index.
 */
function buildDocuments(
  source: VillaIndexSources,
): { locale: Locale; document: string }[] {
  const documents: { locale: Locale; document: string }[] = [];

  for (const locale of LOCALES) {
    const translation = source.translations.get(locale);
    if (translation === undefined) continue;

    documents.push({
      locale,
      document: composeDocument([
        translation.title,
        translation.summary,
        translation.description,
        source.refCode,
        source.locationNames.get(locale) ?? source.locationNames.get("en"),
        ...(source.categoryNames.get(locale) ?? []),
        ...source.amenityLabels.map((label) => localize(label, locale)),
        ...source.featureLabels.map((label) => localize(label, locale)),
      ]),
    });
  }

  return documents;
}

/**
 * Reindexes the given villas, or every active villa when called with no
 * argument. Each villa's documents are replaced in one transaction so a search
 * can never read a half-written set.
 */
export async function rebuildVillaSearchDocuments(
  villaIds?: readonly number[],
): Promise<SearchIndexResult> {
  const targets =
    villaIds !== undefined
      ? [...villaIds]
      : (
          await db
            .select({ id: villas.id })
            .from(villas)
            .where(eq(villas.isActive, true))
        ).map((row) => row.id);

  let processedCount = 0;
  let failedCount = 0;
  let documentCount = 0;

  for (const batch of chunk(targets, SEARCH_INDEX_BATCH_SIZE)) {
    const sources = await loadSources(batch);

    const settled = await Promise.allSettled(
      batch.map(async (villaId) => {
        const source = sources.get(villaId);

        // Deleted or inactive: drop its documents so it stops matching.
        if (source === undefined) {
          await dbPool
            .delete(villaSearchDocuments)
            .where(eq(villaSearchDocuments.villaId, villaId));
          return 0;
        }

        const documents = buildDocuments(source);

        await dbPool.transaction(async (tx) => {
          const keptLocales = documents.map((entry) => entry.locale);

          if (keptLocales.length === 0) {
            await tx
              .delete(villaSearchDocuments)
              .where(eq(villaSearchDocuments.villaId, villaId));
            return;
          }

          for (const entry of documents) {
            const tsv = sql`to_tsvector(${TEXT_SEARCH_CONFIG[entry.locale]}::regconfig, ${entry.document})`;

            await tx
              .insert(villaSearchDocuments)
              .values({
                villaId,
                locale: entry.locale,
                document: entry.document,
                tsv,
                updatedAt: new Date(),
              })
              .onConflictDoUpdate({
                target: [
                  villaSearchDocuments.villaId,
                  villaSearchDocuments.locale,
                ],
                set: {
                  document: entry.document,
                  tsv,
                  updatedAt: new Date(),
                },
              });
          }

          // A translation that was removed must stop being searchable.
          await tx
            .delete(villaSearchDocuments)
            .where(
              and(
                eq(villaSearchDocuments.villaId, villaId),
                notInArray(villaSearchDocuments.locale, keptLocales),
              ),
            );
        });

        return documents.length;
      }),
    );

    settled.forEach((outcome, index) => {
      if (outcome.status === "fulfilled") {
        processedCount += 1;
        documentCount += outcome.value;
        return;
      }

      failedCount += 1;
      console.error(
        `[search] reindex failed for villa ${batch[index]}`,
        outcome.reason,
      );
    });
  }

  return { processedCount, failedCount, documentCount };
}
