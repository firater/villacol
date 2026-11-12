"use client";

import { useTransition } from "react";

import { setLocalePreference } from "@/actions/public/preferences.actions";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/lib/locales";

import { routing } from "@/i18n/routing";

const LOCALES: readonly Locale[] = routing.locales;

/**
 * `usePathname` from next-intl is typed as every known internal pathname, including
 * dynamic templates. At runtime it is always the concrete path the guest is on.
 */
type StaticPathname =
  | "/"
  | "/villas"
  | "/villa-offers"
  | "/contact"
  | "/about"
  | "/terms"
  | "/privacy";

type Props = {
  label: string;
  /** The active locale from the URL segment, from the server. */
  currentLocale: Locale;
  variant?: "default" | "editorial" | "magazine";
};

/**
 * Writes `villa_locale` via the server action, then navigates to the same
 * pathname in the new locale. Using `Link locale=` alone would change the URL
 * but not persist the cookie, and the proxy would keep steering off Accept-Language.
 */
export function LanguageSwitcher({ label, currentLocale, variant = "default" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  async function choose(nextLocale: Locale) {
    if (nextLocale === currentLocale) return;

    startTransition(async () => {
      await setLocalePreference(nextLocale);
      // `usePathname` from next-intl is already without the locale prefix.
      router.replace(pathname as StaticPathname, { locale: nextLocale });
    });
  }

  if (variant === "editorial" || variant === "magazine") {
  const isMagazine = variant === "magazine";

    return (
      <>
        <span className="sr-only">{label}</span>
        <ul className={isMagazine ? "space-y-1.5" : "space-y-3"} role="list">
          {LOCALES.map((code) => {
            const active = code === currentLocale;
            return (
              <li key={code}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void choose(code)}
                  className={
                    isMagazine
                      ? `flex w-full items-stretch gap-2.5 py-1 text-left font-serif text-lg font-normal tracking-tight uppercase transition-colors ${
                          active ? "text-stone-900" : "text-stone-500 hover:text-orange-600"
                        }`
                      : `flex w-full items-center gap-3 py-1 text-left text-base tracking-wide uppercase ${
                          active ? "font-medium text-orange-600" : "text-neutral-700 hover:text-orange-500"
                        }`
                  }
                  aria-pressed={active}
                  aria-label={`${label}: ${code}`}
                >
                  {isMagazine ? (
                    <span
                      aria-hidden
                      className={`w-px shrink-0 ${active ? "bg-orange-500" : "bg-transparent"}`}
                    />
                  ) : (
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${active ? "bg-orange-500" : "bg-transparent"}`}
                      aria-hidden
                    />
                  )}
                  {code}
                </button>
              </li>
            );
          })}
        </ul>
      </>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="sr-only">{label}</span>
      <div className="flex rounded-md border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
        {LOCALES.map((code) => {
          const active = code === currentLocale;
          return (
            <button
              key={code}
              type="button"
              disabled={pending}
              onClick={() => void choose(code)}
              className={`rounded px-2 py-1 text-xs font-medium uppercase tracking-wide transition-colors ${
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
              aria-pressed={active}
              aria-label={`${label}: ${code}`}
            >
              {code}
            </button>
          );
        })}
      </div>
    </div>
  );
}
