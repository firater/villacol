"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import {
  setVillaAmenities,
  setVillaCategories,
  setVillaFeatures,
} from "@/actions/admin/villa-taxonomy.actions";
import { createVillaImage, deleteVillaImage } from "@/actions/admin/image.actions";
import type { AdminTaxonomyOption } from "@/db/queries/admin.taxonomy.queries";
import type { AdminVillaImageRow } from "@/db/queries/admin.villas.queries";
import { useRouter } from "@/i18n/navigation";

type AmenityLink = { id: number; isHighlighted: boolean };
type FeatureLink = { id: number; isHighlighted: boolean };

type Props = {
  villaId: number;
  initialImages: AdminVillaImageRow[];
  amenityOptions: AdminTaxonomyOption[];
  featureOptions: AdminTaxonomyOption[];
  categoryOptions: AdminTaxonomyOption[];
  initialAmenities: AmenityLink[];
  initialFeatures: FeatureLink[];
  initialCategoryIds: readonly number[];
};

export function VillaMediaFeaturesPanel({
  villaId,
  initialImages,
  amenityOptions,
  featureOptions,
  categoryOptions,
  initialAmenities,
  initialFeatures,
  initialCategoryIds,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [images, setImages] = useState(initialImages);
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const amenityMap = useMemo(() => {
    const m = new Map<number, boolean>();
    const h = new Map<number, boolean>();
    for (const a of initialAmenities) {
      m.set(a.id, true);
      h.set(a.id, a.isHighlighted);
    }
    return { linked: m, highlight: h };
  }, [initialAmenities]);

  const featureMap = useMemo(() => {
    const m = new Map<number, boolean>();
    const h = new Map<number, boolean>();
    for (const f of initialFeatures) {
      m.set(f.id, true);
      h.set(f.id, f.isHighlighted);
    }
    return { linked: m, highlight: h };
  }, [initialFeatures]);

  const [amenityOn, setAmenityOn] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(amenityOptions.map((o) => [o.id, amenityMap.linked.has(o.id)])),
  );
  const [amenityHi, setAmenityHi] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(amenityOptions.map((o) => [o.id, amenityMap.highlight.get(o.id) ?? false])),
  );

  const [featureOn, setFeatureOn] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(featureOptions.map((o) => [o.id, featureMap.linked.has(o.id)])),
  );
  const [featureHi, setFeatureHi] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(featureOptions.map((o) => [o.id, featureMap.highlight.get(o.id) ?? false])),
  );

  const [categoryOn, setCategoryOn] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(
      categoryOptions.map((o) => [o.id, initialCategoryIds.includes(o.id)]),
    ),
  );

  useEffect(() => {
    setAmenityOn(
      Object.fromEntries(amenityOptions.map((o) => [o.id, amenityMap.linked.has(o.id)])),
    );
    setAmenityHi(
      Object.fromEntries(
        amenityOptions.map((o) => [o.id, amenityMap.highlight.get(o.id) ?? false]),
      ),
    );
  }, [amenityOptions, amenityMap]);

  useEffect(() => {
    setFeatureOn(
      Object.fromEntries(featureOptions.map((o) => [o.id, featureMap.linked.has(o.id)])),
    );
    setFeatureHi(
      Object.fromEntries(
        featureOptions.map((o) => [o.id, featureMap.highlight.get(o.id) ?? false]),
      ),
    );
  }, [featureOptions, featureMap]);

  useEffect(() => {
    setCategoryOn(
      Object.fromEntries(
        categoryOptions.map((o) => [o.id, initialCategoryIds.includes(o.id)]),
      ),
    );
  }, [categoryOptions, initialCategoryIds]);

  function formatErr(result: { ok: false; error: string; fieldErrors?: Record<string, string[]> }) {
    const extra = result.fieldErrors
      ? Object.values(result.fieldErrors)
          .flat()
          .filter(Boolean)
          .join(" ")
      : "";
    return [result.error, extra].filter(Boolean).join(" ");
  }

  function addImage(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const url = newUrl.trim();
    if (!url) return;

    startTransition(async () => {
      const out = await createVillaImage({
        villaId,
        url,
        isMain: images.length === 0,
        orderValue: images.length,
      });
      if (!out.ok) {
        setError(formatErr(out));
        return;
      }
      setNewUrl("");
      router.refresh();
    });
  }

  function removeImage(imageId: string) {
    setError(null);
    startTransition(async () => {
      const out = await deleteVillaImage({ imageId });
      if (!out.ok) {
        setError(formatErr(out));
        return;
      }
      router.refresh();
    });
  }

  function saveAmenities() {
    setError(null);
    const items = amenityOptions
      .filter((o) => amenityOn[o.id])
      .map((o) => ({ id: o.id, isHighlighted: amenityHi[o.id] ?? false }));

    startTransition(async () => {
      const out = await setVillaAmenities({ villaId, items });
      if (!out.ok) setError(formatErr(out));
      else router.refresh();
    });
  }

  function saveFeatures() {
    setError(null);
    const items = featureOptions
      .filter((o) => featureOn[o.id])
      .map((o) => ({ id: o.id, isHighlighted: featureHi[o.id] ?? false }));

    startTransition(async () => {
      const out = await setVillaFeatures({ villaId, items });
      if (!out.ok) setError(formatErr(out));
      else router.refresh();
    });
  }

  function saveCategories() {
    setError(null);
    const ids = categoryOptions.filter((o) => categoryOn[o.id]).map((o) => o.id);

    startTransition(async () => {
      const out = await setVillaCategories({ villaId, ids });
      if (!out.ok) setError(formatErr(out));
      else router.refresh();
    });
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Images
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Paste image URLs. The first image is the main photo when none was set.
        </p>
        <form onSubmit={addImage} className="mt-4 flex flex-wrap gap-2">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://…"
            className="min-w-[240px] flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Add
          </button>
        </form>
        <ul className="mt-4 divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {images.length === 0 ? (
            <li className="px-4 py-6 text-sm text-zinc-500">No images yet.</li>
          ) : (
            images.map((img) => (
              <li
                key={img.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {img.url}
                  </div>
                  {img.isMain ? (
                    <span className="text-xs text-amber-700 dark:text-amber-300">Main</span>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => removeImage(img.id)}
                  className="shrink-0 text-sm font-medium text-red-700 hover:underline dark:text-red-400"
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Amenities
          </h2>
          <button
            type="button"
            disabled={pending}
            onClick={saveAmenities}
            className="text-sm font-semibold text-amber-800 hover:underline dark:text-amber-200"
          >
            Save amenities
          </button>
        </div>
        <CheckboxGrid
          options={amenityOptions}
          on={amenityOn}
          setOn={setAmenityOn}
          highlight={amenityHi}
          setHighlight={setAmenityHi}
          showHighlight
        />
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Features
          </h2>
          <button
            type="button"
            disabled={pending}
            onClick={saveFeatures}
            className="text-sm font-semibold text-amber-800 hover:underline dark:text-amber-200"
          >
            Save features
          </button>
        </div>
        <CheckboxGrid
          options={featureOptions}
          on={featureOn}
          setOn={setFeatureOn}
          highlight={featureHi}
          setHighlight={setFeatureHi}
          showHighlight
        />
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Categories
          </h2>
          <button
            type="button"
            disabled={pending}
            onClick={saveCategories}
            className="text-sm font-semibold text-amber-800 hover:underline dark:text-amber-200"
          >
            Save categories
          </button>
        </div>
        <CheckboxGrid
          options={categoryOptions}
          on={categoryOn}
          setOn={setCategoryOn}
          highlight={{}}
          setHighlight={() => {}}
          showHighlight={false}
        />
      </section>

      {error !== null ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CheckboxGrid({
  options,
  on,
  setOn,
  highlight,
  setHighlight,
  showHighlight,
}: {
  options: AdminTaxonomyOption[];
  on: Record<number, boolean>;
  setOn: (v: Record<number, boolean> | ((p: Record<number, boolean>) => Record<number, boolean>)) => void;
  highlight: Record<number, boolean>;
  setHighlight: (
    v: Record<number, boolean> | ((p: Record<number, boolean>) => Record<number, boolean>),
  ) => void;
  showHighlight: boolean;
}) {
  if (options.length === 0) {
    return (
      <p className="mt-2 text-sm text-zinc-500">No options in the database yet.</p>
    );
  }

  return (
    <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      {options.map((o) => (
        <label
          key={o.id}
          className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
        >
          <input
            type="checkbox"
            checked={on[o.id] ?? false}
            onChange={(e) => {
              const checked = e.target.checked;
              setOn((prev) => ({ ...prev, [o.id]: checked }));
              if (!checked) {
                setHighlight((prev) => ({ ...prev, [o.id]: false }));
              }
            }}
            className="mt-0.5 size-4 rounded border-zinc-300"
          />
          <span className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">{o.label}</span>
          {showHighlight ? (
            <label className="flex items-center gap-1 text-xs text-zinc-500">
              <input
                type="checkbox"
                disabled={!(on[o.id] ?? false)}
                checked={highlight[o.id] ?? false}
                onChange={(e) =>
                  setHighlight((prev) => ({ ...prev, [o.id]: e.target.checked }))
                }
                className="size-3.5 rounded border-zinc-300"
              />
              Pin
            </label>
          ) : null}
        </label>
      ))}
    </div>
  );
}
