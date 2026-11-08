import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";

import { LoginForm } from "@/components/auth/LoginForm";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/locales";

export default async function LoginPage() {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }
  const locale = localeRaw as Locale;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <LoginForm locale={locale} />
      <p className="mt-8 text-center text-sm text-zinc-500">
        <Link href="/" className="text-amber-800 hover:underline dark:text-amber-200">
          Back to site
        </Link>
      </p>
    </main>
  );
}
