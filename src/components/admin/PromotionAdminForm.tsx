"use client";

import { useState } from "react";

import { createPromotion, updatePromotion } from "@/actions/admin/promotion.actions";
import type { AdminPromotionDetailRow } from "@/db/queries/admin.promotions.queries";
import { useRouter } from "@/i18n/navigation";
import { DEFAULT_COMMISSION_RATE_BP } from "@/lib/commission";
import type { Locale } from "@/lib/locales";
import { fromCents, toCents } from "@/lib/money";

type Mode = "create" | "edit";

type Props =
  | { mode: "create"; locale: Locale }
  | { mode: "edit"; locale: Locale; promotion: AdminPromotionDetailRow };

const DISCOUNT_TYPES = [
  { value: "percentage", label: "Percentage" },
  { value: "fixed_amount", label: "Fixed amount (EUR)" },
  { value: "free_days", label: "Free nights" },
  { value: "commission_waiver", label: "Commission waiver (direct booking)" },
] as const;

const TRIGGER_TYPES = [
  { value: "always", label: "Always" },
  { value: "long_stay", label: "Long stay" },
  { value: "last_minute", label: "Last minute" },
  { value: "early_bird", label: "Early bird" },
  { value: "coupon", label: "Coupon code" },
  { value: "exit_intent", label: "Exit intent" },
] as const;

function buildTriggerPayload(
  triggerType: (typeof TRIGGER_TYPES)[number]["value"],
  fields: {
    minNights: string;
    maxNights: string;
    lastMinuteWithinDays: string;
    earlyBirdMinDays: string;
    code: string;
  },
) {
  switch (triggerType) {
    case "always":
      return { triggerType: "always" as const };
    case "long_stay": {
      const min = Number(fields.minNights);
      if (!Number.isInteger(min) || min < 1)
        throw new Error("Long stay: enter a valid minimum nights (≥ 1).");
      const maxStr = fields.maxNights.trim();
      const max =
        maxStr === "" ? undefined : Number(maxStr);
      if (max !== undefined && (!Number.isInteger(max) || max < 1)) {
        throw new Error("Long stay: max nights must be empty or a positive integer.");
      }
      return {
        triggerType: "long_stay" as const,
        minNights: min,
        maxNights: max ?? null,
      };
    }
    case "last_minute": {
      const d = Number(fields.lastMinuteWithinDays);
      if (!Number.isInteger(d) || d < 0)
        throw new Error("Last minute: enter days (0–365).");
      return { triggerType: "last_minute" as const, lastMinuteWithinDays: d };
    }
    case "early_bird": {
      const d = Number(fields.earlyBirdMinDays);
      if (!Number.isInteger(d) || d < 1)
        throw new Error("Early bird: enter minimum days before check-in (≥ 1).");
      return { triggerType: "early_bird" as const, earlyBirdMinDays: d };
    }
    case "coupon":
    case "exit_intent": {
      const code = fields.code.trim();
      if (code.length < 3) throw new Error("Enter a code (at least 3 characters).");
      return triggerType === "coupon"
        ? { triggerType: "coupon" as const, code }
        : { triggerType: "exit_intent" as const, code };
    }
    default: {
      const _x: never = triggerType;
      return _x;
    }
  }
}

function buildDiscountPayload(
  discountType: (typeof DISCOUNT_TYPES)[number]["value"],
  fields: {
    percentInput: string;
    fixedEur: string;
    freeNights: string;
    freeNightsThreshold: string;
    waiverPercentInput: string;
  },
) {
  switch (discountType) {
    case "percentage": {
      const pct = Number(fields.percentInput);
      if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
        throw new Error("Enter a percentage between 0 and 100.");
      }
      const bp = Math.round(pct * 100);
      if (bp < 1 || bp > 10_000) throw new Error("Percentage out of range.");
      return { discountType: "percentage" as const, percentBp: bp };
    }
    case "fixed_amount": {
      const eur = fields.fixedEur.trim();
      const n = Number(eur);
      if (!Number.isFinite(n) || n <= 0) throw new Error("Enter a positive fixed amount in EUR.");
      const cents = toCents(n);
      if (cents < 1) throw new Error("Amount too small.");
      return { discountType: "fixed_amount" as const, fixedAmountCents: cents };
    }
    case "free_days": {
      const fn = Number(fields.freeNights);
      const th = Number(fields.freeNightsThreshold);
      if (!Number.isInteger(fn) || fn < 1 || fn > 364) {
        throw new Error("Free nights: enter nights to waive (1–364).");
      }
      if (!Number.isInteger(th) || th < 2 || th > 365) {
        throw new Error("Threshold: enter total nights required (2–365).");
      }
      if (fn >= th) throw new Error("Free nights must be less than the pay threshold.");
      return {
        discountType: "free_days" as const,
        freeNights: fn,
        freeNightsThreshold: th,
      };
    }
    case "commission_waiver": {
      // Blank means "track the global commission rate", which is the point of
      // the waiver — a rate change should not need every promotion rewritten.
      const raw = fields.waiverPercentInput.trim();
      if (raw === "") {
        return { discountType: "commission_waiver" as const, percentBp: null };
      }
      const pct = Number(raw);
      if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
        throw new Error(
          "Commission waiver: leave blank to use the global rate, or enter 0–100.",
        );
      }
      const bp = Math.round(pct * 100);
      if (bp < 1 || bp > 10_000) throw new Error("Percentage out of range.");
      return { discountType: "commission_waiver" as const, percentBp: bp };
    }
    default: {
      const _x: never = discountType;
      return _x;
    }
  }
}

function formatActionError(result: {
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

export function PromotionAdminForm(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const p = props.mode === "edit" ? props.promotion : null;

  const [name, setName] = useState(p?.name ?? "");
  const [displayNameEn, setDisplayNameEn] = useState(
    p?.displayNameI18n.en ?? "",
  );
  const [displayNameDe, setDisplayNameDe] = useState(p?.displayNameI18n.de ?? "");
  const [displayNameRu, setDisplayNameRu] = useState(p?.displayNameI18n.ru ?? "");

  const [discountType, setDiscountType] = useState<
    (typeof DISCOUNT_TYPES)[number]["value"]
  >(
    p?.discountType === "fixed_amount" ||
      p?.discountType === "free_days" ||
      p?.discountType === "commission_waiver"
      ? (p.discountType as "fixed_amount" | "free_days" | "commission_waiver")
      : "percentage",
  );

  const [percentInput, setPercentInput] = useState(
    p?.discountType === "percentage" && p.percentBp != null
      ? String(p.percentBp / 100)
      : "10",
  );
  const [waiverPercentInput, setWaiverPercentInput] = useState(
    p?.discountType === "commission_waiver" && p.percentBp != null
      ? String(p.percentBp / 100)
      : "",
  );
  const [fixedEur, setFixedEur] = useState(
    p?.fixedAmountCents != null ? String(fromCents(p.fixedAmountCents)) : "",
  );
  const [freeNights, setFreeNights] = useState(
    p?.freeNights != null ? String(p.freeNights) : "1",
  );
  const [freeNightsThreshold, setFreeNightsThreshold] = useState(
    p?.freeNightsThreshold != null ? String(p.freeNightsThreshold) : "7",
  );

  const [triggerType, setTriggerType] = useState<
    (typeof TRIGGER_TYPES)[number]["value"]
  >((p?.triggerType as (typeof TRIGGER_TYPES)[number]["value"]) ?? "always");

  const [minNights, setMinNights] = useState(
    p?.minNights != null ? String(p.minNights) : "7",
  );
  const [maxNights, setMaxNights] = useState(
    p?.maxNights != null ? String(p.maxNights) : "",
  );
  const [lastMinuteWithinDays, setLastMinuteWithinDays] = useState(
    p?.lastMinuteWithinDays != null ? String(p.lastMinuteWithinDays) : "14",
  );
  const [earlyBirdMinDays, setEarlyBirdMinDays] = useState(
    p?.earlyBirdMinDays != null ? String(p.earlyBirdMinDays) : "60",
  );
  const [code, setCode] = useState(p?.code ?? "");

  const [isActive, setIsActive] = useState(p?.isActive ?? true);
  const [isStackable, setIsStackable] = useState(p?.isStackable ?? true);
  const [priorityOrder, setPriorityOrder] = useState(
    String(p?.priorityOrder ?? 100),
  );
  const [overrideMinNights, setOverrideMinNights] = useState(
    p?.overrideMinNights != null ? String(p.overrideMinNights) : "",
  );

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      if (!name.trim()) throw new Error("Internal name is required.");
      if (!displayNameEn.trim()) throw new Error("Display name (English) is required.");

      const priority = Number(priorityOrder);
      if (!Number.isInteger(priority) || priority < 0) {
        throw new Error("Priority must be a non-negative integer.");
      }

      const overrideRaw = overrideMinNights.trim();
      const overrideParsed =
        overrideRaw === "" ? undefined : Number(overrideRaw);
      if (
        overrideParsed !== undefined &&
        (!Number.isInteger(overrideParsed) ||
          overrideParsed < 1 ||
          overrideParsed > 365)
      ) {
        throw new Error("Override min nights must be empty or an integer from 1–365.");
      }

      const displayNameI18n = {
        en: displayNameEn.trim(),
        ...(displayNameDe.trim() ? { de: displayNameDe.trim() } : {}),
        ...(displayNameRu.trim() ? { ru: displayNameRu.trim() } : {}),
      };

      const discount = buildDiscountPayload(discountType, {
        percentInput,
        fixedEur,
        freeNights,
        freeNightsThreshold,
        waiverPercentInput,
      });

      const trigger = buildTriggerPayload(triggerType, {
        minNights,
        maxNights,
        lastMinuteWithinDays,
        earlyBirdMinDays,
        code,
      });

      if (isEdit && p) {
        const result = await updatePromotion({
          promotionId: p.id,
          name: name.trim(),
          displayNameI18n,
          priorityOrder: priority,
          isStackable,
          isActive,
          overrideMinNights: overrideParsed ?? null,
          discount,
          trigger,
        });

        if (!result.ok) {
          setError(formatActionError(result));
          return;
        }
        router.refresh();
      } else {
        const result = await createPromotion({
          name: name.trim(),
          displayNameI18n,
          descriptionI18n: undefined,
          bookingWindowStart: undefined,
          bookingWindowEnd: undefined,
          travelWindowStart: undefined,
          travelWindowEnd: undefined,
          priorityOrder: priority,
          isStackable,
          isActive,
          maxRedemptions: undefined,
          overrideMinNights: overrideParsed ?? null,
          discount,
          trigger,
        });

        if (!result.ok) {
          setError(formatActionError(result));
          return;
        }

        router.push({
          pathname: "/admin/promotions/[id]",
          params: { id: String(result.data.promotionId) },
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
          {isEdit ? "Edit promotion" : "New promotion"}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Core discount and trigger. Windows and villa links can be added later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Identity
          </h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Internal name
              </span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Display name (English)
              </span>
              <input
                required
                value={displayNameEn}
                onChange={(e) => setDisplayNameEn(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Display name (Deutsch) — optional
                </span>
                <input
                  value={displayNameDe}
                  onChange={(e) => setDisplayNameDe(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Display name (Русский) — optional
                </span>
                <input
                  value={displayNameRu}
                  onChange={(e) => setDisplayNameRu(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Discount
          </h2>
          <div className="mt-4 grid gap-4">
            <label className="block">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Discount type
              </span>
              <select
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as typeof discountType)
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                {DISCOUNT_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            {discountType === "percentage" ? (
              <label className="block">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Percent off (%)
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={percentInput}
                  onChange={(e) => setPercentInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
            ) : null}

            {discountType === "fixed_amount" ? (
              <label className="block">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Amount (EUR)
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={fixedEur}
                  onChange={(e) => setFixedEur(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
            ) : null}

            {discountType === "free_days" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Free nights
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={364}
                    value={freeNights}
                    onChange={(e) => setFreeNights(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Pay at least (nights)
                  </span>
                  <input
                    type="number"
                    min={2}
                    max={365}
                    value={freeNightsThreshold}
                    onChange={(e) => setFreeNightsThreshold(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
              </div>
            ) : null}

            {discountType === "commission_waiver" ? (
              <label className="block">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Waiver percent (%) — blank uses the global commission rate
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={String(DEFAULT_COMMISSION_RATE_BP / 100)}
                  value={waiverPercentInput}
                  onChange={(e) => setWaiverPercentInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
                <span className="mt-1 block text-xs text-zinc-500">
                  Turn off “stackable” to make booking direct override every
                  other promotion.
                </span>
              </label>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Trigger
          </h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Trigger type
              </span>
              <select
                value={triggerType}
                onChange={(e) =>
                  setTriggerType(e.target.value as typeof triggerType)
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                {TRIGGER_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            {triggerType === "long_stay" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Min nights
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={minNights}
                    onChange={(e) => setMinNights(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Max nights (optional)
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={maxNights}
                    onChange={(e) => setMaxNights(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
              </div>
            ) : null}

            {triggerType === "last_minute" ? (
              <label className="block">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Within days before check-in
                </span>
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={lastMinuteWithinDays}
                  onChange={(e) => setLastMinuteWithinDays(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
            ) : null}

            {triggerType === "early_bird" ? (
              <label className="block">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Book at least N days ahead
                </span>
                <input
                  type="number"
                  min={1}
                  max={730}
                  value={earlyBirdMinDays}
                  onChange={(e) => setEarlyBirdMinDays(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
            ) : null}

            {triggerType === "coupon" || triggerType === "exit_intent" ? (
              <label className="block">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Code
                </span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Behaviour
          </h2>
          <div className="mt-4 flex flex-wrap gap-6">
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
                checked={isStackable}
                onChange={(e) => setIsStackable(e.target.checked)}
                className="size-4 rounded border-zinc-300 text-zinc-900"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                Stackable (false = exclusive)
              </span>
            </label>
          </div>
          <label className="mt-4 block max-w-xs">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Priority order (lower runs first)
            </span>
            <input
              type="number"
              min={0}
              required
              value={priorityOrder}
              onChange={(e) => setPriorityOrder(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="mt-4 block max-w-xs">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Emergency override min nights
            </span>
            <input
              type="number"
              min={1}
              max={365}
              placeholder="Leave empty to disable"
              value={overrideMinNights}
              onChange={(e) => setOverrideMinNights(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
            <span className="mt-1 block text-xs text-zinc-500">
              When this promotion applies, guests may book down to this many nights.
            </span>
          </label>
        </section>

        {error !== null ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {pending ? "Saving…" : isEdit ? "Save promotion" : "Create promotion"}
        </button>
      </form>
    </div>
  );
}
