import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export async function HomeDiscountCta() {
  const t = await getTranslations("layout.home.discountCta");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="border-y border-solid border-stone-300/80 py-10 lg:py-12">
        <p className="mb-5 font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-stone-400">
          {t("eyebrow")}
        </p>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-16">
          <div className="min-w-0 max-w-3xl">
            <h2 className="font-serif text-[clamp(2.35rem,5.8vw,4rem)] font-normal leading-[0.95] tracking-[-0.02em] text-stone-900">
              {t("title")}
            </h2>
            <p className="mt-5 max-w-xl font-sans text-[15px] leading-[1.7] text-stone-600">
              {t("body")}
            </p>
            <p className="mt-4 max-w-xl font-serif text-[clamp(1.05rem,2vw,1.25rem)] font-normal italic leading-snug text-stone-800">
              {t("guarantee")}
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center bg-stone-900 px-7 py-3 font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-white transition-colors hover:bg-stone-800"
            >
              {t("contactCta")}
            </Link>
            <a
              href={t("whatsappUrl")}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 border border-stone-900 px-7 py-3 font-sans text-[10px] font-semibold uppercase tracking-[0.26em] text-stone-900 transition hover:bg-stone-900 hover:text-white"
            >
              {t("whatsappCta")}
              <span
                aria-hidden
                className="text-xs font-normal normal-case tracking-normal transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
