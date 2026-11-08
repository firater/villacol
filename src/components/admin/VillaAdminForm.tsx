"use client";

import { useMemo, useState } from "react";

import {
  createVilla,
  updateVilla,
  updateVillaTranslations,
} from "@/actions/admin/villa.actions";
import { VillaMediaFeaturesPanel } from "@/components/admin/VillaMediaFeaturesPanel";
import { VillaPromotionLinker } from "@/components/admin/VillaPromotionLinker";
import type { AdminActivePromotionOption } from "@/db/queries/admin.promotions.queries";
import type { AdminTaxonomyOption } from "@/db/queries/admin.taxonomy.queries";
import type {
  AdminLocationOption,
  AdminVillaEditRow,
} from "@/db/queries/admin.villas.queries";
import { Link, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/lib/locales";
import { LOCALES } from "@/lib/locales";
import { fromCents, toCents } from "@/lib/money";

type Mode = "create" | "edit";

type Props =
  | {
      mode: "create";
      locale: Locale;
      locations: AdminLocationOption[];
    }
  | {
      mode: "edit";
      locale: Locale;
      locations: AdminLocationOption[];
      villa: AdminVillaEditRow;
      activePromotions: AdminActivePromotionOption[];
      attachedPromotionIds: number[];
      amenityOptions: AdminTaxonomyOption[];
      featureOptions: AdminTaxonomyOption[];
      categoryOptions: AdminTaxonomyOption[];
      villaAmenities: { id: number; isHighlighted: boolean }[];
      villaFeatures: { id: number; isHighlighted: boolean }[];
      villaCategoryIds: readonly number[];
    };

const TAB_LABEL: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  ru: "Русский",
};

function emptyTranslation(locale: Locale) {
  return {
    locale,
    slug: "",
    title: "",
    summary: "",
    description: "",
  };
}

function buildInitialTranslations(villa: AdminVillaEditRow | undefined) {
  const map = new Map(villa?.translations.map((t) => [t.locale, t]));
  return LOCALES.map((loc) => {
    const existing = map.get(loc);
    return existing
      ? {
          locale: loc,
          slug: existing.slug,
          title: existing.title,
          summary: existing.summary ?? "",
          description: existing.description ?? "",
        }
      : emptyTranslation(loc);
  });
}

export function VillaAdminForm(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const villa = props.mode === "edit" ? props.villa : undefined;

  const [mainTab, setMainTab] = useState<
    "details" | "promotions" | "media"
  >("details");
  const [tab, setTab] = useState<Locale>("en");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [refCode, setRefCode] = useState(villa?.refCode ?? "");
  const [brandSlug, setBrandSlug] = useState(villa?.brandSlug ?? "");
  const [locationId, setLocationId] = useState<string>(
    villa?.locationId != null ? String(villa.locationId) : "",
  );
  const [capacity, setCapacity] = useState(String(villa?.capacity ?? 2));
  const [bedrooms, setBedrooms] = useState(String(villa?.bedrooms ?? 1));
  const [bathrooms, setBathrooms] = useState(String(villa?.bathrooms ?? 1));
  const [defaultNightlyEur, setDefaultNightlyEur] = useState(
    villa?.defaultNightlyPriceCents != null
      ? String(fromCents(villa.defaultNightlyPriceCents))
      : "",
  );
  const [cleaningEur, setCleaningEur] = useState(
    String(fromCents(villa?.cleaningFeeCents ?? 0)),
  );
  const [isActive, setIsActive] = useState(villa?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(villa?.isFeatured ?? false);
  const [isEditorsChoice, setIsEditorsChoice] = useState(
    villa?.isEditorsChoice ?? false,
  );
  const [isBestValue, setIsBestValue] = useState(villa?.isBestValue ?? false);
  const [orderValue, setOrderValue] = useState(String(villa?.orderValue ?? 0));

  const [translations, setTranslations] = useState(() => buildInitialTranslations(villa));

  const transByLocale = useMemo(
    () => new Map(translations.map((t) => [t.locale, t])),
    [translations],
  );
  const current = transByLocale.get(tab) ?? emptyTranslation(tab);

  function updateCurrent(partial: Partial<(typeof translations)[0]>) {
    setTranslations((prev) =>
      prev.map((row) => (row.locale === tab ? { ...row, ...partial } : row)),
    );
  }

  function parseOptionalCents(eurStr: string): number | null {
    const t = eurStr.trim();
    if (t === "") return null;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error("Enter a valid non-negative amount for price fields.");
    }
    return toCents(n);
  }

  function parseRequiredCents(eurStr: string): number {
    const t = eurStr.trim();
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error("Enter a valid non-negative amount for the cleaning fee.");
    }
    return toCents(n);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const cap = Number(capacity);
      const bed = Number(bedrooms);
      const bath = Number(bathrooms);
      const order = Number(orderValue);
      if (!Number.isInteger(cap) || cap < 1) throw new Error("Capacity must be a positive integer.");
      if (!Number.isInteger(bed) || bed < 0) throw new Error("Bedrooms must be a non-negative integer.");
      if (!Number.isInteger(bath) || bath < 0) throw new Error("Bathrooms must be a non-negative integer.");
      if (!Number.isInteger(order) || order < 0) throw new Error("Order must be a non-negative integer.");

      const defaultNightlyCents = parseOptionalCents(defaultNightlyEur);
      const cleaningFeeCents = parseRequiredCents(cleaningEur);

      const locId =
        locationId === "" ? null : Number(locationId);
      if (locId !== null && (!Number.isInteger(locId) || locId < 1)) {
        throw new Error("Pick a valid location or leave it empty.");
      }

      const enRow = transByLocale.get("en");
      if (!enRow || !enRow.slug.trim() || !enRow.title.trim()) {
        throw new Error("English slug and title are required.");
      }

      const translationPayload = LOCALES.map((loc) => {
        const row = transByLocale.get(loc)!;
        const slug = row.slug.trim() || enRow.slug.trim();
        const title = row.title.trim() || enRow.title.trim();
        return {
          locale: loc,
          slug,
          title,
          summary: row.summary.trim() === "" ? null : row.summary.trim(),
          description: row.description.trim() === "" ? null : row.description.trim(),
          metaTitle: null as string | null,
          metaDescription: null as string | null,
        };
      });

      if (!refCode.trim()) throw new Error("Reference code is required.");
      if (!brandSlug.trim()) throw new Error("Brand slug is required.");

      if (isEdit && villa) {
        const core = await updateVilla({
          villaId: villa.id,
          refCode: refCode.trim(),
          slug: brandSlug.trim(),
          locationId: locId,
          capacity: cap,
          bedrooms: bed,
          bathrooms: bath,
          defaultNightlyPriceCents: defaultNightlyCents,
          cleaningFeeCents,
          defaultMinStay: villa.defaultMinStay,
          depositCents: villa.depositCents,
          checkInTime: villa.checkInTime,
          checkOutTime: villa.checkOutTime,
          latitude: villa.latitude,
          longitude: villa.longitude,
          isActive,
          isFeatured,
          isEditorsChoice,
          isBestValue,
          orderValue: order,
        });

        if (!core.ok) {
          setError(formatActionError(core));
          return;
        }

        const tr = await updateVillaTranslations({
          villaId: villa.id,
          translations: translationPayload,
        });

        if (!tr.ok) {
          setError(formatActionError(tr));
          return;
        }

        router.refresh();
        setError(null);
      } else {
        const created = await createVilla({
          refCode: refCode.trim(),
          slug: brandSlug.trim(),
          locationId: locId ?? undefined,
          capacity: cap,
          bedrooms: bed,
          bathrooms: bath,
          defaultNightlyPriceCents: defaultNightlyCents ?? undefined,
          cleaningFeeCents,
          defaultMinStay: 5,
          depositCents: 0,
          checkInTime: "16:00",
          checkOutTime: "10:00",
          isActive,
          isFeatured,
          isEditorsChoice,
          isBestValue,
          orderValue: order,
          translations: translationPayload,
        });

        if (!created.ok) {
          setError(formatActionError(created));
          return;
        }

        router.push({
          pathname: "/admin/villas/[id]",
          params: { id: String(created.data.villaId) },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {isEdit ? "Edit villa" : "New villa"}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {isEdit
            ? "Details, media, taxonomy, and promotion links. Open Calendar for nightly prices."
            : "Core fields and locale content. After creating the villa you can add media, taxonomy, and promotions."}
        </p>
        {isEdit && villa ? (
          <div className="mt-4">
            <Link
              href={{
                pathname: "/admin/villas/[id]/calendar",
                params: { id: String(villa.id) },
              }}
              className="inline-flex rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Open calendar
            </Link>
          </div>
        ) : null}
      </div>

      {isEdit && villa ? (
        <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setMainTab("details")}
            className={`px-4 py-2 text-sm font-medium ${
              mainTab === "details"
                ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => setMainTab("media")}
            className={`px-4 py-2 text-sm font-medium ${
              mainTab === "media"
                ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Media &amp; features
          </button>
          <button
            type="button"
            onClick={() => setMainTab("promotions")}
            className={`px-4 py-2 text-sm font-medium ${
              mainTab === "promotions"
                ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Promotions
          </button>
        </div>
      ) : null}

      {isEdit && villa && mainTab === "media" && props.mode === "edit" ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
          <VillaMediaFeaturesPanel
            villaId={villa.id}
            initialImages={villa.images}
            amenityOptions={props.amenityOptions}
            featureOptions={props.featureOptions}
            categoryOptions={props.categoryOptions}
            initialAmenities={props.villaAmenities}
            initialFeatures={props.villaFeatures}
            initialCategoryIds={props.villaCategoryIds}
          />
        </section>
      ) : null}

      {isEdit && villa && mainTab === "promotions" && props.mode === "edit" ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Promotions
          </h2>
          <div className="mt-4">
            <VillaPromotionLinker
              villaId={villa.id}
              activePromotions={props.activePromotions}
              initiallyAttachedIds={props.attachedPromotionIds}
            />
          </div>
        </section>
      ) : null}

      {mainTab === "details" || !isEdit ? (
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Property
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Reference code
              </span>
              <input
                required
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Brand slug (locale-independent)
              </span>
              <input
                required
                value={brandSlug}
                onChange={(e) => setBrandSlug(e.target.value)}
                placeholder="villa-sunset"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Location
              </span>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">— None —</option>
                {props.locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Capacity
              </span>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Bedrooms
              </span>
              <input
                type="number"
                min={0}
                max={50}
                required
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Bathrooms
              </span>
              <input
                type="number"
                min={0}
                max={50}
                required
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Default nightly price (EUR)
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={defaultNightlyEur}
                onChange={(e) => setDefaultNightlyEur(e.target.value)}
                placeholder="Leave empty to use calendar only"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Cleaning fee (EUR)
              </span>
              <input
                type="text"
                inputMode="decimal"
                required
                value={cleaningEur}
                onChange={(e) => setCleaningEur(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                List order
              </span>
              <input
                type="number"
                min={0}
                required
                value={orderValue}
                onChange={(e) => setOrderValue(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <div className="flex flex-wrap gap-6 sm:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="size-4 rounded border-zinc-300 text-zinc-900"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="size-4 rounded border-zinc-300 text-zinc-900"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Featured</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isEditorsChoice}
                  onChange={(e) => setIsEditorsChoice(e.target.checked)}
                  className="size-4 rounded border-zinc-300 text-zinc-900"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Editor&apos;s Choice
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isBestValue}
                  onChange={(e) => setIsBestValue(e.target.checked)}
                  className="size-4 rounded border-zinc-300 text-zinc-900"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Best Value</span>
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Translations
          </h2>
          <div className="mt-3 flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
            {LOCALES.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setTab(loc)}
                className={`px-3 py-2 text-sm font-medium ${
                  tab === loc
                    ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {TAB_LABEL[loc]}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-4">
            <label className="block">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                URL slug ({tab})
              </span>
              <input
                required={tab === "en"}
                value={current.slug}
                onChange={(e) => updateCurrent({ slug: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Title
              </span>
              <input
                required={tab === "en"}
                value={current.title}
                onChange={(e) => updateCurrent({ title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Summary
              </span>
              <textarea
                rows={3}
                value={current.summary}
                onChange={(e) => updateCurrent({ summary: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Description
              </span>
              <textarea
                rows={8}
                value={current.description}
                onChange={(e) => updateCurrent({ description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
          </div>
        </section>

        {error !== null ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create villa"}
          </button>
        </div>
      </form>
      ) : null}
    </div>
  );
}

function formatActionError(result: { ok: false; error: string; fieldErrors?: Record<string, string[]> }) {
  const extra = result.fieldErrors
    ? Object.values(result.fieldErrors)
        .flat()
        .filter(Boolean)
        .join(" ")
    : "";
  return [result.error, extra].filter(Boolean).join(" ");
}
