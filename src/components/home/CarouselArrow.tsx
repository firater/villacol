type Props = {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
  label: string;
};

export function CarouselArrow({ direction, disabled, onClick, label }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-11 items-center justify-center border border-stone-900 text-stone-900 transition hover:bg-stone-900 hover:text-white disabled:pointer-events-none disabled:opacity-25"
    >
      <span className="font-serif text-xl leading-none" aria-hidden>
        {direction === "left" ? "←" : "→"}
      </span>
    </button>
  );
}
