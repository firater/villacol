import { createJournalArticlePage } from "@/lib/journal-article-page";

const page = createJournalArticlePage("travelSafety");

export const generateMetadata = page.generateMetadata;
export default page.default;
