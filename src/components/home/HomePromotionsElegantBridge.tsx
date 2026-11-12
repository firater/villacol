import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

const COLLAGE_IMAGES = ["/smr4.webp", "/smr3.jpg", "/smr9.jpg"] as const;

const COLLAGE_OFFSETS = ["0px", "1.35rem", "2.5rem"] as const;

export async function HomePromotionsElegantBridge() {
  const t = await getTranslations("layout.home.promotionsElegantBridge");
  const titleId = "home-promotions-elegant-bridge-title";

  return (
    <section className="w-full bg-white" aria-labelledby={titleId}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative border-y border-stone-200/80 py-4 lg:py-5">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-stone-300/60 to-transparent lg:inset-x-10"
          />

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
            <div className="relative h-[3rem] w-[6.25rem] shrink-0" aria-hidden>
              {COLLAGE_IMAGES.map((src, index) => (
                <div
                  key={src}
                  className="absolute top-0 overflow-hidden border border-white/95 bg-stone-50 shadow-[0_4px_14px_-8px_rgba(28,25,23,0.35)]"
                  style={{
                    left: COLLAGE_OFFSETS[index],
                    zIndex: index + 1,
                    width: "2.15rem",
                    height: "2.85rem",
                  }}
                >
                  <Image
                    src={src}
                    alt=""
                    width={34}
                    height={46}
                    className="h-full w-full object-cover"
                    sizes="34px"
                  />
                </div>
              ))}
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="font-sans text-[9px] font-medium uppercase tracking-[0.34em] text-stone-400">
                {t("kicker")}
              </p>
              <p
                id={titleId}
                className="mt-1.5 font-serif text-[clamp(1.05rem,2vw,1.35rem)] font-normal leading-snug tracking-tight text-stone-900"
              >
                {t("title")}
              </p>
            </div>

            <Link
              href="/villa-offers"
              className="group shrink-0 font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-800 underline-offset-[5px] transition hover:text-brand hover:underline"
            >
              {t("cta")}
              <span
                aria-hidden
                className="ml-1.5 text-[11px] font-normal normal-case tracking-normal transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
