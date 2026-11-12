import { Mars, Percent, Venus } from "lucide-react";
import { getTranslations } from "next-intl/server";

type Props = {
  variant?: "default" | "promotions";
};

export async function AccessPassBanner({ variant = "default" }: Props) {
  const t = await getTranslations("layout.home.accessPassBanner");
  const title =
    variant === "promotions" ? t("promotionsTitle") : t("title");
  const titleId = `access-pass-banner-title-${variant}`;

  return (
    <section className="w-full bg-white" aria-labelledby={titleId}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-3 border-y border-stone-200 py-4 text-center sm:flex-row sm:gap-4 lg:py-5">
          <div className="flex shrink-0 items-center gap-2.5" aria-hidden>
            {variant === "default" ? (
              <div className="flex size-6 items-center justify-center bg-neutral-950">
                <Mars className="size-3.5 text-white" strokeWidth={1.25} />
              </div>
            ) : null}
            {variant === "default" ? (
              <div className="flex size-6 items-center justify-center border border-neutral-950 bg-white">
                <Venus className="size-3.5 text-neutral-950" strokeWidth={1.25} />
              </div>
            ) : null}
            {variant === "promotions" ? (
              <div className="flex size-6 items-center justify-center border border-neutral-950 bg-white">
                <Percent className="size-3.5 text-neutral-950" strokeWidth={1.25} />
              </div>
            ) : null}
          </div>

          <p
            id={titleId}
            className="font-serif text-xl font-normal leading-snug tracking-tight text-neutral-950 sm:text-2xl"
          >
            {title}
          </p>
        </div>
      </div>
    </section>
  );
}
