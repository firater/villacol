import type { Locale } from "@/lib/locales";

export const JOURNAL_ARTICLE_IDS = ["bestBeaches", "travelSafety"] as const;

export type JournalArticleId = (typeof JOURNAL_ARTICLE_IDS)[number];

export const JOURNAL_ARTICLE_HREFS: Record<
  JournalArticleId,
  "/journal/best-beaches" | "/journal/travel-safety-guide"
> = {
  bestBeaches: "/journal/best-beaches",
  travelSafety: "/journal/travel-safety-guide",
};

export const JOURNAL_ARTICLE_IMAGES: Record<JournalArticleId, string> = {
  bestBeaches: "/smr2.webp",
  travelSafety: "/smr9.jpg",
};

type Section = { heading: string; body: string };

type HubArticleCard = {
  title: string;
  excerpt: string;
  readCta: string;
  imageAlt: string;
};

type JournalMessages = {
  journal: {
    hub: {
      metaTitle: string;
      metaDescription: string;
      eyebrow: string;
      title: string;
      intro: string;
      articles: Record<JournalArticleId, HubArticleCard>;
    };
    bestBeaches: ArticleBlock;
    travelSafety: ArticleBlock;
  };
};

type ArticleBlock = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  heroImageAlt: string;
  sections: Section[];
};

export async function loadJournalMessages(locale: Locale): Promise<JournalMessages> {
  return (await import(`../../messages/${locale}.json`)).default as JournalMessages;
}

export type JournalHubData = JournalMessages["journal"]["hub"];

export async function loadJournalHub(locale: Locale): Promise<JournalHubData> {
  const messages = await loadJournalMessages(locale);
  return messages.journal.hub;
}

export async function loadJournalArticle(
  articleId: JournalArticleId,
  locale: Locale,
) {
  const messages = await loadJournalMessages(locale);
  const block = messages.journal[articleId];
  return {
    ...block,
    href: JOURNAL_ARTICLE_HREFS[articleId],
    heroImage: JOURNAL_ARTICLE_IMAGES[articleId],
  };
}
