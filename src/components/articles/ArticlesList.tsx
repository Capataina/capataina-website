"use client";

import { memo, useMemo, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import type { ArticleType, Article } from "@/types";
import { ARTICLE_TYPES } from "@/types";

interface ArticlesListProps {
  articles: Article[];
  onSelect: (slug: string) => void;
  onClose: () => void;
}

type SortKey = "date-desc" | "date-asc" | "title-asc" | "title-desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "title-asc", label: "A → Z" },
  { value: "title-desc", label: "Z → A" },
];

export const ArticlesList = memo(function ArticlesList({
  articles,
  onSelect,
  onClose,
}: ArticlesListProps) {
  const [activeType, setActiveType] = useState<ArticleType | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date-desc");

  // Type chips in the toolbar — only show types that actually have at
  // least one article. Keeps the toolbar honest and avoids dead chips.
  const presentTypes = useMemo(() => {
    const set = new Set<ArticleType>();
    for (const a of articles) set.add(a.type);
    return ARTICLE_TYPES.filter((t) => set.has(t));
  }, [articles]);

  const visibleArticles = useMemo(() => {
    const filtered = activeType
      ? articles.filter((a) => a.type === activeType)
      : articles;
    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "date-desc":
          return a.date < b.date ? 1 : -1;
        case "date-asc":
          return a.date < b.date ? -1 : 1;
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
      }
    });
    return sorted;
  }, [articles, activeType, sortKey]);

  if (articles.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-zinc-500">
        <p className="text-sm">No articles yet — check back soon.</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 rounded-lg border border-zinc-700/60 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-zinc-700/60 px-6 py-4">
        <div>
          <h2 className="text-2xl font-bold text-gradient-purple">Articles</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Devlogs, deep dives, and post-mortems on what I&apos;m building.
          </p>
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

      {/* Filter + sort toolbar */}
      {presentTypes.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-700/60 px-6 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterChip
              label="All"
              isActive={activeType === null}
              onClick={() => setActiveType(null)}
            />
            {presentTypes.map((type) => (
              <FilterChip
                key={type}
                label={type}
                isActive={activeType === type}
                onClick={() =>
                  setActiveType((prev) => (prev === type ? null : type))
                }
              />
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="uppercase tracking-wider">Sort</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-lg border border-zinc-700/60 bg-zinc-900/40 px-2 py-1 text-zinc-300 outline-none transition-colors hover:border-zinc-600 focus:border-zinc-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {visibleArticles.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            No articles match this filter.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-y-[2vw] md:gap-x-[2.5%] md:px-[2.5%]">
            {visibleArticles.map((article) => (
              <li key={article.slug} className="flex">
                <button
                  type="button"
                  onClick={() => onSelect(article.slug)}
                  className="group flex w-full flex-col rounded-xl border border-zinc-700/60 bg-white/[0.02] p-5 text-left transition-all hover:border-zinc-600 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wider"
                      style={{
                        color: "var(--accent-purple)",
                        background: "color-mix(in srgb, var(--accent-purple) 12%, transparent)",
                        border:
                          "1px solid color-mix(in srgb, var(--accent-purple) 25%, transparent)",
                      }}
                    >
                      {article.type}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {article.date}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-zinc-100 transition-colors group-hover:text-white">
                    {article.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                    {article.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {article.project && (
                        <span className="rounded-full border border-zinc-700/60 px-2 py-0.5 text-[0.7rem] text-zinc-300">
                          {article.project}
                        </span>
                      )}
                      {article.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-zinc-700/60 px-2 py-0.5 text-[0.7rem] text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <ArrowRight
                      className="h-4 w-4 transition-all group-hover:translate-x-1"
                      style={{ color: "var(--accent-purple-dim)" }}
                    />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function FilterChip({ label, isActive, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-3 py-1 text-xs font-medium transition-all duration-100"
      style={
        isActive
          ? {
              color: "white",
              background: "var(--accent-purple)",
              border: "1px solid var(--accent-purple)",
            }
          : {
              color: "rgb(161, 161, 170)",
              background: "transparent",
              border: "1px solid rgb(63, 63, 70)",
            }
      }
    >
      {label}
    </button>
  );
}
