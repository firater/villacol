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
    <footer className="relative mt-auto w-full bg-stone-950 text-stone-300">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-stone-500/40 to-transparent"
      />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 lg:px-8 lg:pb-14 lg:pt-20">
        <div className="flex flex-col gap-10 border-b border-stone-800/90 pb-12 lg:flex-row lg:items-end lg:justify-between lg:gap-16 lg:pb-14">
          <div className="max-w-xl">
            <Link
              href="/"
              className="inline-block font-serif text-[clamp(2.65rem,7.5vw,4.35rem)] font-normal leading-[0.92] tracking-[-0.04em] text-white transition hover:text-stone-200"
            >
              <span className="text-orange-500">.</span>
              {tCommon("brand")}
            </Link>
            <p className="mt-5 font-serif text-[clamp(1.02rem,1.9vw,1.2rem)] font-normal italic leading-[1.6] text-stone-500">
              {t("tagline")}
            </p>
          </div>

          <Link
            href="/contact"
            className="inline-flex w-fit shrink-0 items-center justify-center border border-stone-600 px-6 py-3 font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-100 transition hover:border-white hover:bg-white hover:text-stone-950"
          >
            {tNav("contact")}
          </Link>
        </div>

        <nav
          className="grid gap-12 pt-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-10 lg:pt-14 xl:gap-x-14"
          aria-label={t("browse")}
        >
          <FooterColumn title={tHome("discoverTitle")}>
            <FooterLink href="/villas">{tNav("villas")}</FooterLink>
            <FooterLink href="/villa-offers">{tNav("offers")}</FooterLink>
            <FooterLink href="/find-villa">{tNav("findVilla")}</FooterLink>
          </FooterColumn>
          <FooterColumn title={tHome("supportTitle")}>
            <FooterLink href="/contact">{tNav("contact")}</FooterLink>
            <FooterLink href="/about">{tNav("about")}</FooterLink>
            <FooterLink href="/find-villa">{tHome("concierge")}</FooterLink>
          </FooterColumn>
          <FooterColumn title={t("legal")}>
            <FooterLink href="/terms">{t("terms")}</FooterLink>
            <FooterLink href="/privacy">{t("privacy")}</FooterLink>
          </FooterColumn>
          <FooterColumn title={t("browse")}>
            <FooterLink href="/">{tNav("home")}</FooterLink>
            <FooterLink href="/villas">{tNav("villas")}</FooterLink>
            <FooterLink href="/villa-offers">{tNav("offers")}</FooterLink>
          </FooterColumn>
        </nav>

        <div className="mt-12 flex flex-col gap-8 border-t border-stone-800/90 pt-10 lg:mt-14 lg:flex-row lg:items-center lg:justify-between lg:pt-12">
          <FooterSocial />
          <p className="font-sans text-[10px] font-medium uppercase tracking-[0.22em] text-stone-600 lg:max-w-xs lg:text-right">
            {tHome("paymentsNote")}
          </p>
        </div>

        <div className="mt-8 border-t border-stone-800/70 pt-8">
          {year === null ? (
            <span className="inline-block min-h-[1rem] min-w-[12rem] animate-pulse rounded bg-stone-800" />
          ) : (
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-600">
              {t("copyright", { year, brand: tCommon("brand") })}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="font-serif text-xl font-normal tracking-[-0.02em] text-white lg:text-[1.35rem]">
        {title}
      </h3>
      <div
        aria-hidden
        className="mt-3 h-px w-10 bg-gradient-to-r from-stone-500/70 to-transparent"
      />
      <ul role="list" className="mt-5 space-y-3.5">
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
      <Link
        href={href}
        className="font-serif text-[1.0625rem] font-normal leading-snug tracking-[-0.01em] text-stone-400 transition-colors hover:text-white lg:text-lg"
      >
        {children}
      </Link>
    </li>
  );
}

function FooterSocial() {
  return (
    <div className="flex items-center gap-6">
      <SocialIcon label="Facebook">
        <path
          fillRule="evenodd"
          d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
          clipRule="evenodd"
        />
      </SocialIcon>
      <SocialIcon label="Instagram">
        <path
          fillRule="evenodd"
          d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
          clipRule="evenodd"
        />
      </SocialIcon>
    </div>
  );
}

function SocialIcon({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="text-stone-500 transition-colors hover:text-stone-300" aria-hidden>
      <span className="sr-only">{label}</span>
      <svg fill="currentColor" viewBox="0 0 24 24" className="size-[1.125rem]">
        {children}
      </svg>
    </span>
  );
}
