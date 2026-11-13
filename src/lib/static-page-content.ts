import type { Locale } from "@/lib/locales";

type StaticPageNamespace = "about" | "privacy" | "terms";

type Section = {
  heading: string;
  body: string;
};

type StaticPageBlock = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  updatedLabel?: string;
  sections: Section[];
};

type MessagesFile = {
  staticPages: Record<StaticPageNamespace, StaticPageBlock>;
};

/** Locale JSON only — safe for static prerender (no request-bound i18n). */
export async function loadEditorialStaticPage(
  namespace: StaticPageNamespace,
  locale: Locale,
) {
  const messages = (await import(`../../messages/${locale}.json`))
    .default as MessagesFile;
  const block = messages.staticPages[namespace];

  return {
    metaTitle: block.metaTitle,
    metaDescription: block.metaDescription,
    eyebrow: block.eyebrow,
    title: block.title,
    intro: block.intro,
    updatedLabel: namespace === "about" ? undefined : block.updatedLabel,
    sections: block.sections,
  };
}

export type { StaticPageNamespace };
