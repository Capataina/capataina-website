"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "motion/react";
import { ArrowLeft, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import type { Article } from "@/types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { TableOfContents } from "./TableOfContents";
import { extractHeadings } from "./extract-headings";

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
  onClose: () => void;
}

const TOC_OPEN_PX = 256; // matches lg:w-64 — the TOC's open width
const TOC_CLOSED_PX = 0;

export const ArticleView = memo(function ArticleView({
  article,
  onBack,
  onClose,
}: ArticleViewProps) {
  // The scroll root has to be a real DOM node before the TOC can attach
  // its IntersectionObserver. We feed it a state-tracked ref so the TOC
  // re-runs its effect once the node is mounted.
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);
  const [isTocOpen, setIsTocOpen] = useState(true);
  const articleRef = useRef<HTMLElement | null>(null);

  const headings = useMemo(() => extractHeadings(article.body), [article.body]);

  // Reset scroll position whenever the article changes — switching from
  // one article to another shouldn't preserve the prior scroll offset.
  useEffect(() => {
    if (scrollRoot) scrollRoot.scrollTop = 0;
  }, [article.slug, scrollRoot]);

  // Set the per-child cascade index before paint so the staggered
  // fade-in animation runs in document order. The `key={article.slug}` on
  // the article element ensures children are fresh on article change, so
  // the animation re-fires on every navigation.
  useLayoutEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    const children = el.children;
    for (let i = 0; i < children.length; i++) {
      (children[i] as HTMLElement).style.setProperty(
        "--cascade-index",
        String(i)
      );
    }
  }, [article.slug]);

  const toggleToc = useCallback(() => setIsTocOpen((open) => !open), []);

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header bar */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-zinc-700/60 px-6 py-3">
        {/* Left cluster: back + TOC toggle */}
        <div className="flex items-center gap-2 justify-self-start">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>All articles</span>
          </button>
          <button
            onClick={toggleToc}
            aria-label={isTocOpen ? "Collapse table of contents" : "Show table of contents"}
            className="hidden items-center justify-center rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white md:flex"
          >
            {isTocOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Centered article title */}
        <h1
          className="truncate text-center text-sm font-semibold text-zinc-200"
          title={article.title}
        >
          {article.title}
        </h1>

        {/* Right cluster: date · project + close */}
        <div className="flex items-center gap-4 justify-self-end">
          <div className="hidden items-baseline gap-3 text-xs text-zinc-500 md:flex">
            <span>{article.date}</span>
            {article.project && (
              <>
                <span aria-hidden="true">·</span>
                <span>{article.project}</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close articles"
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Body — two columns. TOC rail on the left, article on the right.
          Rail width animates so the collapse toggle slides smoothly. */}
      <div className="flex min-h-0 flex-1">
        {/* TOC rail — only animates on screens md and up; on smaller widths
            it stays hidden as before. */}
        <motion.aside
          animate={{ width: isTocOpen ? TOC_OPEN_PX : TOC_CLOSED_PX }}
          initial={false}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="hidden shrink-0 overflow-hidden border-r border-zinc-700/60 md:block"
        >
          <div className="h-full w-64 overflow-y-auto px-4 py-6">
            <TableOfContents headings={headings} scrollRoot={scrollRoot} />
          </div>
        </motion.aside>

        {/* Article body — this is the scroll root the TOC observes. */}
        <div
          ref={setScrollRoot}
          className="flex-1 overflow-y-auto px-6 py-6 md:px-10 lg:px-14"
        >
          <article
            key={article.slug}
            ref={articleRef}
            className="cascade-fade mx-auto max-w-[80ch]"
          >
            <MarkdownRenderer body={article.body} />
          </article>
        </div>
      </div>
    </div>
  );
});
