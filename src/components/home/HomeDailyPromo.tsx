import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

const PROMO_IMAGE = "/smr9.jpg";

export async function HomeDailyPromo() {
  const t = await getTranslations("layout.home.dailyPromo");

  return (
    <Link href="/villa-offers" className="block w-full max-w-[420px] pb-6">
      <div className="relative h-[140px] overflow-visible">
        <Image src={PROMO_IMAGE} alt="" fill sizes="420px" className="object-cover object-[25%_65%]" />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-0 flex max-w-[70%] flex-col justify-center p-8">
          <p className="font-serif text-xl text-white">{t("title")}</p>
          <p className="mt-1 font-sans text-xs leading-relaxed text-white/85">{t("body")}</p>
        </div>
        <span className="absolute top-2/6 right-0 z-10 flex -translate-y-1/2 items-center gap-2 bg-white px-6 py-4 font-sans text-[10px] font-bold tracking-wide text-stone-900 uppercase">
          {t("chip")}
          <ArrowUpRight className="size-3.5 shrink-0 text-orange-600" />
        </span>
      </div>
    </Link>
  );
}

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M3.5 8.5 8.5 3.5M8.5 3.5H4.75M8.5 3.5V7.25"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
