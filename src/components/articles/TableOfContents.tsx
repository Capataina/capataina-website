"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { Heading } from "./extract-headings";

interface TableOfContentsProps {
  headings: Heading[];
  /** The scrollable container the article body lives in. We attach an
   *  IntersectionObserver to track which heading is currently in view. */
  scrollRoot: HTMLElement | null;
}

export const TableOfContents = memo(function TableOfContents({
  headings,
  scrollRoot,
}: TableOfContentsProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(
    headings[0]?.slug ?? null
  );
  // Mirror activeSlug so the IntersectionObserver callback can read the
  // latest value without re-subscribing.
  const activeSlugRef = useRef(activeSlug);
  activeSlugRef.current = activeSlug;

  useEffect(() => {
    if (!scrollRoot || headings.length === 0) return;

    // Find the heading element for each slug. The article view renders the
    // markdown into the same scroll root, so querySelector is enough.
    const elements: { slug: string; el: HTMLElement }[] = [];
    for (const h of headings) {
      const el = scrollRoot.querySelector<HTMLElement>(
        `[id="${CSS.escape(h.slug)}"]`
      );
      if (el) elements.push({ slug: h.slug, el });
    }
    if (elements.length === 0) return;

    // Track the topmost heading whose top edge is above a threshold line
    // ~25% from the top of the scroll viewport. That's the heading the
    // reader is currently "in".
    const threshold = scrollRoot.clientHeight * 0.25;

    const updateActive = () => {
      const rootTop = scrollRoot.getBoundingClientRect().top;
      let current = elements[0].slug;
      for (const { slug, el } of elements) {
        const offset = el.getBoundingClientRect().top - rootTop;
        if (offset - threshold <= 0) {
          current = slug;
        } else {
          break;
        }
      }
      if (current !== activeSlugRef.current) {
        setActiveSlug(current);
      }
    };

    // Run once on mount + on every scroll. requestAnimationFrame coalesces
    // the work so we never compute more than once per frame.
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        updateActive();
      });
    };

    updateActive();
    scrollRoot.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      scrollRoot.removeEventListener("scroll", onScroll);
    };
  }, [scrollRoot, headings]);

  if (headings.length === 0) {
    return null;
  }

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    slug: string
  ) => {
    e.preventDefault();
    if (!scrollRoot) return;
    const target = scrollRoot.querySelector<HTMLElement>(
      `[id="${CSS.escape(slug)}"]`
    );
    if (!target) return;
    const targetTop =
      target.getBoundingClientRect().top -
      scrollRoot.getBoundingClientRect().top +
      scrollRoot.scrollTop -
      24;
    scrollRoot.scrollTo({ top: targetTop, behavior: "smooth" });
    setActiveSlug(slug);
  };

  return (
    <nav className="text-sm" aria-label="Table of contents">
      <p className="mb-3 text-[0.7rem] uppercase tracking-wider text-zinc-500">
        On this page
      </p>
      <ul className="space-y-0.5">
        {headings.map((h) => {
          const isActive = h.slug === activeSlug;
          return (
            <li
              key={h.slug}
              style={{ paddingLeft: `${(h.depth - 1) * 12}px` }}
            >
              <a
                href={`#${h.slug}`}
                onClick={(e) => handleClick(e, h.slug)}
                className="group flex items-start gap-2 rounded py-1 pl-2 pr-1 leading-snug transition-all duration-75 ease-out hover:bg-white/[0.04] hover:translate-x-[2px]"
                style={{
                  color: isActive
                    ? "var(--accent-purple)"
                    : "rgb(161, 161, 170)",
                  borderLeft: isActive
                    ? `2px solid var(--accent-purple)`
                    : `2px solid transparent`,
                  marginLeft: "-2px",
                }}
              >
                <span
                  className="block break-words"
                  style={{
                    fontSize: h.depth <= 2 ? "0.85rem" : "0.78rem",
                    fontWeight: h.depth === 1 ? 600 : isActive ? 500 : 400,
                    opacity: isActive ? 1 : h.depth >= 4 ? 0.6 : 0.85,
                  }}
                >
                  {h.text}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});
