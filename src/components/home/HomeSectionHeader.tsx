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
      <header className="mb-10 w-full md:mb-12">
        {kicker ? (
          <span className="mb-4 block font-sans text-xs tracking-[0.2em] text-stone-500 uppercase">
            {kicker}
          </span>
        ) : null}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <h2 className="font-serif text-4xl leading-[1.1] font-normal tracking-tight text-stone-900 md:text-5xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-2 font-sans text-sm leading-relaxed text-stone-400">
                {subtitle}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0 sm:pb-0.5">{action}</div> : null}
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
