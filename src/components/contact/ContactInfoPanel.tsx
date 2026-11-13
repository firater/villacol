import { Link } from "@/i18n/navigation";
import type { ContactPageCopy } from "@/lib/contact-page-content";

type Props = {
  copy: ContactPageCopy;
};

export function ContactInfoPanel({ copy }: Props) {
  const info = copy.page.info;
  const whatsappUrl = copy.whatsappUrl;

  return (
    <aside className="lg:pt-2">
      <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-stone-400">
        {info.eyebrow}
      </p>
      <p className="mt-5 font-serif text-2xl font-medium leading-snug tracking-tight text-stone-900 dark:text-zinc-50">
        {info.headline}
      </p>
      <p className="mt-4 text-[15px] font-light leading-[1.75] text-stone-600 dark:text-zinc-400">
        {info.body}
      </p>

      <dl className="mt-10 space-y-6 border-t border-stone-200 pt-10 dark:border-zinc-800">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            {info.emailLabel}
          </dt>
          <dd className="mt-2">
            <a
              href={`mailto:${info.emailValue}`}
              className="text-lg font-light text-stone-900 underline-offset-4 hover:underline dark:text-zinc-100"
            >
              {info.emailValue}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            {info.phoneLabel}
          </dt>
          <dd className="mt-2">
            <a
              href={`tel:${info.phoneTel}`}
              className="text-lg font-light tabular-nums text-stone-900 underline-offset-4 hover:underline dark:text-zinc-100"
            >
              {info.phoneDisplay}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            {info.whatsappLabel}
          </dt>
          <dd className="mt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-light text-stone-900 underline-offset-4 hover:underline dark:text-zinc-100"
            >
              {info.whatsappCta}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            {info.hoursLabel}
          </dt>
          <dd className="mt-2 text-[15px] font-light leading-relaxed text-stone-600 dark:text-zinc-400">
            {info.hoursValue}
          </dd>
        </div>
      </dl>

      <p className="mt-10 text-xs font-light leading-relaxed text-stone-500 dark:text-zinc-500">
        {info.footnote}
      </p>

      <Link
        href="/find-villa"
        className="mt-8 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-amber-900 underline-offset-4 hover:underline dark:text-amber-200"
      >
        {info.findVillaCta}
      </Link>
    </aside>
  );
}
