import { getTranslations } from "next-intl/server";

type Props = {
  /** Optional placeholder until an app landing route exists. */
  appLinkHref?: string;
};

export async function TopAnnouncementBar({ appLinkHref = "#" }: Props) {
  const t = await getTranslations("layout.announcementBar");

  return (
    <div className="w-full border-b border-stone-200/60" role="region" aria-label={t("aria")}>
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-8 px-4 py-2.5 sm:px-6 lg:px-8">
        <p className="font-sans text-[10px] font-medium uppercase tracking-widest text-stone-700">
          {t("message")}
        </p>
        <a
          href={appLinkHref}
          className="font-sans text-[10px] font-semibold uppercase tracking-widest text-stone-900 transition-colors hover:text-stone-950"
        >
          {t("getApp")}
        </a>
      </div>
    </div>
  );
}
