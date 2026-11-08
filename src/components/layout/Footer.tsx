"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";

import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("layout.footer");
  const tNav = useTranslations("layout.nav");
  const tCommon = useTranslations("common");
  const tHome = useTranslations("layout.home.footer");
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="mt-auto w-full border-t border-stone-200/50 bg-stone-50 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-12">
          <div className="space-y-8">
            <Link href="/" className="inline-block w-max font-serif text-2xl text-neutral-950">
              <span className="text-orange-600">.</span>
              {tCommon("brand")}
            </Link>
            <p className="text-pretty font-sans text-sm leading-relaxed text-neutral-600">{t("tagline")}</p>
            <SocialIcons />
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <FooterColumn title={tHome("discoverTitle")}>
                <FooterLink href="/villas">{tNav("villas")}</FooterLink>
                <FooterLink href="/villa-offers">{tNav("offers")}</FooterLink>
                <FooterLink href="/find-villa">{tNav("findVilla")}</FooterLink>
              </FooterColumn>
              <div className="mt-10 md:mt-0">
                <FooterColumn title={tHome("supportTitle")}>
                  <FooterLink href="/contact">{tNav("contact")}</FooterLink>
                  <FooterLink href="/about">{tNav("about")}</FooterLink>
                  <FooterLink href="/find-villa">{tHome("concierge")}</FooterLink>
                </FooterColumn>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <FooterColumn title={t("browse")}>
                <FooterLink href="/about">{tNav("about")}</FooterLink>
                <FooterLink href="/contact">{tNav("contact")}</FooterLink>
                <FooterLink href="/">{tNav("home")}</FooterLink>
              </FooterColumn>
              <div className="mt-10 md:mt-0">
                <FooterColumn title={t("legal")}>
                  <FooterLink href="/terms">{t("terms")}</FooterLink>
                  <FooterLink href="/privacy">{t("privacy")}</FooterLink>
                </FooterColumn>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-stone-200/50 pt-8 sm:mt-20 lg:mt-24">
          <div className="flex flex-col items-start justify-between gap-3 text-sm/6 text-neutral-800 sm:flex-row sm:items-center">
            {year === null ? (
              <span className="inline-block min-h-[1.25rem] min-w-[14rem] animate-pulse rounded bg-neutral-200" />
            ) : (
              <p>{t("copyright", { year, brand: tCommon("brand") })}</p>
            )}
            <p className="text-neutral-500">{tHome("paymentsNote")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="font-serif text-2xl font-normal tracking-tight text-stone-900">{title}</h3>
      <ul role="list" className="mt-6 space-y-5">
        {children}
      </ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: "/" | "/villas" | "/villa-offers" | "/find-villa" | "/contact" | "/about" | "/terms" | "/privacy";
  children: ReactNode;
}) {
  return (
    <li>
      <Link href={href} className="font-sans text-sm leading-relaxed text-neutral-700 hover:text-orange-600">
        {children}
      </Link>
    </li>
  );
}

function SocialIcons() {
  return (
    <div className="flex gap-x-6">
      <span className="text-neutral-900" aria-hidden>
        <span className="sr-only">Facebook</span>
        <svg fill="currentColor" viewBox="0 0 24 24" className="size-6" aria-hidden>
          <path
            fillRule="evenodd"
            d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <span className="text-neutral-900" aria-hidden>
        <span className="sr-only">Instagram</span>
        <svg fill="currentColor" viewBox="0 0 24 24" className="size-6" aria-hidden>
          <path
            fillRule="evenodd"
            d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    </div>
  );
}
