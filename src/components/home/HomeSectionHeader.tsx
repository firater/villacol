import type { ReactNode } from "react";

type Props = {
  kicker?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function HomeSectionHeader({ kicker, title, subtitle, action }: Props) {
  return (
    <header className="mb-12 max-w-3xl md:mb-16">
      {kicker ? (
        <span className="mb-4 block font-sans text-xs tracking-[0.2em] text-stone-500 uppercase">
          {kicker}
        </span>
      ) : null}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-serif text-4xl leading-[1.1] font-normal tracking-tight text-stone-900 md:text-5xl">
          {title}
        </h2>
        {action}
      </div>
      {subtitle ? (
        <p className="mt-5 max-w-2xl font-sans text-base leading-relaxed text-stone-600 md:text-lg">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
