import { Image as ImageIcon } from "lucide-react";
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

        <div className="min-w-0 max-w-3xl">
          <h2 className="font-serif text-[clamp(2.35rem,5.8vw,4rem)] font-normal leading-[0.95] tracking-[-0.02em] text-stone-900">
            {t("title")}
          </h2>
            <div className="mt-5 max-w-xl space-y-0 font-serif tracking-[-0.02em] text-stone-700">
              <p className="text-[clamp(1rem,1.85vw,1.2rem)] font-normal leading-[1.65]">
                {t("bodyLead")}
              </p>
              <p className="mt-5 text-[clamp(1.1rem,2.25vw,1.42rem)] font-normal leading-[1.65] lg:mt-6">
                {t("bodyReimburseLine")}
                <br />
                {t("bodyBeatLine")}
              </p>
            </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <a
              href={t("whatsappUrl")}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex w-full items-center justify-center gap-2 border border-stone-900 px-7 py-3 font-sans text-[10px] font-semibold uppercase tracking-[0.26em] text-stone-900 transition hover:bg-stone-900 hover:text-white sm:w-auto"
            >
              {t("whatsappCta")}
              <ImageIcon className="size-3.5 shrink-0" aria-hidden strokeWidth={1.75} />
            </a>
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center bg-orange-500 px-7 py-3 font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-white transition-colors hover:bg-orange-600 sm:w-auto"
            >
              {t("contactCta")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
