/**
 * Villa full-text search: ranked `tsvector` match plus `pg_trgm` fallback when
 * the guest typo-changes a token (`honeymun` → `honeymoon`).
 *
 * Request-shaped (the query string), so this scope uses `use cache: private` and
 * skips a shared `cacheTag`, matching the plan's carve-out for user-typed input.
 */
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { searchSynonyms, villaSearchDocuments } from "@/db/schema";
import { TEXT_SEARCH_CONFIG, type Locale } from "@/lib/locales";
import type { SearchSynonym } from "@/lib/search/intent";

/** Below this `similarity()` score, a row is noise rather than a match. */
const TRIGRAM_THRESHOLD = 0.15;

export type VillaSearchHit = {
  villaId: number;
  /** Combined relevance: `GREATEST(ts_rank_cd(...), similarity(...))`. */
  score: number;
};

/**
 * Runs `websearch_to_tsquery` against `tsv` and unions in trigram matches on
 * `document` so typos still surface rows even when the tsquery is empty.
 */
export async function searchVillaDocuments(options: {
  query: string;
  locale: Locale;
  limit?: number;
}): Promise<VillaSearchHit[]> {
  "use cache: private";
  cacheLife("minutes");

  const trimmed = options.query.trim();
  if (trimmed.length === 0) return [];

  const limit = Math.min(50, Math.max(1, options.limit ?? 20));
  const config = TEXT_SEARCH_CONFIG[options.locale];

  const rows = await db
    .select({
      villaId: villaSearchDocuments.villaId,
      score: sql<number>`greatest(
        coalesce(
          ts_rank_cd(
            ${villaSearchDocuments.tsv},
            websearch_to_tsquery(${config}::regconfig, ${trimmed})
          ),
          0
        ),
        similarity(${villaSearchDocuments.document}, ${trimmed})
      )`.mapWith(Number),
    })
    .from(villaSearchDocuments)
    .where(
      and(
        eq(villaSearchDocuments.locale, options.locale),
        sql`(
          ${villaSearchDocuments.tsv} @@ websearch_to_tsquery(${config}::regconfig, ${trimmed})
          OR similarity(${villaSearchDocuments.document}, ${trimmed}) > ${TRIGRAM_THRESHOLD}
        )`,
      ),
    )
    .orderBy(
      desc(
        sql`greatest(
          coalesce(
            ts_rank_cd(
              ${villaSearchDocuments.tsv},
              websearch_to_tsquery(${config}::regconfig, ${trimmed})
            ),
            0
          ),
          similarity(${villaSearchDocuments.document}, ${trimmed})
        )`,
      ),
    )
    .limit(limit);

  return rows.map((row) => ({
    villaId: row.villaId,
    score: row.score,
  }));
}

/**
 * The synonym table for one locale, fed to the pure `parseSearchIntent`.
 *
 * Shared `use cache` rather than private: the result depends only on the
 * locale, and it is read on every search, so one cached row per language is
 * worth far more than a per-visitor copy.
 */
export async function getSearchSynonyms(
  locale: Locale,
): Promise<SearchSynonym[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("search-synonyms");

  const rows = await db
    .select({
      term: searchSynonyms.term,
      canonicalTerm: searchSynonyms.canonicalTerm,
      kind: searchSynonyms.kind,
    })
    .from(searchSynonyms)
    .where(eq(searchSynonyms.locale, locale))
    .orderBy(asc(searchSynonyms.term));

  return rows;
}
