type Section = {
  heading: string;
  body: string;
};

type Props = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Section[];
  updatedLabel?: string;
};

/**
 * Magazine-style shell for legal and company pages — serif display, airy sans body.
 */
export function EditorialStaticPage({
  eyebrow,
  title,
  intro,
  sections,
  updatedLabel,
}: Props) {
  return (
    <main className="flex flex-1 flex-col bg-stone-50/90 dark:bg-zinc-950">
      <header className="border-b border-stone-200/80 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-stone-500 dark:text-zinc-500">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-serif text-[clamp(2.25rem,5vw,3.25rem)] font-semibold leading-[1.1] tracking-tight text-stone-900 dark:text-zinc-50">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-light leading-[1.7] text-stone-600 dark:text-zinc-400">
            {intro}
          </p>
          {updatedLabel ? (
            <p className="mt-4 text-xs font-light uppercase tracking-[0.14em] text-stone-400 dark:text-zinc-500">
              {updatedLabel}
            </p>
          ) : null}
        </div>
      </header>

      <article className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:py-16">
        <div className="space-y-12">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-2xl font-medium tracking-tight text-stone-900 dark:text-zinc-100">
                {section.heading}
              </h2>
              <p className="mt-4 text-[15px] font-light leading-[1.75] text-stone-700 dark:text-zinc-300">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
