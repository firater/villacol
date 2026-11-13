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
                ? "fill-stone-900 text-stone-900 dark:fill-stone-100 dark:text-stone-100"
                : "fill-stone-200 text-stone-300 dark:fill-stone-800 dark:text-stone-600"
            }`}
            strokeWidth={1.25}
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
      <header className="max-w-3xl">
        <div aria-hidden className="mb-6 h-px w-full bg-stone-300/80" />
        <p className="mb-3 font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-stone-500">
          {copy.eyebrow}
        </p>
        <h2
          id="guest-reviews-heading"
          className="font-serif text-[clamp(1.65rem,3vw,2.1rem)] font-semibold tracking-tight text-stone-900 dark:text-stone-50"
        >
          {copy.heading}
        </h2>
      </header>

      {reviews.length === 0 ? (
        <div className="max-w-xl border border-stone-300/90 bg-stone-50/60 px-6 py-8 dark:border-stone-700 dark:bg-stone-950/40">
          <p className="font-serif text-lg text-stone-700 dark:text-stone-300">
            {copy.empty}
          </p>
        </div>
      ) : (
        <ul className="grid max-w-3xl gap-6">
          {reviews.map((review, index) => {
            const stayLabel = formatStayRange(
              locale,
              review.stayCheckIn,
              review.stayCheckOut,
            );
            const meta = formatReviewMeta(stayLabel, review.guestCount);

            return (
              <li
                key={review.id}
                className="border border-stone-300/90 bg-white px-6 py-7 dark:border-stone-700 dark:bg-stone-950/50 sm:px-8 sm:py-8"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-stone-200 pb-4 dark:border-stone-800">
                  <div>
                    <p className="font-serif text-xl text-stone-900 dark:text-stone-50">
                      {review.guestName}
                    </p>
                    <p className="mt-1 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-stone-500">
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
                </div>
                <p className="mt-5 font-sans text-[15px] leading-[1.85] text-stone-700 dark:text-stone-300">
                  {review.reviewText}
                </p>
                <p
                  className="sr-only"
                >{`Review ${index + 1} of ${reviews.length}`}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
