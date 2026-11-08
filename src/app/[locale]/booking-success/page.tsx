import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";

import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
export default async function BookingSuccessPage() {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const t = await getTranslations("booking.success");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-20">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {t("body")}
        </p>
        <Link
          href="/villas"
          className="mt-8 inline-flex rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {t("backToVillas")}
        </Link>
      </div>
    </main>
  );
}
