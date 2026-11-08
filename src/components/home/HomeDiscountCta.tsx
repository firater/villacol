import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export async function HomeDiscountCta() {
  const t = await getTranslations("layout.home.discountCta");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-stone-900 px-6 py-14 text-center sm:px-10 md:py-20">
        <p className="font-sans text-xs tracking-[0.25em] text-stone-400 uppercase">{t("eyebrow")}</p>
        <h2 className="mx-auto mt-5 max-w-2xl font-serif text-4xl font-normal tracking-tight text-white md:text-5xl lg:text-[3.25rem] lg:leading-tight">
          {t("title")}
        </h2>
        <p className="mx-auto mt-6 max-w-xl font-sans text-base leading-relaxed text-stone-300 md:text-lg">
          {t("body")}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/contact"
            className="inline-flex h-12 min-w-[11rem] items-center justify-center rounded-full bg-white px-8 font-sans text-sm font-medium text-stone-900"
          >
            {t("contactCta")}
          </Link>
          <a
            href={t("whatsappUrl")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 min-w-[11rem] items-center justify-center rounded-full bg-orange-600 px-8 font-sans text-sm font-medium text-white"
          >
            WhatsApp — {t("whatsapp")}
          </a>
        </div>
      </div>
    </div>
  );
}
