type MarkProps = {
  className?: string;
};

/** Monochrome marks for dark footer — replace with brand assets in `public/payments/` if needed. */
function VisaMark({ className }: MarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M19.2 1.2h-3l-1.9 12.4h3l1.9-12.4zm8.8 8.1c0-3.1-4.1-3.2-4.1-4.7 0-.4.4-.8 1.2-.8 1 0 1.9.2 2.5.5l.5-2.3c-.7-.3-1.6-.5-2.8-.5-3 0-5 1.6-5 3.9 0 1.7 1.4 2.6 2.5 3.1 1.1.6 1.5.9 1.5 1.5 0 .8-.9 1.1-1.8 1.1-1.5 0-2.4-.4-3.1-.7l-.5 2.4c.7.3 1.9.6 3.3.6 3.2 0 5.2-1.5 5.2-3.9zm11.8 4.4h2.8l-2.7-12.4h-2.6c-.6 0-1 .3-1.2.8l-4.4 11.6h3.2l.6-1.6h4l.3 1.6zm-3.4-4.1 1.6-4.5.9 4.5h-2.5zM9 1.2 6.3 10.6l-.3-1.5C5.2 6.2 2.7 3.2 0 1.6l3.5 12h3.6L18.2 1.2H9z" />
    </svg>
  );
}

function MastercardMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 36 22" fill="none" aria-hidden>
      <circle cx="13" cy="11" r="9" className="fill-current opacity-90" />
      <circle cx="23" cy="11" r="9" className="fill-current opacity-55" />
    </svg>
  );
}

function AmexMark({ className }: MarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M1.5 1.2h4.2l1.1 2.7 1.1-2.7H12v1.4l-1 2.4 1 2.4V1.2h3.3v12.4H13.6l-1.4-3.3-1.4 3.3H5.7L4.3 10.3 2.9 13.6H0V1.2h1.5zm8.5 7.4-1.5-3.6-1.5 3.6h3zm8.2-7.4h5.5c3.2 0 5.3 1.7 5.3 4.5 0 2.9-2.1 4.7-5.4 4.7h-5.4V1.2zm3.3 9.5h1.9c1.6 0 2.5-.9 2.5-2.4 0-1.4-.9-2.3-2.5-2.3h-1.9v4.7zm10.2-9.5h3.4l3.4 8.1V1.2h3v12.4h-3.2l-3.5-8.3v8.3h-3.1V1.2z" />
    </svg>
  );
}

function StripeMark({ className }: MarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 54 22"
      fill="currentColor"
      aria-hidden
    >
      <path d="M53.3 10.9c0-3.5-2.4-4.7-5.2-4.7-1.8 0-3.1.3-4.2.8V4.4c1.3-.6 2.9-.9 4.8-.9 4.7 0 7.9 2.5 7.9 6.9 0 4.4-3 6.6-7.3 6.6-1.5 0-2.6-.3-3.4-.6v-3.1c.9.4 2 .6 3.4.6 2.6 0 4.2-1 4.2-3.4zm-7.8 4.5c-1.9 0-3-.9-3-2.9V8.3h3v5.8c0 1.4.7 2.2 2.1 2.2h-2.1zm-8.7 1.2H32.8V1.1h4.4v15.5zm-11.1 0H22V1.1h3.7v15.5zm-11.3 0H11V1.1h3.7v15.5zM5.6 16.6H0V1.1h5.3c3.5 0 5.8 1.8 5.8 4.9 0 2.2-1.1 3.7-2.9 4.4l3.4 6.2H6.5l-3.1-5.6c-.5.1-1 .1-1.6.1h-.2v5.5zM5 8.2c1.8 0 2.8-.8 2.8-2.2S6.8 3.8 5 3.8H3.3v4.4H5z" />
    </svg>
  );
}

const MARKS = [
  { id: "visa", label: "Visa", Mark: VisaMark, width: "w-[2.75rem]" },
  { id: "mastercard", label: "Mastercard", Mark: MastercardMark, width: "w-[2.25rem]" },
  { id: "amex", label: "American Express", Mark: AmexMark, width: "w-[3rem]" },
  { id: "stripe", label: "Stripe", Mark: StripeMark, width: "w-[3.25rem]" },
] as const;

type Props = {
  /** Visually hidden summary for screen readers (e.g. accepted methods). */
  ariaLabel: string;
};

export function FooterPaymentMarks({ ariaLabel }: Props) {
  return (
    <ul
      className="flex flex-wrap items-center gap-x-6 gap-y-3 text-stone-500"
      aria-label={ariaLabel}
      role="list"
    >
      {MARKS.map(({ id, label, Mark, width }) => (
        <li key={id} className="flex items-center">
          <Mark className={`h-5 ${width} max-w-full`} />
          <span className="sr-only">{label}</span>
        </li>
      ))}
    </ul>
  );
}