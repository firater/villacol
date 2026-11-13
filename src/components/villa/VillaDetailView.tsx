import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { JsonLd } from "@/components/seo/JsonLd";
import { getExchangeRates } from "@/db/queries/rates.queries";
import { getPublishedGuestReviewsForVilla } from "@/db/queries/guest-reviews.queries";
import { getVillaPublicCalendarSnapshot } from "@/db/queries/public.calendar.queries";
import { getVillaDetailBundle } from "@/db/queries/villas.queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/locales";
import { generateVillaJsonLd } from "@/lib/seo/json-ld";
import { absoluteLocalizedUrl } from "@/lib/seo/urls";
import { resolvePreferences } from "@/lib/preferences";
import { buildExchangeRateMap } from "@/lib/villa-listing-cards";

import { CalendarProvider } from "./calendar/CalendarContext";
import { VillaCalendar } from "./calendar/VillaCalendar";
import { VillaCalendarLegend } from "./calendar/VillaCalendarLegend";
import { VillaDetailGallery } from "./VillaDetailGallery";
import { VillaEditorScore } from "./VillaEditorScore";
import { VillaGuestReviewsSection } from "./VillaGuestReviewsSection";
import { VillaPricingSidebar } from "./VillaPricingSidebar";
import { VillaStayPoliciesSection } from "./VillaStayPoliciesSection";

type Props = {
  villaId: number;
  locale: Locale;
};

export async function VillaDetailView({ villaId, locale }: Props) {
  const [bundle, calendarSnapshot, guestReviews, preferences, ratesRows, t, tCard, common] =
    await Promise.all([
      getVillaDetailBundle(villaId, locale),
      getVillaPublicCalendarSnapshot(villaId),
      getPublishedGuestReviewsForVilla(villaId),
      resolvePreferences(),
      getExchangeRates(),
      getTranslations("villaDetail"),
      getTranslations("layout.villaCard"),
      getTranslations("common"),
    ]);

  if (bundle === null || calendarSnapshot === null) {
    notFound();
  }

  const { villa, images, amenities } = bundle;

  const sortedAmenities = [...amenities].sort((a, b) => {
    if (a.isHighlighted !== b.isHighlighted) return a.isHighlighted ? -1 : 1;
    return a.label.localeCompare(b.label, locale);
  });

  const pageUrl = absoluteLocalizedUrl(locale, {
    pathname: "/villas/[slug]",
    params: { slug: villa.slug },
  });
  const villaJsonLd = generateVillaJsonLd(
    { ...bundle, pageUrl },
    locale,
    bundle.priceCache,
    preferences.currency,
    buildExchangeRateMap(ratesRows),
  );

  return (
    <>
      <JsonLd data={villaJsonLd} />
      <CalendarProvider
      villaId={villa.id}
      villaSlug={villa.slug}
      capacity={villa.capacity}
      snapshot={calendarSnapshot}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-12 xl:grid-cols-[1fr_24rem]">
          <div className="min-w-0 space-y-10">
            <VillaDetailGallery title={villa.title} images={images} />

            <header className="min-h-[8rem] space-y-4">
              <h1 className="max-w-3xl font-serif text-[clamp(2rem,4.5vw,2.75rem)] font-semibold leading-[1.05] tracking-tight text-stone-900 dark:text-stone-50">
                {villa.title}
              </h1>
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="space-y-2">
                  {villa.locationName !== null && villa.locationSlug !== null ? (
                    <p className="font-sans text-base text-stone-600 dark:text-stone-400">
                      <Link
                        href={{
                          pathname: "/locations/[slug]",
                          params: { slug: villa.locationSlug },
                        }}
                        className="hover:text-stone-900 hover:underline dark:hover:text-stone-200"
                      >
                        {villa.locationName}
                      </Link>
                    </p>
                  ) : villa.locationName !== null ? (
                    <p className="font-sans text-base text-stone-600 dark:text-stone-400">
                      {villa.locationName}
                    </p>
                  ) : null}
                </div>
                {villa.editorRating !== null ? (
                  <VillaEditorScore
                    rating={villa.editorRating}
                    label={tCard("editorScoreLabel")}
                  />
                ) : null}
              </div>
              <dl className="flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm text-stone-700 dark:text-stone-300">
                <div>
                  <dt className="sr-only">{t("capacity")}</dt>
                  <dd>{common("guestCount", { count: villa.capacity })}</dd>
                </div>
                <div>
                  <dt className="sr-only">{t("bedrooms")}</dt>
                  <dd>{common("bedroomCount", { count: villa.bedrooms })}</dd>
                </div>
                <div>
                  <dt className="sr-only">{t("bathrooms")}</dt>
                  <dd>{common("bathroomCount", { count: villa.bathrooms })}</dd>
                </div>
              </dl>
            </header>

            {villa.summary ? (
              <p className="max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                {villa.summary}
              </p>
            ) : null}

            {villa.description ? (
              <div className="max-w-3xl font-sans text-sm leading-[1.85] text-stone-700 dark:text-stone-300">
                {villa.description.split("\n").map((paragraph, index) =>
                  paragraph.trim() === "" ? null : (
                    <p key={index} className={index > 0 ? "mt-4" : undefined}>
                      {paragraph}
                    </p>
                  ),
                )}
              </div>
            ) : null}

            <VillaStayPoliciesSection
              guestPolicy={villa.guestPolicy}
              cancellationPolicy={villa.cancellationPolicy}
              copy={{
                eyebrow: t("policies.eyebrow"),
                heading: t("policies.heading"),
                guestPolicyTitle: t("policies.guestPolicyTitle"),
                cancellationTitle: t("policies.cancellationTitle"),
                cancellationEmpty: t("policies.cancellationEmpty"),
                guestPolicy: {
                  everyone: t("policies.guestPolicyEveryone"),
                  couples_only: t("policies.guestPolicyCouplesOnly"),
                  families_only: t("policies.guestPolicyFamiliesOnly"),
                  no_friend_groups: t("policies.guestPolicyNoFriendGroups"),
                },
              }}
            />

            <section aria-labelledby="amenities-heading" className="min-h-[6rem]">
              <h2
                id="amenities-heading"
                className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-50"
              >
                {t("amenitiesHeading")}
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {sortedAmenities.map((a) => (
                  <li key={a.id}>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm ${
                        a.isHighlighted
                          ? "bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
                          : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      {a.label}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="availability-heading" className="space-y-4">
              <h2
                id="availability-heading"
                className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-50"
              >
                {t("calendarHeading")}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("calendarHint")}
              </p>
              <VillaCalendar
                numberOfMonths={3}
                className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/40"
              />
              <VillaCalendarLegend />
            </section>

            <VillaGuestReviewsSection
              reviews={guestReviews}
              locale={locale}
              formatReviewMeta={(stay, guests) =>
                t("reviews.meta", { stay, guests })
              }
              copy={{
                eyebrow: t("reviews.eyebrow"),
                heading: t("reviews.heading"),
                empty: t("reviews.empty"),
                ratingAria: t("reviews.ratingAria"),
              }}
            />
          </div>

          <div className="min-h-[32rem] lg:min-h-0">
            <div className="lg:sticky lg:top-24">
              <VillaPricingSidebar />
            </div>
          </div>
        </div>
      </div>
    </CalendarProvider>
    </>
  );
}
