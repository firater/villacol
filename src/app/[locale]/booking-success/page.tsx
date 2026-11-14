import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { Suspense } from "react";

import { BookingSuccessBody } from "@/components/booking/BookingSuccessBody";
import { BookingSuccessFallback } from "@/components/booking/BookingSuccessFallback";
import { routing } from "@/i18n/routing";

type PageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function BookingSuccessPage({ searchParams }: PageProps) {
  const localeRaw = await localeParam();
  if (!hasLocale(routing.locales, localeRaw)) {
    notFound();
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-20">
      <Suspense fallback={<BookingSuccessFallback />}>
        <BookingSuccessBody searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
