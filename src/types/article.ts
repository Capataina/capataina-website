/** Editorial format of an article. Drives the type chip in the list view
 *  and the type-filter toolbar. */
export type ArticleType =
  | "Article"
  | "Dev Log"
  | "Case Study"
  | "White Paper"
  | "Post-Mortem"
  | "Tutorial";

export const ARTICLE_TYPES: ArticleType[] = [
  "Article",
  "Dev Log",
  "Case Study",
  "White Paper",
  "Post-Mortem",
  "Tutorial",
];

export interface Article {
  /** URL-safe identifier; appears in `?article=<slug>`. Keep it stable —
   *  it's the shareable anchor. */
  slug: string;
  /** Headline shown in the list and as the article's `h1`. */
  title: string;
  /** Editorial format. Article = default catch-all. */
  type: ArticleType;
  /** ISO date (YYYY-MM-DD) used for sorting and display. */
  date: string;
  /** Optional project tag — links the article to one of the catalogued
   *  projects. */
  project?: string;
  /** One-line summary used in the list view. */
  description: string;
  /** Optional free-form tags shown as chips on the list card. */
  tags?: string[];
  /** Markdown body. Plain string; rendered through react-markdown +
   *  remark-gfm. */
  body: string;
}
