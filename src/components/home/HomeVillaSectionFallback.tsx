type Props = {
  density?: "default" | "promo";
};

/**
 * Mirrors `VillaCarousel` + `VillaCard` box model so streaming rails do not shift layout.
 */
export function HomeVillaSectionFallback({ density = "default" }: Props) {
  const listClass =
    density === "promo"
      ? "no-scrollbar -mx-4 flex gap-8 overflow-hidden px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-1 md:gap-8 md:px-0 lg:grid-cols-2"
      : "no-scrollbar -mx-4 flex gap-8 overflow-hidden px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:gap-8 md:px-0 lg:grid-cols-3";

  const itemClass =
    density === "promo"
      ? "flex shrink-0 basis-[92%] sm:basis-[78%] md:basis-auto md:shrink"
      : "flex shrink-0 basis-[78%] sm:basis-[55%] md:basis-auto md:shrink";

  const cardMinH = density === "promo" ? "min-h-[22rem] sm:min-h-[12rem]" : "";

  return (
    <ul className={listClass} aria-hidden>
      {[1, 2, 3].map((key) => (
        <li key={key} className={itemClass}>
          <div
            className={`w-full overflow-hidden rounded-2xl border border-stone-200/60 bg-stone-50 ${cardMinH} ${density === "promo" ? "sm:flex" : ""}`}
          >
            <div
              className={`animate-pulse bg-zinc-200 ${density === "promo" ? "aspect-[4/3] sm:w-[42%] sm:max-w-[280px]" : "aspect-[4/3]"}`}
              style={{ aspectRatio: "4 / 3" }}
            />
            <div className="space-y-2 p-5">
              <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
              <div className="mt-4 h-20 animate-pulse rounded bg-zinc-50" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
