"use client";

import { useRouter } from "@/i18n/navigation";
import { createDeal, deleteDeal, updateDeal } from "@/actions/admin/deal.actions";
import type { AdminDealEditRow } from "@/db/queries/admin.deals.queries";
import type { Locale } from "@/lib/locales";
import { LOCALES } from "@/lib/locales";
import { useState } from "react";

type Mode = "create" | "edit";

type Props =
  | { mode: "create"; locale: Locale }
  | { mode: "edit"; locale: Locale; deal: AdminDealEditRow };

const TAB: Record<Locale, string> = {
  en: "EN",
  de: "DE",
  ru: "RU",
};

function toDatetimeLocal(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

function fromDatetimeLocal(s: string): Date | null {
  const t = s.trim();
  if (!t) return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function DealAdminForm(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const d = props.mode === "edit" ? props.deal : null;

  const [tab, setTab] = useState<Locale>("en");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [titleEn, setTitleEn] = useState(d?.titleI18n.en ?? "");
  const [titleDe, setTitleDe] = useState(d?.titleI18n.de ?? "");
  const [titleRu, setTitleRu] = useState(d?.titleI18n.ru ?? "");
  const [bodyEn, setBodyEn] = useState(d?.bodyI18n.en ?? "");
  const [bodyDe, setBodyDe] = useState(d?.bodyI18n.de ?? "");
  const [bodyRu, setBodyRu] = useState(d?.bodyI18n.ru ?? "");

  const [link, setLink] = useState(d?.link ?? "");
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(d?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(d?.endsAt ?? null));
  const [isActive, setIsActive] = useState(d?.isActive ?? true);
  const [orderValue, setOrderValue] = useState(String(d?.orderValue ?? 0));

  function titleFor(loc: Locale): string {
    if (loc === "en") return titleEn;
    if (loc === "de") return titleDe;
    return titleRu;
  }
  function setTitleFor(loc: Locale, v: string) {
    if (loc === "en") setTitleEn(v);
    else if (loc === "de") setTitleDe(v);
    else setTitleRu(v);
  }
  function bodyFor(loc: Locale): string {
    if (loc === "en") return bodyEn;
    if (loc === "de") return bodyDe;
    return bodyRu;
  }
  function setBodyFor(loc: Locale, v: string) {
    if (loc === "en") setBodyEn(v);
    else if (loc === "de") setBodyDe(v);
    else setBodyRu(v);
  }

  function formatErr(result: { ok: false; error: string; fieldErrors?: Record<string, string[]> }) {
    const extra = result.fieldErrors
      ? Object.values(result.fieldErrors)
          .flat()
          .filter(Boolean)
          .join(" ")
      : "";
    return [result.error, extra].filter(Boolean).join(" ");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (!titleEn.trim()) throw new Error("Title (English) is required.");
      if (!bodyEn.trim()) throw new Error("Body (English) is required.");
      const order = Number(orderValue);
      if (!Number.isInteger(order) || order < 0) throw new Error("Order must be a non-negative integer.");

      const titleI18n = {
        en: titleEn.trim(),
        ...(titleDe.trim() ? { de: titleDe.trim() } : {}),
        ...(titleRu.trim() ? { ru: titleRu.trim() } : {}),
      };
      const bodyI18n = {
        en: bodyEn.trim(),
        ...(bodyDe.trim() ? { de: bodyDe.trim() } : {}),
        ...(bodyRu.trim() ? { ru: bodyRu.trim() } : {}),
      };

      const linkVal = link.trim() === "" ? undefined : link.trim();
      const starts = fromDatetimeLocal(startsAt);
      const ends = fromDatetimeLocal(endsAt);

      if (isEdit && d) {
        const out = await updateDeal({
          dealId: d.id,
          titleI18n,
          bodyI18n,
          link: linkVal ?? null,
          startsAt: starts,
          endsAt: ends,
          isActive,
          orderValue: order,
        });
        if (!out.ok) setError(formatErr(out));
        else router.refresh();
      } else {
        const out = await createDeal({
          titleI18n,
          bodyI18n,
          link: linkVal,
          startsAt: starts ?? undefined,
          endsAt: ends ?? undefined,
          isActive,
          orderValue: order,
        });
        if (!out.ok) setError(formatErr(out));
        else {
          router.push({
            pathname: "/admin/deals/[id]",
            params: { id: String(out.data.dealId) },
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
    if (!isEdit || !d) return;
    if (!window.confirm("Delete this deal?")) return;
    setError(null);
    setPending(true);
    try {
      const out = await deleteDeal({ dealId: d.id });
      if (!out.ok) setError(formatErr(out));
      else router.push("/admin/deals");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {isEdit ? "Edit deal" : "New deal"}
        </h1>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded border-zinc-300"
            />
            <span className="text-sm">Active</span>
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
        <label className="mt-4 block">
          <span className="text-xs font-medium text-zinc-500">Link (optional)</span>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">Starts (optional)</span>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">Ends (optional)</span>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
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
            <span className="text-xs font-medium text-zinc-500">Title ({tab})</span>
            <input
              required={tab === "en"}
              value={titleFor(tab)}
              onChange={(e) => setTitleFor(tab, e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">Body ({tab})</span>
            <textarea
              required={tab === "en"}
              rows={6}
              value={bodyFor(tab)}
              onChange={(e) => setBodyFor(tab, e.target.value)}
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
