"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";

const UTILITY_FOOTER_LINKS = [
  { messageKey: "userAgreement", href: "/terms" },
  { messageKey: "privacyPolicy", href: "/privacy" },
  { messageKey: "californiaPrivacy", href: "/privacy" },
  { messageKey: "accessibility", href: "/contact" },
  { messageKey: "masthead", href: "/" },
  { messageKey: "visualStories", href: "/villas" },
  { messageKey: "siteMap", href: "/villas" },
] as const;

const FOOTER_NAV_LINK =
  "inline-block text-[15px] font-light leading-[1.55] text-stone-400 transition-colors duration-200 hover:text-white";

const FOOTER_UTILITY_LINK =
  "text-sm font-light leading-snug text-stone-500 transition-colors duration-200 hover:text-stone-200";

type FooterHref =
  | "/"
  | "/villas"
  | "/villa-offers"
  | "/find-villa"
  | "/contact"
  | "/about"
  | "/terms"
  | "/privacy"
  | "/journal"
  | "/journal/best-beaches"
  | "/journal/travel-safety-guide"
  | { pathname: "/"; hash: string };

export function Footer() {
  const t = useTranslations("layout.footer");
  const tNav = useTranslations("layout.nav");
  const tCommon = useTranslations("common");
  const tHomeFooter = useTranslations("layout.home.footer");
  const tJournal = useTranslations("journal.hub");
  const tJournalArticles = useTranslations("journal.hub.articles");

  return (
    <footer className="relative mt-auto w-full bg-[#0a0a0a] font-sans text-stone-300 antialiased">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-stone-400/25 to-transparent"
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-14 lg:flex-row lg:items-start lg:justify-between lg:gap-16 xl:gap-24">
          <div className="max-w-[22rem] shrink-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-stone-500">
              {t("colophon")}
            </p>
            <Link
              href="/"
              className="mt-3.5 inline-block font-serif text-[clamp(2rem,4.2vw,2.35rem)] font-normal leading-none tracking-[-0.03em] text-white transition-colors duration-200 hover:text-stone-100"
            >
              <span className="text-orange-500">.</span>
              {tCommon("brand")}
            </Link>
            <p className="mt-4 text-[15px] font-light leading-[1.65] text-stone-400">
              {t("intro")}
            </p>
            <FooterSocial />
          </div>

          <div className="flex flex-col gap-12 sm:flex-row sm:gap-14 md:gap-16 lg:gap-20 lg:pt-1 xl:gap-28">
            <FooterColumn title={t("exploreTitle")}>
              <FooterLink href="/">{tNav("home")}</FooterLink>
              <FooterLink href="/find-villa">{tNav("findVilla")}</FooterLink>
              <FooterLink href={{ pathname: "/", hash: "help" }}>{t("faq")}</FooterLink>
              <FooterLink href="/contact">{tNav("contact")}</FooterLink>
              <FooterLink href="/villas">{tNav("villas")}</FooterLink>
            </FooterColumn>
            <FooterColumn title={t("legal")}>
              <FooterLink href="/terms">{t("terms")}</FooterLink>
              <FooterLink href="/privacy">{t("privacy")}</FooterLink>
              <FooterLink href="/about">{tNav("about")}</FooterLink>
            </FooterColumn>
            <FooterColumn title={t("journalTitle")}>
              <FooterLink href="/journal">{tJournal("title")}</FooterLink>
              <FooterLink href="/journal/best-beaches">
                {tJournalArticles("bestBeaches.title")}
              </FooterLink>
              <FooterLink href="/journal/travel-safety-guide">
                {tJournalArticles("travelSafety.title")}
              </FooterLink>
            </FooterColumn>
          </div>
        </div>

        <div className="mt-14 border-t border-stone-800 pt-9 lg:mt-16 lg:pt-10">
          <p className="text-[11px] font-light uppercase tracking-[0.2em] text-stone-500">
            {tHomeFooter("paymentsNote")}
          </p>

          <nav className="mt-7 lg:mt-8" aria-label={t("utilityNavAria")}>
            <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-1 sm:gap-y-2">
              {UTILITY_FOOTER_LINKS.map(({ messageKey, href }, index) => (
                <li key={messageKey} className="flex items-center">
                  {index > 0 ? (
                    <span
                      aria-hidden
                      className="mx-2.5 hidden text-stone-700 sm:inline"
                    >
                      ·
                    </span>
                  ) : null}
                  <Link href={href} className={FOOTER_UTILITY_LINK}>
                    {t(`utilityLinks.${messageKey}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-[10rem] sm:min-w-[11rem]">
      <h3 className="text-base font-medium tracking-[0.02em] text-white sm:text-[1.0625rem]">
        {title}
      </h3>
      <ul role="list" className="mt-5 space-y-3 sm:space-y-3.5">
        {children}
      </ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: FooterHref; children: ReactNode }) {
  return (
    <li>
      <Link href={href} className={FOOTER_NAV_LINK}>
        {children}
      </Link>
    </li>
  );
}

function FooterSocial() {
  return (
    <div className="mt-7 flex flex-wrap items-center gap-1 sm:gap-1.5">
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
      <SocialIcon label="X">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </SocialIcon>
      <SocialIcon label="LinkedIn">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </SocialIcon>
      <SocialIcon label="YouTube">
        <path
          fillRule="evenodd"
          d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 01-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 01-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 011.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418zm-5.945 7.444l-5.338 3.092V9.77l5.338 3.092z"
          clipRule="evenodd"
        />
      </SocialIcon>
    </div>
  );
}

function SocialIcon({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span
      className="inline-flex rounded-full p-2.5 text-stone-500 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
      role="img"
      aria-label={label}
    >
      <svg fill="currentColor" viewBox="0 0 24 24" className="size-[1.125rem]">
        {children}
      </svg>
    </span>
  );
}
