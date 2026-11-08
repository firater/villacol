import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export async function ConciergeCta() {
  const t = await getTranslations("layout.home.concierge");

  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-stone-50 to-white px-6 py-12 text-center sm:px-12 sm:py-16 dark:border-amber-900/50 dark:from-amber-950/40 dark:via-zinc-950 dark:to-zinc-950">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.12),transparent_55%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-800/90 dark:text-amber-200/80">
          {t("eyebrow")}
        </p>
        <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          {t("title")}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
          {t("body")}
        </p>
        <Link
          href="/find-villa"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
