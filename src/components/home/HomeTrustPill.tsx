import { getTranslations } from "next-intl/server";

export async function HomeTrustPill() {
  const t = await getTranslations("layout.home.whyUs");

  return (
    <div className="flex justify-center pt-10">
      <div className="rounded-full border border-stone-200/60 bg-white px-6 py-3 text-center">
        <p className="font-serif text-lg text-stone-900">{t("trustPillTitle")}</p>
        <p className="mt-1 font-sans text-xs text-stone-500">{t("trustPillSubtitle")}</p>
      </div>
    </div>
  );
}
