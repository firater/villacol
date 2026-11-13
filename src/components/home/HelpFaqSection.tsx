import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

const FAQ_KEYS = ["booking", "payment", "cancellation", "concierge"] as const;

export async function HelpFaqSection() {
  const t = await getTranslations("layout.home.help");

  return (
    <div id="help" className="scroll-mt-28 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:gap-20">
        <aside className="bg-stone-950 px-8 py-12 text-white sm:px-10 lg:px-10 lg:py-14">
          <p className="font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-stone-500">
            {t("eyebrow")}
          </p>
          <h2 className="mt-5 font-serif text-[clamp(1.85rem,4vw,2.75rem)] font-normal leading-[1.05] tracking-[-0.02em] text-white">
            {t("title")}
          </h2>
          <p className="mt-5 font-sans text-sm leading-[1.75] text-stone-300 md:text-[15px]">
            {t("body")}
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex items-center justify-center bg-white px-7 py-3 font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-950 transition-colors hover:bg-stone-100"
          >
            {t("cta")}
          </Link>
          <p className="mt-8 border-t border-white/15 pt-6 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
            {t("responseNote")}
          </p>
        </aside>

        <div className="mt-12 min-w-0 lg:mt-0 lg:pt-5 xl:pt-6">
          <p className="mb-6 font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-stone-400">
            {t("faqTitle")}
          </p>
          <div className="border-y border-stone-300/80">
            {FAQ_KEYS.map((key, index) => (
              <details
                key={key}
                className="group border-b border-stone-200/90 last:border-b-0"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 marker:content-none transition-colors hover:bg-stone-50/80 [&::-webkit-details-marker]:hidden">
                  <div className="flex min-w-0 flex-1 gap-5">
                    <span
                      className="mt-0.5 shrink-0 font-sans text-[10px] font-semibold tabular-nums tracking-[0.28em] text-stone-400"
                      aria-hidden
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-serif text-[clamp(1.1rem,2vw,1.35rem)] font-normal leading-snug text-stone-900">
                      {t(`questions.${key}.q`)}
                    </span>
                  </div>
                  <span
                    className="flex size-9 shrink-0 items-center justify-center border border-stone-300/90 text-stone-500 transition-colors group-open:border-stone-900 group-open:bg-stone-900 group-open:text-white"
                    aria-hidden
                  >
                    <FaqToggleIcon className="transition-transform duration-300 group-open:rotate-45" />
                  </span>
                </summary>
                <div className="pb-7 pe-4 ps-10 sm:pe-14">
                  <p className="max-w-2xl font-sans text-sm leading-[1.75] text-stone-600 md:text-[15px]">
                    {t(`questions.${key}.a`)}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqToggleIcon({ className }: { className?: string }) {
  return (
    <svg className={`size-4 ${className ?? ""}`} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
