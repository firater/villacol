import {
  CALENDAR_SINGLE_MIN_HEIGHT,
  CALENDAR_TRIPLE_MIN_HEIGHT,
} from "./calendar/calendar-layout";

/**
 * Matches the villa detail grid so the shell does not jump before `getVillaDetailBundle` resolves.
 */
export function VillaDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-12 xl:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-10">
          <div className="space-y-3">
            <div
              className="w-full animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
              style={{ aspectRatio: "16 / 9" }}
            />
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
                  style={{ aspectRatio: "4 / 3" }}
                />
              ))}
            </div>
          </div>
          <div className="min-h-[8rem] space-y-3">
            <div className="h-10 w-4/5 max-w-xl animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-5 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex gap-4">
              <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
          <div className="h-20 w-full max-w-3xl animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />
          <div className="min-h-[6rem] space-y-4">
            <div className="h-7 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-8 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800"
                />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-7 w-44 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-5 w-72 max-w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
            <div
              className={`${CALENDAR_TRIPLE_MIN_HEIGHT} animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900`}
            />
            <div className="h-4 w-80 max-w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
          </div>
        </div>
        <div className="min-h-[32rem]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="h-7 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div
              className={`mt-4 ${CALENDAR_SINGLE_MIN_HEIGHT} animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800`}
            />
            <div className="mt-4 h-4 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="mt-1 h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            <div className="mt-6 min-h-[18rem] rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
              <div className="space-y-3">
                <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-3/5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
