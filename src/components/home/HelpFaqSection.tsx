import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

const FAQ_KEYS = ["booking", "payment", "cancellation", "concierge"] as const;

export async function HelpFaqSection() {
  const t = await getTranslations("layout.home.help");

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      <header className="mb-10 text-center md:mb-12">
        <h2 className="font-serif text-3xl font-normal tracking-tight text-stone-900 md:text-4xl">
          {t("faqTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-lg font-sans text-base leading-relaxed text-stone-600">{t("body")}</p>
      </header>
      <div>
        {FAQ_KEYS.map((key) => (
          <details key={key} className="group border-b border-stone-200">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 marker:content-none">
              <span className="font-sans text-lg font-semibold text-stone-800">
                {t(`questions.${key}.q`)}
              </span>
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-stone-200/80 text-stone-500 transition-colors group-open:border-stone-300 group-open:text-stone-700"
                aria-hidden
              >
                <FaqToggleIcon className="transition-transform duration-300 group-open:rotate-45" />
              </span>
            </summary>
            <div className="pb-6 pe-12">
              <p className="font-sans text-base leading-relaxed text-stone-600">{t(`questions.${key}.a`)}</p>
            </div>
          </details>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link
          href="/contact"
          className="inline-flex h-11 items-center justify-center rounded-full bg-orange-600 px-8 font-sans text-sm text-white"
        >
          {t("cta")}
        </Link>
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
