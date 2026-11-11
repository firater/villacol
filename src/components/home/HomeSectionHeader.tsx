import type { ReactNode } from "react";

type Props = {
  kicker?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Title/subtitle left, action far right — used for promotions. */
  layout?: "default" | "split";
};

export function HomeSectionHeader({
  kicker,
  title,
  subtitle,
  action,
  layout = "default",
}: Props) {
  if (layout === "split") {
    return (
      <header className="mb-12 w-full lg:mb-16">
        {kicker ? (
          <span className="mb-5 block font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-stone-400">
            {kicker}
          </span>
        ) : null}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between lg:gap-16">
          <div className="min-w-0 max-w-2xl">
            <h2 className="font-serif text-[clamp(2.75rem,6.5vw,4.25rem)] font-normal leading-[0.95] tracking-[-0.02em] text-stone-900">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-5 max-w-md font-sans text-[15px] leading-[1.65] text-stone-600">
                {subtitle}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0 lg:pb-1">{action}</div> : null}
        </div>
      </header>
    );
  }

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
