import Image from "next/image";

import { Link } from "@/i18n/navigation";

type Section = {
  heading: string;
  body: string;
};

type Props = {
  backLabel: string;
  eyebrow: string;
  title: string;
  intro: string;
  heroImage: string;
  heroImageAlt: string;
  sections: Section[];
};

export function JournalArticleLayout({
  backLabel,
  eyebrow,
  title,
  intro,
  heroImage,
  heroImageAlt,
  sections,
}: Props) {
  return (
    <main className="flex flex-1 flex-col bg-stone-50 dark:bg-zinc-950">
      <div className="relative aspect-[21/9] w-full max-h-[28rem] overflow-hidden bg-stone-200 dark:bg-zinc-900">
        <Image
          src={heroImage}
          alt={heroImageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/30 via-transparent to-transparent"
        />
      </div>

      <header className="border-b border-stone-200/80 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
          <Link
            href="/journal"
            className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-900/90 hover:underline dark:text-amber-200/90"
          >
            ← {backLabel}
          </Link>
          <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.26em] text-stone-500">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-serif text-[clamp(2.1rem,5vw,3.1rem)] font-semibold leading-[1.08] tracking-tight text-stone-900 dark:text-zinc-50">
            {title}
          </h1>
          <p className="mt-6 text-lg font-light leading-[1.7] text-stone-600 dark:text-zinc-400">
            {intro}
          </p>
        </div>
      </header>

      <article className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:py-16">
        <div className="space-y-12">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-2xl font-medium tracking-tight text-stone-900 dark:text-zinc-100">
                {section.heading}
              </h2>
              <p className="mt-4 text-[15px] font-light leading-[1.8] text-stone-700 dark:text-zinc-300">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
