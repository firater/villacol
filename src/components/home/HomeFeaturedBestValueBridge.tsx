import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { ComponentProps } from "react";

type BridgeMessageKey = "featuredBestValueBridge" | "findMyVillaBridge";

const BRIDGE_EDITORIAL_IMAGE_BY_KEY: Record<BridgeMessageKey, string> = {
  featuredBestValueBridge: "/smr2.webp",
  findMyVillaBridge: "/smr4.webp",
};

const BRIDGE_BY_INSTANCE: Record<string, { messageKey: BridgeMessageKey }> = {
  categories: { messageKey: "featuredBestValueBridge" },
  "featured-best-value": { messageKey: "findMyVillaBridge" },
};

type CategoryOfTheDayRef = {
  slug: string;
  label: string;
};

type Props = {
  instanceId?: string;
  /** When nested inside another section container (e.g. categories). */
  embedded?: boolean;
  /** Today's category for the Daily Edit banner (`instanceId: categories`). */
  categoryOfTheDay?: CategoryOfTheDayRef;
};

export async function HomeFeaturedBestValueBridge({
  instanceId = "featured-best-value",
  embedded = false,
  categoryOfTheDay,
}: Props) {
  const preset =
    BRIDGE_BY_INSTANCE[instanceId] ?? BRIDGE_BY_INSTANCE["featured-best-value"]!;
  const t = await getTranslations(`layout.home.${preset.messageKey}`);
  const titleId = `home-section-bridge-title-${instanceId}`;

  let linkHref: ComponentProps<typeof Link>["href"] =
    preset.messageKey === "findMyVillaBridge" ? "/find-villa" : "/villas";
  const categoryOfTheDayLabel = categoryOfTheDay?.label ?? null;

  if (preset.messageKey === "featuredBestValueBridge" && categoryOfTheDay) {
    linkHref = {
      pathname: "/villas",
      query: { category: categoryOfTheDay.slug },
    };
  }

  const ctaClassName =
    preset.messageKey === "findMyVillaBridge"
      ? "group inline-flex items-center gap-2 border border-brand bg-brand px-5 py-2.5 font-sans text-[10px] font-semibold uppercase tracking-[0.26em] text-white transition hover:border-brand-dark hover:bg-brand-dark"
      : "group inline-flex items-center gap-2 border border-stone-900 px-5 py-2.5 font-sans text-[10px] font-semibold uppercase tracking-[0.26em] text-stone-900 transition hover:bg-stone-900 hover:text-white";

  const shellClassName = embedded
    ? "relative border-y border-stone-200/90 py-6 lg:py-7"
    : "relative border-t border-stone-200/90 py-7 lg:py-8";

  const inner = (
    <div className={shellClassName}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-stone-300/70 to-transparent sm:inset-x-12 lg:inset-x-16"
          />

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-10">
            <div
              className="relative h-[5.25rem] w-[7.5rem] shrink-0 overflow-hidden border border-white/90 bg-stone-100 shadow-[0_6px_18px_-10px_rgba(28,25,23,0.45)]"
              aria-hidden
            >
              <Image
                src={BRIDGE_EDITORIAL_IMAGE_BY_KEY[preset.messageKey]}
                alt=""
                fill
                className="object-cover object-top"
                sizes="120px"
              />
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-500">
                {t("kicker")}
              </p>
              <p
                id={titleId}
                className="mt-2 font-serif text-[clamp(1.25rem,2.4vw,1.75rem)] font-normal leading-snug tracking-tight text-stone-900"
              >
                {t("title")}
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm font-light leading-relaxed text-stone-600 sm:mx-0">
                {preset.messageKey === "featuredBestValueBridge" && categoryOfTheDayLabel
                  ? t.rich("body", {
                      bold: () => (
                        <span className="font-bold text-stone-800">
                          {categoryOfTheDayLabel}
                        </span>
                      ),
                    })
                  : t("body")}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-center sm:items-end">
              <div
                className="mb-3 hidden h-px w-16 bg-stone-300 sm:block lg:w-24"
                aria-hidden
              />
              <Link href={linkHref} className={ctaClassName}>
                {categoryOfTheDayLabel
                  ? t("cta", { category: categoryOfTheDayLabel })
                  : t("cta")}
                <span
                  aria-hidden
                  className="text-xs font-normal normal-case tracking-normal transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            </div>
          </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="w-full" aria-labelledby={titleId}>
        {inner}
      </div>
    );
  }

  return (
    <section className="mt-12 w-full bg-white lg:mt-20" aria-labelledby={titleId}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{inner}</div>
    </section>
  );
}
