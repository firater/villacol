import type { ReactNode } from "react";

type Props = {
  /** One entry per card; keys come from the caller. */
  items: { key: string; node: ReactNode }[];
  /** Announced to assistive tech, since the rail is a list of villas. */
  label: string;
  /** Wider snap cards for horizontal promo rows. */
  density?: "default" | "promo";
};

/**
 * One DOM tree, two layouts: a scroll-snap rail on phones and a plain grid from
 * `md` up. Snapping and momentum are native CSS, so there is no carousel
 * library, no measurement pass, and nothing that can resize after hydration.
 *
 * Mobile card width is set in percentages (`basis-[78%]`) so the next card
 * always peeks in from the right edge, which is what tells a visitor the rail
 * scrolls without needing arrows.
 */
export function VillaCarousel({ items, label, density = "default" }: Props) {
  const itemClass =
    density === "promo"
      ? "flex shrink-0 basis-[92%] snap-start sm:basis-[78%] md:basis-auto md:shrink"
      : "flex shrink-0 basis-[78%] snap-start sm:basis-[55%] md:basis-auto md:shrink";

  const listClass =
    density === "promo"
      ? "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-1 md:gap-8 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-2"
      : "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:gap-8 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3";

  return (
    <ul aria-label={label} className={listClass}>
      {items.map((item) => (
        <li key={item.key} className={itemClass}>
          <div className="w-full">{item.node}</div>
        </li>
      ))}
    </ul>
  );
}
