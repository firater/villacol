"use client";

import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { useRouter } from "@/i18n/navigation";
import { useTypewriterPlaceholder } from "@/hooks/use-typewriter-placeholder";

export function HeaderAiSearch() {
  const t = useTranslations("layout.aiSearch");
  const router = useRouter();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const phrases = useMemo(
    () => [t("placeholderPrimary"), t("placeholderSecondary")],
    [t],
  );

  const [expanded, setExpanded] = useState(false);
  const [inputRevealed, setInputRevealed] = useState(false);
  const [query, setQuery] = useState("");

  const showTypewriter = query.length === 0;
  const animatedPlaceholder = useTypewriterPlaceholder({
    phrases,
    enabled: showTypewriter,
  });

  const hasQuery = query.trim().length > 0;

  const submitSearch = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return;
    router.push({
      pathname: "/villas",
      query: { q: trimmed },
    });
    setInputRevealed(false);
    setExpanded(false);
  }, [query, router]);

  const openDesktop = useCallback(() => {
    setExpanded(true);
    requestAnimationFrame(() => {
      setInputRevealed(true);
      inputRef.current?.focus();
    });
  }, []);

  const closeDesktop = useCallback(() => {
    setInputRevealed(false);
    setExpanded(false);
  }, []);

  useEffect(() => {
    if (!expanded) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") closeDesktop();
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      closeDesktop();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [expanded, closeDesktop]);

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitSearch();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeDesktop();
    }
  };

  return (
    <>
      {/* Desktop ghost search */}
      <div ref={rootRef} className="relative hidden items-center lg:flex">
        {expanded ? (
          <div className="flex h-11 w-[min(18rem,28vw)] items-stretch border border-stone-200/90 bg-white/95 dark:border-stone-700 dark:bg-stone-950/90">
            <div
              className={`relative min-w-0 flex-1 transition-opacity duration-200 ease-out ${
                inputRevealed ? "opacity-100" : "opacity-0"
              }`}
            >
              <input
                ref={inputRef}
                id={inputId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                autoComplete="off"
                aria-label={t("ariaLabel")}
                className="h-11 w-full bg-transparent pl-3.5 pr-1 text-sm text-stone-900 outline-none placeholder:text-transparent dark:text-stone-100"
              />
              {showTypewriter ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center truncate text-sm text-stone-400"
                >
                  {animatedPlaceholder}
                  <span className="ml-px inline-block h-4 w-px animate-pulse bg-stone-300" />
                </span>
              ) : null}
            </div>

            <SearchTriggerButton
              active={hasQuery}
              showAiBadge={!hasQuery}
              aiBadge={t("aiBadge")}
              ariaLabel={t("ariaLabel")}
              onClick={() => {
                if (hasQuery) {
                  submitSearch();
                  return;
                }
                inputRef.current?.focus();
              }}
              className="shrink-0"
            />
          </div>
        ) : (
          <SearchTriggerButton
            active={hasQuery}
            showAiBadge={!hasQuery}
            aiBadge={t("aiBadge")}
            ariaLabel={t("ariaLabel")}
            onClick={openDesktop}
          />
        )}
      </div>

      {/* Mobile — always visible */}
      <div className="relative w-full min-w-0 lg:hidden">
        <MobileHeaderSearch
          inputId={`${inputId}-mobile`}
          query={query}
          onQueryChange={setQuery}
          onSubmit={submitSearch}
          placeholderText={showTypewriter ? animatedPlaceholder : t("placeholderPrimary")}
          showTypewriter={showTypewriter}
          ariaLabel={t("ariaLabel")}
          aiBadge={t("aiBadge")}
          hasQuery={hasQuery}
        />
      </div>
    </>
  );
}

function MobileHeaderSearch({
  inputId,
  query,
  onQueryChange,
  onSubmit,
  placeholderText,
  showTypewriter,
  ariaLabel,
  aiBadge,
  hasQuery,
}: {
  inputId: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  placeholderText: string;
  showTypewriter: boolean;
  ariaLabel: string;
  aiBadge: string;
  hasQuery: boolean;
}) {
  return (
    <div className="flex h-11 w-full min-w-0 items-stretch border border-stone-200/90 bg-white/95 dark:border-stone-700 dark:bg-stone-950/90">
      <div className="relative min-w-0 flex-1">
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit();
            }
          }}
          autoComplete="off"
          aria-label={ariaLabel}
          className="h-11 w-full bg-transparent pl-3 pr-2 text-sm text-stone-900 outline-none placeholder:text-transparent dark:text-stone-100"
        />
        {showTypewriter ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-3 flex max-w-[calc(100%-0.5rem)] items-center truncate text-sm text-stone-400"
          >
            {placeholderText}
            <span className="ml-px inline-block h-4 w-px animate-pulse bg-stone-300" />
          </span>
        ) : null}
      </div>
      <SearchTriggerButton
        active={hasQuery}
        showAiBadge={!hasQuery}
        aiBadge={aiBadge}
        ariaLabel={ariaLabel}
        onClick={() => {
          if (hasQuery) onSubmit();
        }}
        className="shrink-0"
      />
    </div>
  );
}

function SearchTriggerButton({
  active,
  showAiBadge,
  aiBadge,
  ariaLabel,
  onClick,
  className = "",
}: {
  active: boolean;
  showAiBadge: boolean;
  aiBadge: string;
  ariaLabel: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-visible transition-colors duration-200 ${className} ${
        active
          ? "bg-orange-600 text-white hover:bg-orange-700"
          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
      }`}
    >
      <SearchIcon className="h-4 w-4" filled={active} />
      {showAiBadge ? (
        <span className="absolute -right-0.5 -top-0.5 rounded bg-stone-900 px-1 py-px text-[8px] font-semibold uppercase tracking-wide text-white">
          {aiBadge}
        </span>
      ) : null}
    </button>
  );
}

function SearchIcon({
  className,
  filled,
}: {
  className?: string;
  filled?: boolean;
}) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M10.5 3a7.5 7.5 0 015.92 12.16l4.35 4.35-1.41 1.41-4.35-4.35A7.5 7.5 0 1110.5 3zm0 2a5.5 5.5 0 100 11 5.5 5.5 0 000-11z" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}
