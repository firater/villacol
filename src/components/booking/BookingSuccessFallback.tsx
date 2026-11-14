import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/** Shown while Stripe return verification streams (default inquiry copy). */
export async function BookingSuccessFallback() {
  const t = await getTranslations("booking.success");

  return (
    <div className="max-w-md text-center" aria-busy="true">
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
  );
}
