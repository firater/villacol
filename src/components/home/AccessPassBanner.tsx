import { Key } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function AccessPassBanner() {
  const t = await getTranslations("layout.home.accessPassBanner");

  return (
    <section className="w-full bg-white" aria-labelledby="access-pass-banner-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-3 border-y border-stone-200 py-4 text-center sm:flex-row sm:gap-4 lg:py-5">
          <div className="flex shrink-0 items-center gap-2.5" aria-hidden>
            <div className="flex size-6 items-center justify-center bg-neutral-950">
              <Key className="size-3.5 text-white" strokeWidth={1.25} />
            </div>
            <div className="flex size-6 items-center justify-center border border-neutral-950 bg-white">
              <Key className="size-3.5 text-neutral-950" strokeWidth={1.25} />
            </div>
          </div>

          <p
            id="access-pass-banner-title"
            className="font-serif text-xl font-normal leading-snug tracking-tight text-neutral-950 sm:text-2xl"
          >
            {t("title")}
          </p>
        </div>
      </div>
    </section>
  );
}
