"use client";

import { memo, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Article } from "@/types";
import { ArticlesList } from "./ArticlesList";
import { ArticleView } from "./ArticleView";

interface ArticlesPanelProps {
  /** All published articles. Sorted by date descending inside the panel. */
  articles: Article[];
  /** Selected article slug, or null for the list view. */
  selectedSlug: string | null;
  /** Caller updates the slug — the panel itself is stateless about which
   *  article is open so the parent can sync `?article=` URL state. */
  onSelect: (slug: string | null) => void;
  /** Called when the user wants to exit articles entirely (close X). */
  onClose: () => void;
}

const viewVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const viewTransition = { duration: 0.2, ease: "easeOut" as const };

export const ArticlesPanel = memo(function ArticlesPanel({
  articles,
  selectedSlug,
  onSelect,
  onClose,
}: ArticlesPanelProps) {
  const sortedArticles = useMemo(
    () => [...articles].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [articles]
  );

  const selectedArticle = useMemo(
    () =>
      selectedSlug
        ? sortedArticles.find((a) => a.slug === selectedSlug) ?? null
        : null,
    [sortedArticles, selectedSlug]
  );

  const handleBack = useCallback(() => onSelect(null), [onSelect]);
  const handleSelect = useCallback(
    (slug: string) => onSelect(slug),
    [onSelect]
  );

  return (
    <div className="relative h-full w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {selectedArticle ? (
          <motion.div
            key={`article-${selectedArticle.slug}`}
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={viewTransition}
            className="absolute inset-0"
          >
            <ArticleView
              article={selectedArticle}
              onBack={handleBack}
              onClose={onClose}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={viewTransition}
            className="absolute inset-0"
          >
            <ArticlesList
              articles={sortedArticles}
              onSelect={handleSelect}
              onClose={onClose}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
