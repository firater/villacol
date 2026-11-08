import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";

import { ConciergeWizard } from "@/components/concierge/ConciergeWizard";
import { routing } from "@/i18n/routing";

export default async function FindVillaPage() {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }

  const t = await getTranslations("concierge");

  return (
    <main className="flex flex-1 flex-col">
      <div className="border-b border-zinc-200 bg-gradient-to-b from-amber-50/80 via-white to-zinc-50 dark:border-zinc-800 dark:from-amber-950/30 dark:via-zinc-950 dark:to-zinc-950">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800/90 dark:text-amber-200/80">
            {t("eyebrow")}
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("intro")}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <ConciergeWizard />
      </div>
    </main>
  );
}
