import { createJournalArticlePage } from "@/lib/journal-article-page";

const page = createJournalArticlePage("bestBeaches");

export const generateMetadata = page.generateMetadata;
export default page.default;
