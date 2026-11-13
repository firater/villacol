import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { EditorialPageFallback } from "@/components/content/EditorialPageFallback";
import { JournalArticleLayout } from "@/components/journal/JournalArticleLayout";
import {
  loadJournalHub,
  loadJournalArticle,
  type JournalArticleId,
} from "@/lib/journal-content";
import { isLocale, type Locale } from "@/lib/locales";

type PageProps = { params: Promise<{ locale: string }> };

export function createJournalArticlePage(articleId: JournalArticleId) {
  async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale: localeRaw } = await params;
    if (!isLocale(localeRaw)) return {};
    const copy = await loadJournalArticle(articleId, localeRaw);
    return {
      title: copy.metaTitle,
      description: copy.metaDescription,
    };
  }

  function JournalArticlePage({ params }: PageProps): ReactNode {
    return (
      <Suspense fallback={<EditorialPageFallback />}>
        <ArticleContent params={params} />
      </Suspense>
    );
  }

  async function ArticleContent({ params }: PageProps) {
    const { locale: localeRaw } = await params;
    if (!isLocale(localeRaw)) notFound();
    const locale = localeRaw as Locale;
    const [article, hub] = await Promise.all([
      loadJournalArticle(articleId, locale),
      loadJournalHub(locale),
    ]);

    return (
      <JournalArticleLayout
        backLabel={hub.title}
        eyebrow={article.eyebrow}
        title={article.title}
        intro={article.intro}
        heroImage={article.heroImage}
        heroImageAlt={article.heroImageAlt}
        sections={article.sections}
      />
    );
  }

  return { generateMetadata, default: JournalArticlePage };
}
