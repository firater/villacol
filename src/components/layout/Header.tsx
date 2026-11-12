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

const FEATURED_IMAGE =
  "https://placehold.co/560x720/d6d3d1/44403c/png?text=+";

const HEADER_COMPACT_SCROLL_Y = 50;
/** Ignore sub-pixel / layout nudges so compact state does not oscillate. */
const HEADER_SCROLL_DIRECTION_MIN_DELTA = 8;

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
  const lastScrollYRef = useRef(0);
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
    const applyScrollCompact = (options?: { initial?: boolean }) => {
      const scrollY = window.scrollY;
      const previousScrollY = lastScrollYRef.current;
      const scrollDelta = scrollY - previousScrollY;
      lastScrollYRef.current = scrollY;
      scrollRafRef.current = null;

      if (scrollY <= HEADER_COMPACT_SCROLL_Y) {
        setIsCompact(false);
        return;
      }

      if (options?.initial === true) {
        setIsCompact(true);
        return;
      }

      if (scrollDelta > HEADER_SCROLL_DIRECTION_MIN_DELTA) {
        setIsCompact(true);
        return;
      }

      if (scrollDelta < -HEADER_SCROLL_DIRECTION_MIN_DELTA) {
        setIsCompact(false);
      }
    };

    const onScroll = () => {
      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = window.requestAnimationFrame(() => applyScrollCompact());
    };

    lastScrollYRef.current = window.scrollY;
    applyScrollCompact({ initial: true });
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
            <Link href="/" className="inline-flex shrink-0 items-baseline gap-0.5">
              <span className="font-serif text-2xl tracking-tight text-orange-600 lg:text-[1.65rem]">.</span>
              <span className="font-serif text-2xl tracking-tight text-neutral-950 lg:text-[1.65rem]">
                {tCommon("brand")}
              </span>
            </Link>

            <Link
              href="/find-villa"
              className="hidden font-serif text-lg font-semibold tracking-wide text-stone-950 hover:text-stone-800 sm:inline-block"
            >
              {t("nav.findVilla")}
            </Link>

            <button
              ref={menuToggleRef}
              type="button"
              className="inline-flex items-center gap-2 border border-stone-900 bg-white px-4 py-2.5 font-serif text-base tracking-wide text-stone-900 hover:bg-stone-50/80"
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

          <div className="ms-auto flex flex-wrap items-center gap-x-6 gap-y-3 lg:gap-x-8">
            <LocaleCurrencyDropdown locale={locale} currency={currency} />

            {notificationsSlot}

            <Link
              href="/contact"
              className="hidden items-center gap-2 px-4 py-2.5 font-serif text-base tracking-wide text-stone-900 transition-colors hover:text-stone-950 xl:inline-flex"
            >
              <ChatIcon className="h-4 w-4 text-stone-700" />
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
          className="absolute left-0 top-full z-50 w-full border-b border-stone-200/80 bg-stone-50 shadow-2xl"
        >
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1.4fr)] lg:gap-16">
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
    <div className="space-y-8">
      <MegaMenuColumnHeading title={t("megaMenu.homeColumn")} />
      <ul className="space-y-5">
        <MegaMenuLink href="/" onClick={onNavigate}>
          {t("nav.home")}
        </MegaMenuLink>
        <MegaMenuLink href="/villas" onClick={onNavigate}>
          {t("megaMenu.realEstate")}
        </MegaMenuLink>
      </ul>
      <div className="border-t border-stone-200/80 pt-6">
        <MegaMenuColumnHeading title={t("megaMenu.moreLinks")} compact />
        <ul className="mt-5 space-y-4">
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
    <div className="space-y-8 border-t border-stone-200/80 pt-10 lg:border-t-0 lg:pt-0">
      <div className="flex items-end justify-between gap-4">
        <MegaMenuColumnHeading title={t("megaMenu.categoriesColumn")} />
        <button
          type="button"
          className="rounded-full px-2 py-1 text-xs font-medium text-neutral-500 lg:hidden"
          aria-expanded={mobileOpen}
          onClick={onToggleMobile}
        >
          {mobileOpen ? "−" : "+"}
        </button>
      </div>
      <ul
        className={`space-y-5 lg:block ${mobileOpen ? "block" : "hidden lg:block"}`}
      >
        <MegaMenuLink href="/villas" onClick={onNavigate} className="text-orange-600">
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
              className="inline-block py-1.5 font-sans text-lg text-neutral-800 transition-[transform,color] hover:translate-x-1 hover:text-orange-500"
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
    <div className="border-t border-stone-200/80 pt-8 lg:border-t-0 lg:pt-0">
      <Link
        href="/villas"
        onClick={onNavigate}
        className="group block overflow-hidden rounded-[2rem] bg-stone-200 shadow-xl ring-1 ring-stone-200/90"
      >
        <div className="relative aspect-[3/4] w-full min-h-[400px]" style={{ aspectRatio: "3 / 4" }}>
          <Image
            src={FEATURED_IMAGE}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 480px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/25 to-transparent" />
          <div className="absolute inset-x-0 top-0 p-8 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-orange-300">
              {t("megaMenu.featuredKicker")}
            </p>
            <p className="mt-3 font-serif text-3xl leading-tight tracking-tight lg:text-4xl">
              {t("megaMenu.featuredEyebrow")}
            </p>
            <p className="mt-2 font-serif text-xl text-stone-100">{t("megaMenu.featuredPlace")}</p>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-8">
            <p className="font-serif text-2xl leading-tight tracking-tight text-white lg:text-3xl">
              {t("megaMenu.featuredTitle")}
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-200">
              {t("megaMenu.featuredBody")}
            </p>
          </div>
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
    <h3
      className={`font-serif tracking-tight text-neutral-900 ${
        compact ? "text-2xl" : "text-3xl lg:text-4xl"
      }`}
    >
      {title}
    </h3>
  );
}

function MegaMenuLink({
  href,
  children,
  onClick,
  subdued,
  className,
}: {
  href: Parameters<typeof Link>[0]["href"];
  children: ReactNode;
  onClick: () => void;
  subdued?: boolean;
  className?: string;
}) {
  const baseLinkClass = subdued
    ? "text-lg font-medium text-neutral-600"
    : "text-lg font-medium text-neutral-900";

  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className={`inline-block py-1.5 transition-[transform,color] hover:translate-x-1 hover:text-orange-500 ${baseLinkClass} ${className ?? ""}`}
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

