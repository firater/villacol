import { Star } from "lucide-react";

import type { PublishedGuestReviewRow } from "@/db/queries/guest-reviews.queries";
import { INTL_LOCALE_TAGS, type Locale } from "@/lib/locales";

type ReviewCopy = {
  eyebrow: string;
  heading: string;
  empty: string;
  ratingAria: string;
};

type Props = {
  reviews: PublishedGuestReviewRow[];
  locale: Locale;
  formatReviewMeta: (stayRange: string, guestCount: number) => string;
  copy: ReviewCopy;
};

function formatStayRange(
  locale: Locale,
  checkIn: string,
  checkOut: string,
): string {
  const tag = INTL_LOCALE_TAGS[locale];
  const formatter = new Intl.DateTimeFormat(tag, {
    month: "short",
    year: "numeric",
    day: "numeric",
  });
  const start = formatter.format(new Date(`${checkIn}T12:00:00`));
  const end = formatter.format(new Date(`${checkOut}T12:00:00`));
  return `${start} – ${end}`;
}

function StarRating({ rating, ariaLabel }: { rating: number; ariaLabel: string }) {
  const safe = Math.min(5, Math.max(1, Math.round(rating)));

  return (
    <div className="inline-flex items-center gap-0.5" role="img" aria-label={ariaLabel}>
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < safe;
        return (
          <Star
            key={index}
            className={`size-3.5 shrink-0 ${
              filled
                ? "fill-amber-400 text-amber-500"
                : "fill-stone-100 text-stone-300 dark:fill-stone-800 dark:text-stone-600"
            }`}
            strokeWidth={1.5}
            aria-hidden
          />
        );
      })}
    </div>
  );
}

export function VillaGuestReviewsSection({
  reviews,
  locale,
  formatReviewMeta,
  copy,
}: Props) {
  return (
    <section aria-labelledby="guest-reviews-heading" className="space-y-8">
      <div className="max-w-3xl">
        <div
          aria-hidden
          className="mb-6 h-px w-full bg-gradient-to-r from-stone-300/85 via-stone-300/40 to-transparent"
        />
        <p className="mb-3 font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-stone-400">
          {copy.eyebrow}
        </p>
        <h2
          id="guest-reviews-heading"
          className="font-serif text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50"
        >
          {copy.heading}
        </h2>
      </div>

      {reviews.length === 0 ? (
        <p className="max-w-xl font-sans text-sm leading-relaxed text-stone-500 dark:text-stone-400">
          {copy.empty}
        </p>
      ) : (
        <ul className="grid max-w-3xl gap-8">
          {reviews.map((review) => {
            const stayLabel = formatStayRange(
              locale,
              review.stayCheckIn,
              review.stayCheckOut,
            );
            const meta = formatReviewMeta(stayLabel, review.guestCount);

            return (
              <li
                key={review.id}
                className="border border-stone-200/90 bg-white/60 px-6 py-6 dark:border-stone-800 dark:bg-stone-950/40 sm:px-7 sm:py-7"
              >
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-serif text-lg text-stone-900 dark:text-stone-50">
                      {review.guestName}
                    </p>
                    <p className="font-sans text-xs uppercase tracking-[0.18em] text-stone-500">
                      {meta}
                    </p>
                  </div>
                  <StarRating
                    rating={review.rating}
                    ariaLabel={copy.ratingAria.replace(
                      "{rating}",
                      String(review.rating),
                    )}
                  />
                </header>
                <p className="mt-4 font-sans text-sm leading-[1.8] text-stone-700 dark:text-stone-300">
                  {review.reviewText}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
