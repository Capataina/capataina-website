import type { Article } from "@/types";

import { burnAfinePr } from "./open-source/burn-afine-pr";

export const allArticles: Article[] = [burnAfinePr];

/** Lookup helper used by the article view when reading `?article=<slug>`. */
export function findArticle(slug: string): Article | undefined {
  return allArticles.find((a) => a.slug === slug);
}
