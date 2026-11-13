/**
 * Villa catalog reads: listings, detail by slug, and a composed detail bundle.
 * Cached with the Cache Components API from `next/cache`.
 */
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
} from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import type { AppliedPromotionSnapshot } from "@/db/tables/caches";
import {
  amenities,
  categories,
  categoryTranslations,
  features,
  locations,
  locationTranslations,
  villaAmenities,
  villaCategories,
  villaFeatures,
  villaImages,
  villaPriceCache,
  villaRuleLinks,
  villaRules,
  villas,
  villaTranslations,
} from "@/db/schema";
import type { GuestPolicy } from "@/db/tables/enums";
import { localize, type Locale, type LocalizedText } from "@/lib/locales";

/** Sort keys aligned with the universal English `sort` query param (Phase 8). */
export type VillaListingSort =
  | "default"
  | "price_asc"
  | "price_desc"
  | "bedrooms_desc"
  /** Preserves the order of `villaIds`; only meaningful alongside it. */
  | "relevance";

export type VillaListingFilters = {
  locale: Locale;
  /**
   * Restricts the result to these villas, in this order when `sort` is
   * `relevance`. Search passes the ranked ids from `villa_search_documents`
   * here so filtering and pagination still happen in one SQL statement.
   */
  villaIds?: readonly number[];
  /** When true, only villas with an active discount in `villa_price_cache`. */
  offersOnly?: boolean;
  locationSlug?: string;
  categorySlug?: string;
  /** Universal English keys from `?amenities=` (matches `amenities.key`). */
  amenityKeys?: readonly string[];
  /** Universal English keys from `?features=`. */
  featureKeys?: readonly string[];
  guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  minPriceCents?: number;
  maxPriceCents?: number;
  sort?: VillaListingSort;
  page?: number;
  pageSize?: number;
  /** When true, only `villas.is_featured` rows (listing pages can ignore this). */
  featuredOnly?: boolean;
  /** When true, only `villas.is_best_value` rows (landing page rail). */
  bestValueOnly?: boolean;
};

export type VillaCardRow = {
  id: number;
  slug: string;
  refCode: string;
  title: string;
  summary: string | null;
  bedrooms: number;
  bathrooms: number;
  capacity: number;
  mainImageUrl: string | null;
  mainImageAlt: string | null;
  locationName: string | null;
  /** Pre-discount total for the cached `min_stay` window (nights only). */
  baseTotalCents: number | null;
  /** Subtotal after discounts for the same window (`villa_price_cache.discounted_total_cents`). */
  priceFromCents: number | null;
  avgNightlyCents: number | null;
  hasActiveDiscount: boolean;
  /** Nights covered by the cached window (for “from” copy). */
  cacheNightCount: number | null;
  isEditorsChoice: boolean;
  isBestValue: boolean;
  /** Cached `min_stay` window (listing cards). */
  cacheCheckIn: string | null;
  cacheCheckOut: string | null;
  discountedTotalCents: number | null;
  appliedPromotions: AppliedPromotionSnapshot[];
};

export type VillaDetailRow = {
  id: number;
  slug: string;
  refCode: string;
  title: string;
  summary: string | null;
  description: string | null;
  bedrooms: number;
  bathrooms: number;
  capacity: number;
  defaultMinStay: number;
  checkInTime: string;
  checkOutTime: string;
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  locationSlug: string | null;
  guestPolicy: GuestPolicy;
  editorRating: number | null;
  cancellationPolicy: string | null;
};

async function resolveLocationId(
  slug: string,
  locale: Locale,
): Promise<number | null> {
  const rows = await db
    .select({ id: locations.id })
    .from(locations)
    .innerJoin(
      locationTranslations,
      and(
        eq(locationTranslations.locationId, locations.id),
        eq(locationTranslations.locale, locale),
        eq(locationTranslations.slug, slug),
      ),
    )
    .limit(1);
  return rows[0]?.id ?? null;
}

async function resolveCategoryId(
  slug: string,
  locale: Locale,
): Promise<number | null> {
  const rows = await db
    .select({ id: categories.id })
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
  return rows[0]?.id ?? null;
}

function resolveCancellationPolicy(
  raw: LocalizedText | null | undefined,
  locale: Locale,
): string | null {
  if (raw === null || raw === undefined) return null;
  const text = localize(raw, locale).trim();
  return text === "" ? null : text;
}

export async function getVillaBySlug(
  slug: string,
  locale: Locale,
): Promise<VillaDetailRow | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("villas");

  const rows = await db
    .select({
      id: villas.id,
      slug: villaTranslations.slug,
      refCode: villas.refCode,
      title: villaTranslations.title,
      summary: villaTranslations.summary,
      description: villaTranslations.description,
      bedrooms: villas.bedrooms,
      bathrooms: villas.bathrooms,
      capacity: villas.capacity,
      defaultMinStay: villas.defaultMinStay,
      checkInTime: villas.checkInTime,
      checkOutTime: villas.checkOutTime,
      latitude: villas.latitude,
      longitude: villas.longitude,
      locationName: locationTranslations.name,
      locationSlug: locationTranslations.slug,
      guestPolicy: villas.guestPolicy,
      editorRating: villas.editorRating,
      cancellationPolicyI18n: villas.cancellationPolicyI18n,
    })
    .from(villas)
    .innerJoin(
      villaTranslations,
      and(
        eq(villaTranslations.villaId, villas.id),
        eq(villaTranslations.locale, locale),
        eq(villaTranslations.slug, slug),
      ),
    )
    .leftJoin(locations, eq(locations.id, villas.locationId))
    .leftJoin(
      locationTranslations,
      and(
        eq(locationTranslations.locationId, locations.id),
        eq(locationTranslations.locale, locale),
      ),
    )
    .where(eq(villas.isActive, true))
    .limit(1);

  const row = rows[0];
  if (row === undefined) return null;

  cacheTag(`villa-${row.id}`);
  return {
    id: row.id,
    slug: row.slug,
    refCode: row.refCode,
    title: row.title,
    summary: row.summary,
    description: row.description,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    capacity: row.capacity,
    defaultMinStay: row.defaultMinStay,
    checkInTime: row.checkInTime,
    checkOutTime: row.checkOutTime,
    latitude: row.latitude,
    longitude: row.longitude,
    locationName: row.locationName,
    locationSlug: row.locationSlug,
    guestPolicy: row.guestPolicy,
    editorRating: row.editorRating,
    cancellationPolicy: resolveCancellationPolicy(
      row.cancellationPolicyI18n as LocalizedText | null,
      locale,
    ),
  };
}

export async function getVillaListing(
  filters: VillaListingFilters,
): Promise<{ rows: VillaCardRow[]; total: number }> {
  "use cache";
  cacheLife("hours");
  // Listings read `villa_price_cache`, so the nightly rebuild invalidates them
  // through `villa-price-cache` without having to touch every villa tag.
  cacheTag("villas", "villa-price-cache");

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, filters.pageSize ?? 24));
  const offset = (page - 1) * pageSize;

  // An explicitly empty id list means "no candidates", which is different from
  // an absent one meaning "no restriction".
  if (filters.villaIds !== undefined && filters.villaIds.length === 0) {
    return { rows: [], total: 0 };
  }

  const villaIds = filters.villaIds?.filter(Number.isInteger) ?? [];

  const sort: VillaListingSort = filters.sort ?? "default";
  const orderByClause =
    sort === "price_asc"
      ? asc(villaPriceCache.discountedTotalCents)
      : sort === "price_desc"
        ? desc(villaPriceCache.discountedTotalCents)
        : sort === "bedrooms_desc"
          ? desc(villas.bedrooms)
          : sort === "relevance" && villaIds.length > 0
            ? // Interpolated rather than bound: these are integers the filter
              // above has already proven, and `array_position` needs a literal
              // array to rank against.
              sql`array_position(ARRAY[${sql.raw(villaIds.join(","))}]::int[], ${villas.id})`
            : asc(villas.orderValue);

  const [locationId, categoryId, amenityIdList, featureIdList] =
    await Promise.all([
      filters.locationSlug
        ? resolveLocationId(filters.locationSlug, filters.locale)
        : Promise.resolve(null),
      filters.categorySlug
        ? resolveCategoryId(filters.categorySlug, filters.locale)
        : Promise.resolve(null),
      filters.amenityKeys !== undefined && filters.amenityKeys.length > 0
        ? db
            .select({ id: amenities.id })
            .from(amenities)
            .where(inArray(amenities.key, [...filters.amenityKeys]))
        : Promise.resolve([] as { id: number }[]),
      filters.featureKeys !== undefined && filters.featureKeys.length > 0
        ? db
            .select({ id: features.id })
            .from(features)
            .where(inArray(features.key, [...filters.featureKeys]))
        : Promise.resolve([] as { id: number }[]),
    ]);

  if (
    (filters.locationSlug !== undefined && locationId === null) ||
    (filters.categorySlug !== undefined && categoryId === null) ||
    (filters.amenityKeys !== undefined &&
      filters.amenityKeys.length > 0 &&
      amenityIdList.length !== filters.amenityKeys.length) ||
    (filters.featureKeys !== undefined &&
      filters.featureKeys.length > 0 &&
      featureIdList.length !== filters.featureKeys.length)
  ) {
    return { rows: [], total: 0 };
  }

  const predicates = [
    eq(villas.isActive, true),
    eq(villaPriceCache.windowKind, "min_stay"),
    villaIds.length > 0 ? inArray(villas.id, villaIds) : undefined,
    filters.offersOnly === true
      ? eq(villaPriceCache.hasActiveDiscount, true)
      : undefined,
    filters.guests !== undefined
      ? gte(villas.capacity, filters.guests)
      : undefined,
    filters.bedrooms !== undefined
      ? gte(villas.bedrooms, filters.bedrooms)
      : undefined,
    filters.bathrooms !== undefined
      ? gte(villas.bathrooms, filters.bathrooms)
      : undefined,
    filters.minPriceCents !== undefined
      ? gte(villaPriceCache.discountedTotalCents, filters.minPriceCents)
      : undefined,
    filters.maxPriceCents !== undefined
      ? lte(villaPriceCache.discountedTotalCents, filters.maxPriceCents)
      : undefined,
    filters.featuredOnly === true ? eq(villas.isFeatured, true) : undefined,
    filters.bestValueOnly === true ? eq(villas.isBestValue, true) : undefined,
    locationId !== null ? eq(villas.locationId, locationId) : undefined,
    categoryId !== null
      ? sql`${villas.id} IN (
          SELECT ${villaCategories.villaId}
          FROM ${villaCategories}
          WHERE ${villaCategories.categoryId} = ${categoryId}
        )`
      : undefined,
    amenityIdList.length > 0
      ? sql`(
          SELECT COUNT(DISTINCT ${villaAmenities.amenityId})::int
          FROM ${villaAmenities}
          WHERE ${villaAmenities.villaId} = ${villas.id}
            AND ${inArray(
              villaAmenities.amenityId,
              amenityIdList.map((row) => row.id),
            )}
        ) = ${amenityIdList.length}`
      : undefined,
    featureIdList.length > 0
      ? sql`(
          SELECT COUNT(DISTINCT ${villaFeatures.featureId})::int
          FROM ${villaFeatures}
          WHERE ${villaFeatures.villaId} = ${villas.id}
            AND ${inArray(
              villaFeatures.featureId,
              featureIdList.map((row) => row.id),
            )}
        ) = ${featureIdList.length}`
      : undefined,
  ].filter(Boolean);

  const whereClause = and(...predicates);

  const countRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(villas)
    .innerJoin(
      villaTranslations,
      and(
        eq(villaTranslations.villaId, villas.id),
        eq(villaTranslations.locale, filters.locale),
      ),
    )
    .innerJoin(villaPriceCache, eq(villaPriceCache.villaId, villas.id))
    .where(whereClause);

  const total = countRows[0]?.count ?? 0;

  const rows = await db
    .select({
      id: villas.id,
      slug: villaTranslations.slug,
      refCode: villas.refCode,
      title: villaTranslations.title,
      summary: villaTranslations.summary,
      bedrooms: villas.bedrooms,
      bathrooms: villas.bathrooms,
      capacity: villas.capacity,
      mainImageUrl: villaImages.url,
      mainImageAlt: villaImages.altI18n,
      locationName: locationTranslations.name,
      baseTotalCents: villaPriceCache.baseTotalCents,
      priceFromCents: villaPriceCache.discountedTotalCents,
      avgNightlyCents: villaPriceCache.avgNightlyCents,
      hasActiveDiscount: villaPriceCache.hasActiveDiscount,
      cacheNightCount: villaPriceCache.nightCount,
      isEditorsChoice: villas.isEditorsChoice,
      isBestValue: villas.isBestValue,
      cacheCheckIn: villaPriceCache.checkIn,
      cacheCheckOut: villaPriceCache.checkOut,
      discountedTotalCents: villaPriceCache.discountedTotalCents,
      appliedPromotions: villaPriceCache.appliedPromotions,
    })
    .from(villas)
    .innerJoin(
      villaTranslations,
      and(
        eq(villaTranslations.villaId, villas.id),
        eq(villaTranslations.locale, filters.locale),
      ),
    )
    .innerJoin(villaPriceCache, eq(villaPriceCache.villaId, villas.id))
    .leftJoin(locations, eq(locations.id, villas.locationId))
    .leftJoin(
      locationTranslations,
      and(
        eq(locationTranslations.locationId, locations.id),
        eq(locationTranslations.locale, filters.locale),
      ),
    )
    .leftJoin(
      villaImages,
      and(eq(villaImages.villaId, villas.id), eq(villaImages.isMain, true)),
    )
    .where(whereClause)
    .orderBy(orderByClause, asc(villas.id))
    .limit(pageSize)
    .offset(offset);

  for (const row of rows) {
    cacheTag(`villa-${row.id}`);
  }

  return {
    total,
    rows: rows.map((row) => ({
      ...row,
      mainImageAlt:
        row.mainImageAlt !== null && row.mainImageAlt !== undefined
          ? localize(row.mainImageAlt, filters.locale)
          : null,
      cacheCheckIn: row.cacheCheckIn != null ? String(row.cacheCheckIn) : null,
      cacheCheckOut:
        row.cacheCheckOut != null ? String(row.cacheCheckOut) : null,
      appliedPromotions: row.appliedPromotions ?? [],
    })),
  };
}

export type VillaDetailBundle = {
  villa: VillaDetailRow;
  images: {
    id: string;
    url: string;
    alt: string | null;
    orderValue: number;
    isMain: boolean;
  }[];
  categories: { id: number; name: string; slug: string }[];
  amenities: { id: number; label: string; key: string; isHighlighted: boolean }[];
  features: { id: number; label: string; key: string; isHighlighted: boolean }[];
  rules: { id: number; label: string }[];
  priceCache: {
    windowKind: string;
    checkIn: string;
    checkOut: string;
    nightCount: number;
    baseTotalCents: number;
    discountedTotalCents: number;
    avgNightlyCents: number;
    hasActiveDiscount: boolean;
  } | null;
};

export async function getVillaDetailBundle(
  villaId: number,
  locale: Locale,
): Promise<VillaDetailBundle | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("villas", `villa-${villaId}`, "villa-price-cache");

  const villaRows = await db
    .select({
      id: villas.id,
      slug: villaTranslations.slug,
      refCode: villas.refCode,
      title: villaTranslations.title,
      summary: villaTranslations.summary,
      description: villaTranslations.description,
      bedrooms: villas.bedrooms,
      bathrooms: villas.bathrooms,
      capacity: villas.capacity,
      defaultMinStay: villas.defaultMinStay,
      checkInTime: villas.checkInTime,
      checkOutTime: villas.checkOutTime,
      latitude: villas.latitude,
      longitude: villas.longitude,
      locationName: locationTranslations.name,
      locationSlug: locationTranslations.slug,
      guestPolicy: villas.guestPolicy,
      editorRating: villas.editorRating,
      cancellationPolicyI18n: villas.cancellationPolicyI18n,
    })
    .from(villas)
    .innerJoin(
      villaTranslations,
      and(
        eq(villaTranslations.villaId, villas.id),
        eq(villaTranslations.locale, locale),
      ),
    )
    .leftJoin(locations, eq(locations.id, villas.locationId))
    .leftJoin(
      locationTranslations,
      and(
        eq(locationTranslations.locationId, locations.id),
        eq(locationTranslations.locale, locale),
      ),
    )
    .where(and(eq(villas.id, villaId), eq(villas.isActive, true)))
    .limit(1);

  const rawVilla = villaRows[0];
  if (rawVilla === undefined) return null;

  const villa: VillaDetailRow = {
    id: rawVilla.id,
    slug: rawVilla.slug,
    refCode: rawVilla.refCode,
    title: rawVilla.title,
    summary: rawVilla.summary,
    description: rawVilla.description,
    bedrooms: rawVilla.bedrooms,
    bathrooms: rawVilla.bathrooms,
    capacity: rawVilla.capacity,
    defaultMinStay: rawVilla.defaultMinStay,
    checkInTime: rawVilla.checkInTime,
    checkOutTime: rawVilla.checkOutTime,
    latitude: rawVilla.latitude,
    longitude: rawVilla.longitude,
    locationName: rawVilla.locationName,
    locationSlug: rawVilla.locationSlug,
    guestPolicy: rawVilla.guestPolicy,
    editorRating: rawVilla.editorRating,
    cancellationPolicy: resolveCancellationPolicy(
      rawVilla.cancellationPolicyI18n as LocalizedText | null,
      locale,
    ),
  };

  const [images, categoryRows, amenityRows, featureRows, rulesResolved, cacheRow] =
    await Promise.all([
      db
        .select({
          id: villaImages.id,
          url: villaImages.url,
          altI18n: villaImages.altI18n,
          orderValue: villaImages.orderValue,
          isMain: villaImages.isMain,
        })
        .from(villaImages)
        .where(eq(villaImages.villaId, villaId))
        .orderBy(asc(villaImages.orderValue)),

      db
        .select({
          id: categories.id,
          name: categoryTranslations.name,
          slug: categoryTranslations.slug,
        })
        .from(villaCategories)
        .innerJoin(categories, eq(categories.id, villaCategories.categoryId))
        .innerJoin(
          categoryTranslations,
          and(
            eq(categoryTranslations.categoryId, categories.id),
            eq(categoryTranslations.locale, locale),
          ),
        )
        .where(eq(villaCategories.villaId, villaId)),

      db
        .select({
          id: amenities.id,
          labelI18n: amenities.labelI18n,
          key: amenities.key,
          isHighlighted: villaAmenities.isHighlighted,
        })
        .from(villaAmenities)
        .innerJoin(amenities, eq(amenities.id, villaAmenities.amenityId))
        .where(eq(villaAmenities.villaId, villaId)),

      db
        .select({
          id: features.id,
          labelI18n: features.labelI18n,
          key: features.key,
          isHighlighted: villaFeatures.isHighlighted,
        })
        .from(villaFeatures)
        .innerJoin(features, eq(features.id, villaFeatures.featureId))
        .where(eq(villaFeatures.villaId, villaId)),

      db
        .select({
          id: villaRules.id,
          labelI18n: villaRules.labelI18n,
        })
        .from(villaRuleLinks)
        .innerJoin(villaRules, eq(villaRules.id, villaRuleLinks.ruleId))
        .where(eq(villaRuleLinks.villaId, villaId))
        .orderBy(asc(villaRules.orderValue)),

      db
        .select()
        .from(villaPriceCache)
        .where(
          and(
            eq(villaPriceCache.villaId, villaId),
            eq(villaPriceCache.windowKind, "min_stay"),
          ),
        )
        .limit(1),
    ]);

  const priceRow = cacheRow[0];

  return {
    villa,
    images: images.map((image) => ({
      id: image.id,
      url: image.url,
      orderValue: image.orderValue,
      isMain: image.isMain,
      alt:
        image.altI18n !== null && image.altI18n !== undefined
          ? localize(image.altI18n, locale)
          : null,
    })),
    categories: categoryRows,
    amenities: amenityRows.map((row) => ({
      id: row.id,
      key: row.key,
      isHighlighted: row.isHighlighted,
      label: localize(row.labelI18n, locale),
    })),
    features: featureRows.map((row) => ({
      id: row.id,
      key: row.key,
      isHighlighted: row.isHighlighted,
      label: localize(row.labelI18n, locale),
    })),
    rules: rulesResolved.map((row) => ({
      id: row.id,
      label: localize(row.labelI18n, locale),
    })),
    priceCache:
      priceRow !== undefined
        ? {
            windowKind: String(priceRow.windowKind),
            checkIn: String(priceRow.checkIn),
            checkOut: String(priceRow.checkOut),
            nightCount: priceRow.nightCount,
            baseTotalCents: priceRow.baseTotalCents,
            discountedTotalCents: priceRow.discountedTotalCents,
            avgNightlyCents: priceRow.avgNightlyCents,
            hasActiveDiscount: priceRow.hasActiveDiscount,
          }
        : null,
  };
}
