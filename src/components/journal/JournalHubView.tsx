import Image from "next/image";

import { Link } from "@/i18n/navigation";
import {
  JOURNAL_ARTICLE_HREFS,
  JOURNAL_ARTICLE_IDS,
  JOURNAL_ARTICLE_IMAGES,
} from "@/lib/journal-content";
import type { JournalHubData } from "@/lib/journal-content";

type Props = {
  copy: JournalHubData;
};

export function JournalHubView({ copy }: Props) {
  return (
    <main className="flex flex-1 flex-col bg-stone-50/90 dark:bg-zinc-950">
      <header className="border-b border-stone-200/80 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-stone-500">
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 max-w-2xl font-serif text-[clamp(2.25rem,5vw,3.25rem)] font-semibold leading-[1.1] tracking-tight text-stone-900 dark:text-zinc-50">
            {copy.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg font-light leading-[1.7] text-stone-600 dark:text-zinc-400">
            {copy.intro}
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <ul className="grid gap-10 sm:grid-cols-2" role="list">
          {JOURNAL_ARTICLE_IDS.map((id) => {
            const card = copy.articles[id];
            const href = JOURNAL_ARTICLE_HREFS[id];
            const image = JOURNAL_ARTICLE_IMAGES[id];
            return (
              <li key={id}>
                <article className="group flex h-full flex-col overflow-hidden border border-stone-200/80 bg-white shadow-sm transition hover:border-stone-300 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <div className="relative aspect-[16/10] overflow-hidden bg-stone-100 dark:bg-zinc-900">
                    <Image
                      src={image}
                      alt={card.imageAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6 sm:p-8">
                    <h2 className="font-serif text-2xl font-medium tracking-tight text-stone-900 dark:text-zinc-50">
                      {card.title}
                    </h2>
                    <p className="mt-3 flex-1 text-sm font-light leading-relaxed text-stone-600 dark:text-zinc-400">
                      {card.excerpt}
                    </p>
                    <Link
                      href={href}
                      className="mt-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-900 hover:underline dark:text-amber-200"
                    >
                      {card.readCta}
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
