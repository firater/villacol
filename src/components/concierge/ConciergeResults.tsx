"use client";

import { useTranslations } from "next-intl";

import { VillaCard, type VillaCardProps } from "@/components/villa/VillaCard";

type Props = {
  villas: VillaCardProps[];
  onStartOver: () => void;
};

export function ConciergeResults({ villas, onStartOver }: Props) {
  const t = useTranslations("concierge.results");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {t("heading")}
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {t("subtitle")}
        </p>
      </div>

      {villas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-600 dark:border-zinc-700">
          {t("empty")}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {villas.map((props) => (
            <VillaCard key={props.slug} {...props} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onStartOver}
        className="text-sm font-medium text-amber-800 underline dark:text-amber-200"
      >
        {t("startOver")}
      </button>
    </div>
  );
}
