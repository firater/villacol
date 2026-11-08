"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import {
  attachPromotionToVillas,
  detachPromotionFromVillas,
} from "@/actions/admin/promotion.actions";
import type { AdminActivePromotionOption } from "@/db/queries/admin.promotions.queries";
import { useRouter } from "@/i18n/navigation";

type Props = {
  villaId: number;
  activePromotions: AdminActivePromotionOption[];
  initiallyAttachedIds: readonly number[];
};

export function VillaPromotionLinker({
  villaId,
  activePromotions,
  initiallyAttachedIds,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initialSet = useMemo(
    () => new Set(initiallyAttachedIds),
    [initiallyAttachedIds],
  );

  const [attached, setAttached] = useState<Set<number>>(() => new Set(initialSet));

  useEffect(() => {
    setAttached(new Set(initiallyAttachedIds));
  }, [initiallyAttachedIds]);

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

  function toggle(promotionId: number, nextChecked: boolean) {
    setError(null);
    const wasAttached = attached.has(promotionId);

    startTransition(async () => {
      if (nextChecked && !wasAttached) {
        const out = await attachPromotionToVillas({
          promotionId,
          villaIds: [villaId],
        });
        if (!out.ok) {
          setError(formatActionError(out));
          return;
        }
        setAttached((prev) => new Set(prev).add(promotionId));
      } else if (!nextChecked && wasAttached) {
        const out = await detachPromotionFromVillas({
          promotionId,
          villaIds: [villaId],
        });
        if (!out.ok) {
          setError(formatActionError(out));
          return;
        }
        setAttached((prev) => {
          const next = new Set(prev);
          next.delete(promotionId);
          return next;
        });
      }
      router.refresh();
    });
  }

  if (activePromotions.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No active promotions exist yet. Create one under Promotions and mark it active.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Toggle promotions to attach or detach them for this villa. Only{" "}
        <strong>active</strong> promotions are listed.
      </p>
      <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {activePromotions.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 px-4 py-3 first:rounded-t-xl last:rounded-b-xl"
          >
            <input
              type="checkbox"
              id={`promo-${p.id}`}
              checked={attached.has(p.id)}
              disabled={pending}
              onChange={(e) => toggle(p.id, e.target.checked)}
              className="size-4 rounded border-zinc-300 text-zinc-900"
            />
            <label
              htmlFor={`promo-${p.id}`}
              className="flex-1 cursor-pointer text-sm font-medium text-zinc-900 dark:text-zinc-100"
            >
              {p.name}
            </label>
          </li>
        ))}
      </ul>
      {error !== null ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
