/** Fixed-size decorative tone behind hero copy — kept minimal. */
export function HomeHeroBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[24rem] bg-stone-50/80"
      aria-hidden
    />
  );
}
