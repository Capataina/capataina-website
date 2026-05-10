"use client";

import dynamic from "next/dynamic";
import { Quadrant } from "@/components/shell/Quadrant";
import { PortfolioCard } from "@/components/shell/PortfolioCard";
import { useCallback, useEffect, useState } from "react";
import { allArticles } from "@/content/articles";

// Code-split the canvas-heavy ParticleNetwork component — its physics +
// rAF loop don't need to be in the initial bundle. ssr:false because the
// canvas API is browser-only; trying to render it server-side produces
// hydration mismatches without changing the visible output.
const ParticleNetwork = dynamic(
  () =>
    import("@/components/shell/ParticleNetwork").then((m) => m.ParticleNetwork),
  { ssr: false }
);

type QuadrantTheme = "default" | "systems" | "ai" | "finance" | "opensource";

// Position to theme mapping
const positionToTheme: Record<number, QuadrantTheme> = {
  1: "systems",
  2: "ai",
  3: "finance",
  4: "opensource",
};

const ARTICLE_PARAM = "article";

/** Read the article slug from the current URL's query string. */
function readArticleParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(ARTICLE_PARAM);
}

/** Replace `?article=<slug>` (or remove it) without polluting browser history. */
function writeArticleParam(slug: string | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (slug) {
    url.searchParams.set(ARTICLE_PARAM, slug);
  } else {
    url.searchParams.delete(ARTICLE_PARAM);
  }
  window.history.replaceState({}, "", url);
}

export default function Home() {
  const [hoveredQuadrant, setHoveredQuadrant] = useState<number | null>(null);
  const [selectedQuadrant, setSelectedQuadrant] = useState<number | null>(null);
  const [articlesOpen, setArticlesOpen] = useState(false);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(
    null
  );

  // On mount + on browser back/forward navigation, read `?article=<slug>`
  // from the URL and reflect it into local state. Direct refresh on a
  // shareable link lands the visitor on the corresponding article.
  useEffect(() => {
    const sync = () => {
      const slug = readArticleParam();
      if (slug) {
        setArticlesOpen(true);
        setSelectedArticleSlug(slug);
        setSelectedQuadrant(null);
        setHoveredQuadrant(null);
      } else {
        setSelectedArticleSlug(null);
        // We don't auto-close the panel here — the panel-open-but-no-article
        // state isn't URL-synced (transient list view).
      }
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  // Theme is derived synchronously from state and applied via the
  // `data-quadrant-theme` attribute below; the CSS rules in globals.css
  // override the accent vars per theme.
  const activeQuadrant = selectedQuadrant ?? hoveredQuadrant;
  const theme: QuadrantTheme = activeQuadrant
    ? positionToTheme[activeQuadrant]
    : "default";

  // -- Mutually-exclusive state transitions ---------------------------------
  // Articles and an expanded quadrant are never both open. Each handler
  // collapses the other before applying its own change.

  const handleQuadrantSelect = useCallback((position: number | null) => {
    setSelectedQuadrant(position);
    if (position !== null) {
      setArticlesOpen(false);
      setSelectedArticleSlug(null);
      writeArticleParam(null);
    }
  }, []);

  const handleArticleSelect = useCallback((slug: string | null) => {
    setSelectedArticleSlug(slug);
    writeArticleParam(slug);
    if (slug) {
      setArticlesOpen(true);
      setSelectedQuadrant(null);
    }
  }, []);

  const handleArticlesToggle = useCallback(() => {
    setArticlesOpen((open) => {
      const next = !open;
      if (next) {
        setSelectedQuadrant(null);
        setHoveredQuadrant(null);
      } else {
        setSelectedArticleSlug(null);
        writeArticleParam(null);
      }
      return next;
    });
  }, []);

  const handleArticlesClose = useCallback(() => {
    setArticlesOpen(false);
    setSelectedArticleSlug(null);
    writeArticleParam(null);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedQuadrant(null);
    setArticlesOpen(false);
    setSelectedArticleSlug(null);
    writeArticleParam(null);
  }, []);

  // Esc key — closes whichever overlay is open. Articles take priority
  // (it's the bigger surface) and falls back to deselecting a quadrant.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (articlesOpen) {
        handleArticlesClose();
      } else if (selectedQuadrant !== null) {
        setSelectedQuadrant(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [articlesOpen, selectedQuadrant, handleArticlesClose]);

  return (
    <div
      data-quadrant-theme={theme}
      className="h-screen w-screen flex flex-wrap gradient-bg p-2 relative overflow-hidden"
      style={{ perspective: 1000 }}
      onClick={handleBackgroundClick}
    >
      {/* Interactive particle network background */}
      <ParticleNetwork />

      {/* Portfolio Card — compact in default mode, expanded into the
          80% × 80% articles panel when articlesOpen. */}
      <PortfolioCard
        hoveredQuadrant={hoveredQuadrant}
        selectedQuadrant={selectedQuadrant}
        articlesOpen={articlesOpen}
        selectedArticleSlug={selectedArticleSlug}
        articles={allArticles}
        onArticlesToggle={handleArticlesToggle}
        onArticleSelect={handleArticleSelect}
        onArticlesClose={handleArticlesClose}
      />

      <Quadrant
        position={1}
        hoveredQuadrant={hoveredQuadrant}
        selectedQuadrant={selectedQuadrant}
        onHoverChange={setHoveredQuadrant}
        onSelect={handleQuadrantSelect}
        label="Systems & Infrastructure Engineer"
        articlesMode={articlesOpen}
      />
      <Quadrant
        position={2}
        hoveredQuadrant={hoveredQuadrant}
        selectedQuadrant={selectedQuadrant}
        onHoverChange={setHoveredQuadrant}
        onSelect={handleQuadrantSelect}
        label="Applied AI & ML Infrastructure Engineer"
        articlesMode={articlesOpen}
      />
      <Quadrant
        position={3}
        hoveredQuadrant={hoveredQuadrant}
        selectedQuadrant={selectedQuadrant}
        onHoverChange={setHoveredQuadrant}
        onSelect={handleQuadrantSelect}
        label="Low Level Financial Systems Engineer"
        articlesMode={articlesOpen}
      />
      <Quadrant
        position={4}
        hoveredQuadrant={hoveredQuadrant}
        selectedQuadrant={selectedQuadrant}
        onHoverChange={setHoveredQuadrant}
        onSelect={handleQuadrantSelect}
        label="Open Source Engineer"
        articlesMode={articlesOpen}
      />
    </div>
  );
}
