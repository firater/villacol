"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { FilterFacetOption } from "@/db/queries/filter-facets.queries";
import { Link } from "@/i18n/navigation";
import type { Currency, Locale } from "@/lib/locales";

import { LocaleCurrencyDropdown } from "./LocaleCurrencyDropdown";

const MEGA_MENU_FEATURED_IMAGES = ["/smr2.webp", "/smr3.jpg", "/smr4.webp"] as const;

/** Expanded navbar when scroll is above this. */
const HEADER_EXPAND_SCROLL_Y = 20;
/** Compact navbar when scroll is below this. Between the two: keep current state. */
const HEADER_COMPACT_SCROLL_Y = 100;

type Props = {
  locale: Locale;
  currency: Currency;
  categories: FilterFacetOption[];
  notificationsSlot: ReactNode;
};

export function Header({ locale, currency, categories, notificationsSlot }: Props) {
  const t = useTranslations("layout");
  const tCommon = useTranslations("common");
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(true);
  const menuRef = useRef<HTMLElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const scrollRafRef = useRef<number | null>(null);
  const [isCompact, setIsCompact] = useState(false);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuOpen((open) => !open);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      setMobileCategoriesOpen(true);
    }
  }, [menuOpen]);

  useEffect(() => {
    const applyScrollCompact = () => {
      const scrollY = window.scrollY;
      scrollRafRef.current = null;

      if (scrollY > HEADER_COMPACT_SCROLL_Y) {
        setIsCompact(true);
        return;
      }

      if (scrollY < HEADER_EXPAND_SCROLL_Y) {
        setIsCompact(false);
      }
    };

    const onScroll = () => {
      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = window.requestAnimationFrame(() => applyScrollCompact());
    };

    applyScrollCompact();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target)) return;
      if (menuToggleRef.current?.contains(target)) return;
      closeMenu();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [menuOpen, closeMenu]);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isCompact
          ? "bg-white/95 backdrop-blur-md"
          : "bg-white/95 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 transition-all duration-300 sm:px-6 lg:px-8">
        <div
          className={`flex flex-wrap items-center gap-y-4 border-b border-stone-200/90 transition-all duration-300 ${
            isCompact ? "py-3 lg:py-4" : "py-6 lg:py-8"
          }`}
        >
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:gap-x-8 lg:gap-x-10">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-x-12 lg:gap-x-16">
              <Link href="/" className="inline-flex shrink-0 items-baseline gap-0.5">
                <span className="font-serif text-2xl tracking-tight text-orange-600 lg:text-[1.65rem]">.</span>
                <span className="font-serif text-2xl tracking-tight text-neutral-950 lg:text-[1.65rem]">
                  {tCommon("brand")}
                </span>
              </Link>

              <Link
                href="/find-villa"
                className="hidden font-serif text-lg font-semibold tracking-wide text-stone-950 transition-colors hover:text-orange-600 sm:inline-block"
              >
                {t("nav.findVilla")}
              </Link>
            </div>

            <button
              ref={menuToggleRef}
              type="button"
              className="inline-flex items-center gap-2 bg-white px-4 py-2.5 font-serif text-base tracking-wide text-stone-900 transition-colors hover:bg-stone-50/80 hover:text-stone-950"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={toggleMenu}
            >
              {menuOpen ? (
                <CloseMenuIcon className="h-4 w-4 text-stone-700" />
              ) : (
                <HamburgerIcon className="h-4 w-4 text-stone-700" />
              )}
              <span>{t("megaMenu.label")}</span>
            </button>
          </div>

          <div className="ms-auto flex flex-wrap items-center gap-x-3 gap-y-3 lg:gap-x-4">
            <LocaleCurrencyDropdown locale={locale} currency={currency} />

            {notificationsSlot}

            <Link
              href="/contact"
              className="hidden items-center gap-2 px-4 py-2.5 font-serif text-base tracking-wide text-stone-950 transition-colors hover:text-orange-600 xl:inline-flex"
            >
              <ChatIcon className="h-4 w-4" />
              {t("nav.contact")}
            </Link>
          </div>
        </div>
      </div>

      {menuOpen ? (
        <nav
          ref={menuRef}
          id={menuId}
          aria-label={t("nav.ariaMain")}
          className="absolute left-0 top-full z-50 -mt-0.5 w-full border-b border-stone-200/90 bg-white text-stone-800 shadow-2xl"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-stone-300/50 to-transparent"
          />
          <div className="mx-auto max-w-7xl px-4 pb-6 pt-12 sm:px-6 lg:px-8 lg:pb-7 lg:pt-[calc(1.75rem+24px)]">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)_minmax(0,1.05fr)] lg:gap-10 xl:gap-12">
              <MegaMenuHomeColumn onNavigate={closeMenu} />
              <MegaMenuCategoriesColumn
                categories={categories}
                onNavigate={closeMenu}
                mobileOpen={mobileCategoriesOpen}
                onToggleMobile={() => setMobileCategoriesOpen((open) => !open)}
              />
              <MegaMenuFeaturedColumn onNavigate={closeMenu} />
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

function MegaMenuHomeColumn({ onNavigate }: { onNavigate: () => void }) {
  const t = useTranslations("layout");

  return (
    <div className="space-y-5">
      <MegaMenuColumnHeading title={t("megaMenu.homeColumn")} />
      <ul className="space-y-2.5">
        <MegaMenuLink href="/" onClick={onNavigate}>
          {t("nav.home")}
        </MegaMenuLink>
        <MegaMenuLink href="/villas" onClick={onNavigate}>
          {t("megaMenu.realEstate")}
        </MegaMenuLink>
      </ul>
      <div className="pt-5">
        <MegaMenuColumnHeading title={t("megaMenu.moreLinks")} compact />
        <ul className="mt-3 space-y-2">
          <MegaMenuLink href="/villa-offers" onClick={onNavigate} subdued>
            {t("nav.offers")}
          </MegaMenuLink>
          <MegaMenuLink href="/find-villa" onClick={onNavigate} subdued>
            {t("nav.findVilla")}
          </MegaMenuLink>
          <MegaMenuLink href="/about" onClick={onNavigate} subdued>
            {t("nav.about")}
          </MegaMenuLink>
          <MegaMenuLink href="/contact" onClick={onNavigate} subdued className="lg:hidden">
            {t("nav.contact")}
          </MegaMenuLink>
        </ul>
      </div>
    </div>
  );
}

function MegaMenuCategoriesColumn({
  categories,
  onNavigate,
  mobileOpen,
  onToggleMobile,
}: {
  categories: FilterFacetOption[];
  onNavigate: () => void;
  mobileOpen: boolean;
  onToggleMobile: () => void;
}) {
  const t = useTranslations("layout");

  return (
    <div className="space-y-5 pt-2 lg:pt-0">
      <div className="flex items-end justify-between gap-4">
        <MegaMenuColumnHeading title={t("megaMenu.categoriesColumn")} />
        <button
          type="button"
          className="px-1 py-0.5 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400 lg:hidden"
          aria-expanded={mobileOpen}
          onClick={onToggleMobile}
        >
          {mobileOpen ? "−" : "+"}
        </button>
      </div>
      <ul
        className={`space-y-2 lg:block ${mobileOpen ? "block" : "hidden lg:block"}`}
      >
        <MegaMenuLink href="/villas" onClick={onNavigate} accent>
          {t("megaMenu.allCategories")}
        </MegaMenuLink>
        {categories.map((category) => (
          <li key={category.value}>
            <Link
              href={{
                pathname: "/villas",
                query: { category: category.value },
              }}
              onClick={onNavigate}
              className="inline-block py-0.5 font-serif text-xl leading-snug text-stone-600 transition-colors hover:text-orange-600"
            >
              {category.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MegaMenuFeaturedColumn({ onNavigate }: { onNavigate: () => void }) {
  const t = useTranslations("layout");

  return (
    <div className="pt-2 lg:pt-0">
      <Link
        href="/villas"
        onClick={onNavigate}
        className="group block overflow-hidden border border-stone-200/90 bg-white"
      >
        <div className="relative aspect-[5/4] w-full min-h-[9.5rem] overflow-hidden sm:min-h-[10.5rem] lg:min-h-[11rem]">
          <div className="absolute inset-0 grid grid-cols-3 gap-px bg-stone-200/90">
            {MEGA_MENU_FEATURED_IMAGES.map((src) => (
              <div key={src} className="relative overflow-hidden bg-stone-100">
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover transition duration-500 will-change-transform group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 33vw, 120px"
                />
              </div>
            ))}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-20 bg-gradient-to-t from-white via-white/70 to-transparent sm:h-24"
          />
        </div>
        <div className="bg-white px-4 py-3 sm:px-5 sm:py-4">
          <p className="font-serif text-[1.35rem] leading-snug tracking-tight text-stone-900">
            {t("megaMenu.featuredTitle")}
          </p>
          <p className="mt-1.5 line-clamp-2 text-[0.9375rem] leading-relaxed text-stone-600">
            {t("megaMenu.featuredBody")}
          </p>
          <p className="mt-2 font-serif text-lg italic text-stone-500">{t("megaMenu.featuredPlace")}</p>
        </div>
      </Link>
    </div>
  );
}

function MegaMenuColumnHeading({
  title,
  compact,
}: {
  title: string;
  compact?: boolean;
}) {
  return (
    <div>
      <h3
        className={`font-serif font-normal tracking-[-0.02em] text-stone-900 ${
          compact ? "text-xl" : "text-2xl lg:text-[2.125rem]"
        }`}
      >
        {title}
      </h3>
      <div
        aria-hidden
        className={`bg-gradient-to-r from-stone-300/80 to-transparent ${compact ? "mt-2 h-px w-7" : "mt-2.5 h-px w-9"}`}
      />
    </div>
  );
}

function MegaMenuLink({
  href,
  children,
  onClick,
  subdued,
  accent,
  className,
}: {
  href: Parameters<typeof Link>[0]["href"];
  children: ReactNode;
  onClick: () => void;
  subdued?: boolean;
  accent?: boolean;
  className?: string;
}) {
  const baseLinkClass = accent
    ? "text-xl text-orange-600"
    : subdued
      ? "text-lg text-stone-500"
      : "text-xl text-stone-800";

  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className={`inline-block py-0.5 font-serif transition-colors hover:text-orange-600 ${baseLinkClass} ${className ?? ""}`}
      >
        {children}
      </Link>
    </li>
  );
}

function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z" />
    </svg>
  );
}

function CloseMenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M7 9h10M7 13h6M21 12c0 4.4-4 8-9 8-1 0-2-.2-3-.5L3 21l1.5-4.5C3.5 15 3 13.5 3 12c0-4.4 4-8 9-8s9 3.6 9 8Z" />
    </svg>
  );
}

