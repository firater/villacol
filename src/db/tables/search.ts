import { sql } from "drizzle-orm";
import {
  customType,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { localeEnum, synonymKindEnum } from "./enums";
import { villas } from "./villas";

/** Drizzle has no native `tsvector`; the indexer writes it via `to_tsvector`. */
const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return "tsvector";
  },
});

/**
 * Flattened, per-locale text for a villa: title, summary, location name,
 * category names, and amenity labels concatenated into one document.
 *
 * `tsv` is a plain column rather than a GENERATED one on purpose. A generated
 * column needs an immutable expression, and the text search config here depends
 * on the row's own `locale` ('english' / 'german' / 'russian'), which a
 * generated expression cannot read. The search indexer sets it explicitly with
 * `to_tsvector(<config>, document)`.
 */
export const villaSearchDocuments = pgTable(
  "villa_search_documents",
  {
    villaId: integer("villa_id")
      .notNull()
      .references(() => villas.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    document: text("document").notNull(),
    tsv: tsvector("tsv"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.villaId, table.locale] }),
    // Ranked full-text matching.
    index("villa_search_documents_tsv_idx").using("gin", table.tsv),
    // Trigram fallback, which is what catches "honeymun" -> "honeymoon".
    index("villa_search_documents_trgm_idx").using(
      "gin",
      table.document.op("gin_trgm_ops"),
    ),
  ],
);

/**
 * Maps the words guests actually type onto canonical filter values. Drives both
 * typo correction and intent parsing ("6 people in Kalkan" -> guests + location).
 */
export const searchSynonyms = pgTable(
  "search_synonyms",
  {
    id: serial("id").primaryKey(),
    locale: localeEnum("locale").notNull(),
    term: text("term").notNull(),
    canonicalTerm: text("canonical_term").notNull(),
    kind: synonymKindEnum("kind").notNull().default("misc"),
  },
  (table) => [
    uniqueIndex("search_synonyms_locale_term_idx").on(table.locale, table.term),
    index("search_synonyms_kind_idx").on(table.kind),
    index("search_synonyms_term_trgm_idx").using(
      "gin",
      table.term.op("gin_trgm_ops"),
    ),
  ],
);

/** `to_tsvector(config, document)` for the search indexer to write `tsv` with. */
export function buildTsVector(config: string, document: string) {
  return sql`to_tsvector(${config}::regconfig, ${document})`;
}
