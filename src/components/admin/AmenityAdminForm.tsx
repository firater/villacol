"use client";

import { useRouter } from "@/i18n/navigation";
import {
  createAmenity,
  deleteAmenity,
  updateAmenity,
} from "@/actions/admin/amenity.actions";
import type { AdminAmenityEditRow } from "@/db/queries/admin.amenities.queries";
import type { Locale } from "@/lib/locales";
import { LOCALES } from "@/lib/locales";
import { labelToTaxonomyKey } from "@/lib/taxonomy-key";
import { useState } from "react";

type Props =
  | { mode: "create"; locale: Locale }
  | { mode: "edit"; locale: Locale; amenity: AdminAmenityEditRow };

const TAB: Record<Locale, string> = {
  en: "EN",
  de: "DE",
  ru: "RU",
};

function formatErr(result: {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
}) {
  const extra = result.fieldErrors
    ? Object.values(result.fieldErrors)
        .flat()
        .filter(Boolean)
        .join(" ")
    : "";
  return [result.error, extra].filter(Boolean).join(" ");
}

function buildLabelI18n(
  en: string,
  de: string,
  ru: string,
): { en: string; de?: string; ru?: string } {
  const trimmedEn = en.trim();
  if (!trimmedEn) throw new Error("English name is required.");
  const out: { en: string; de?: string; ru?: string } = { en: trimmedEn };
  const deT = de.trim();
  const ruT = ru.trim();
  if (deT) out.de = deT;
  if (ruT) out.ru = ruT;
  return out;
}

export function AmenityAdminForm(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const row = props.mode === "edit" ? props.amenity : null;

  const [tab, setTab] = useState<Locale>("en");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [icon, setIcon] = useState(row?.icon ?? "");
  const [isFilterable, setIsFilterable] = useState(row?.isFilterable ?? true);
  const [orderValue, setOrderValue] = useState(String(row?.orderValue ?? 0));

  const [nameEn, setNameEn] = useState(row?.labelI18n.en ?? "");
  const [nameDe, setNameDe] = useState(row?.labelI18n.de ?? "");
  const [nameRu, setNameRu] = useState(row?.labelI18n.ru ?? "");

  function nameFor(loc: Locale): string {
    if (loc === "en") return nameEn;
    if (loc === "de") return nameDe;
    return nameRu;
  }
  function setNameFor(loc: Locale, v: string) {
    if (loc === "en") setNameEn(v);
    else if (loc === "de") setNameDe(v);
    else setNameRu(v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const labelI18n = buildLabelI18n(nameEn, nameDe, nameRu);
      const order = Number(orderValue);
      if (!Number.isInteger(order) || order < 0) {
        throw new Error("Order must be a non-negative integer.");
      }
      const iconVal = icon.trim() === "" ? undefined : icon.trim();

      if (isEdit && row) {
        const out = await updateAmenity({
          amenityId: row.id,
          labelI18n,
          icon: iconVal ?? null,
          isFilterable,
          orderValue: order,
        });
        if (!out.ok) setError(formatErr(out));
        else router.refresh();
      } else {
        const out = await createAmenity({
          key: labelToTaxonomyKey(labelI18n.en),
          labelI18n,
          icon: iconVal,
          isFilterable,
          orderValue: order,
        });
        if (!out.ok) setError(formatErr(out));
        else {
          router.push({
            pathname: "/admin/amenities/[id]",
            params: { id: String(out.data.amenityId) },
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !row) return;
    if (!window.confirm("Delete this amenity?")) return;
    setError(null);
    setPending(true);
    try {
      const out = await deleteAmenity({ amenityId: row.id });
      if (!out.ok) setError(formatErr(out));
      else router.push("/admin/amenities");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {isEdit ? "Edit amenity" : "New amenity"}
        </h1>
        {isEdit ? (
          <p className="mt-1 text-sm text-zinc-500">
            Filter key: <span className="font-mono">{row?.key}</span>
          </p>
        ) : null}
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">
              Lucide icon name
            </span>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Wifi"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isFilterable}
                onChange={(e) => setIsFilterable(e.target.checked)}
                className="size-4 rounded border-zinc-300"
              />
              <span className="text-sm">Filterable</span>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-500">Order</span>
              <input
                type="number"
                min={0}
                value={orderValue}
                onChange={(e) => setOrderValue(e.target.value)}
                className="ml-2 w-24 rounded-lg border border-zinc-200 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setTab(loc)}
              className={`px-3 py-2 text-sm font-medium ${
                tab === loc
                  ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
                  : "text-zinc-500"
              }`}
            >
              {TAB[loc]}
            </button>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="text-xs font-medium text-zinc-500">Name ({tab})</span>
          <input
            required={tab === "en"}
            value={nameFor(tab)}
            onChange={(e) => setNameFor(tab, e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
      </section>

      {error !== null ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Saving…" : isEdit ? "Save" : "Create"}
        </button>
        {isEdit ? (
          <button
            type="button"
            disabled={pending}
            onClick={handleDelete}
            className="rounded-full border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-60 dark:border-red-900 dark:text-red-400"
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}