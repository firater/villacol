"use client";

import { useRouter } from "@/i18n/navigation";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  updateCategoryTranslations,
} from "@/actions/admin/category.actions";
import type { AdminCategoryEditRow } from "@/db/queries/admin.categories.queries";
import type { Locale } from "@/lib/locales";
import { LOCALES } from "@/lib/locales";
import { useMemo, useState } from "react";

type Mode = "create" | "edit";

type Props =
  | { mode: "create"; locale: Locale }
  | { mode: "edit"; locale: Locale; category: AdminCategoryEditRow };

const TAB: Record<Locale, string> = {
  en: "EN",
  de: "DE",
  ru: "RU",
};

type LocaleFields = {
  name: string;
  slug: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
};

function emptyLocaleFields(): Record<Locale, LocaleFields> {
  return {
    en: {
      name: "",
      slug: "",
      description: "",
      metaTitle: "",
      metaDescription: "",
    },
    de: {
      name: "",
      slug: "",
      description: "",
      metaTitle: "",
      metaDescription: "",
    },
    ru: {
      name: "",
      slug: "",
      description: "",
      metaTitle: "",
      metaDescription: "",
    },
  };
}

function fieldsFromEdit(
  translations: AdminCategoryEditRow["translations"],
): Record<Locale, LocaleFields> {
  const base = emptyLocaleFields();
  for (const t of translations) {
    base[t.locale] = {
      name: t.name,
      slug: t.slug,
      description: t.description ?? "",
      metaTitle: t.metaTitle ?? "",
      metaDescription: t.metaDescription ?? "",
    };
  }
  return base;
}

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

export function CategoryAdminForm(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const row = props.mode === "edit" ? props.category : null;

  const [tab, setTab] = useState<Locale>("en");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isFeatured, setIsFeatured] = useState(row?.isFeatured ?? false);
  const [orderValue, setOrderValue] = useState(String(row?.orderValue ?? 0));
  const [fields, setFields] = useState<Record<Locale, LocaleFields>>(() =>
    row ? fieldsFromEdit(row.translations) : emptyLocaleFields(),
  );

  const current = fields[tab];

  function patchTab(patch: Partial<LocaleFields>) {
    setFields((prev) => ({ ...prev, [tab]: { ...prev[tab], ...patch } }));
  }

  const translationsPayload = useMemo(() => {
    const list: Array<{
      locale: Locale;
      name: string;
      slug: string;
      description?: string;
      metaTitle?: string;
      metaDescription?: string;
    }> = [];

    const en = fields.en;
    list.push({
      locale: "en",
      name: en.name.trim(),
      slug: en.slug.trim(),
      description: en.description.trim() || undefined,
      metaTitle: en.metaTitle.trim() || undefined,
      metaDescription: en.metaDescription.trim() || undefined,
    });

    for (const loc of LOCALES) {
      if (loc === "en") continue;
      const f = fields[loc];
      const name = f.name.trim();
      const slug = f.slug.trim();
      if (!name && !slug) continue;
      if (!name || !slug) return null;
      list.push({
        locale: loc,
        name,
        slug,
        description: f.description.trim() || undefined,
        metaTitle: f.metaTitle.trim() || undefined,
        metaDescription: f.metaDescription.trim() || undefined,
      });
    }
    return list;
  }, [fields]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (!fields.en.name.trim() || !fields.en.slug.trim()) {
        throw new Error("English name and slug are required.");
      }
      if (translationsPayload === null) {
        throw new Error("Each filled locale needs both name and slug.");
      }
      const order = Number(orderValue);
      if (!Number.isInteger(order) || order < 0) {
        throw new Error("Order must be a non-negative integer.");
      }

      if (isEdit && row) {
        const meta = await updateCategory({
          categoryId: row.id,
          isFeatured,
          orderValue: order,
        });
        if (!meta.ok) {
          setError(formatErr(meta));
          return;
        }
        const tr = await updateCategoryTranslations({
          categoryId: row.id,
          translations: translationsPayload,
        });
        if (!tr.ok) setError(formatErr(tr));
        else router.refresh();
      } else {
        const out = await createCategory({
          translations: translationsPayload,
          isFeatured,
          orderValue: order,
        });
        if (!out.ok) setError(formatErr(out));
        else {
          router.push({
            pathname: "/admin/categories/[id]",
            params: { id: String(out.data.categoryId) },
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
    if (!window.confirm("Delete this category?")) return;
    setError(null);
    setPending(true);
    try {
      const out = await deleteCategory({ categoryId: row.id });
      if (!out.ok) setError(formatErr(out));
      else router.push("/admin/categories");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {isEdit ? "Edit category" : "New category"}
        </h1>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="size-4 rounded border-zinc-300"
            />
            <span className="text-sm">Featured</span>
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
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">
              Name ({tab})
            </span>
            <input
              required={tab === "en"}
              value={current.name}
              onChange={(e) => patchTab({ name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">
              Slug ({tab})
            </span>
            <input
              required={tab === "en"}
              value={current.slug}
              onChange={(e) => patchTab({ slug: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">
              Description ({tab})
            </span>
            <textarea
              rows={5}
              value={current.description}
              onChange={(e) => patchTab({ description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">
              Meta title ({tab})
            </span>
            <input
              value={current.metaTitle}
              onChange={(e) => patchTab({ metaTitle: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">
              Meta description ({tab})
            </span>
            <textarea
              rows={3}
              value={current.metaDescription}
              onChange={(e) => patchTab({ metaDescription: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
        </div>
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