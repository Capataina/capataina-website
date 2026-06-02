"use client";

import type { ReactNode } from "react";

interface MaintainerQuoteProps {
  /** GitHub handle, e.g. "laggui". */
  handle: string;
  /** Role tag, e.g. "tracel-ai/burn maintainer". */
  role: string;
  /** ISO date the quote was posted, optional. */
  date?: string;
  /** Verbatim quote. */
  children: ReactNode;
}

/**
 * Verbatim maintainer quote with attribution. Same dark-glass surface as
 * the other widgets so quotes feel like a first-class voice in the
 * article rather than a styled blockquote.
 */
export function MaintainerQuote({ handle, role, date, children }: MaintainerQuoteProps) {
  return (
    <div
      className="my-6 overflow-hidden rounded-lg border border-zinc-700/60"
      style={{ background: "hsla(285, 8%, 14%, 0.7)" }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-zinc-700/60 px-4 py-2 text-[0.65rem] uppercase tracking-[0.15em] text-zinc-500">
        <span>
          <span style={{ color: "var(--accent-purple)" }}>@{handle}</span>
          <span className="mx-2 text-zinc-700">·</span>
          <span>{role}</span>
        </span>
        {date && <span className="font-mono normal-case tracking-normal text-zinc-600">{date}</span>}
      </div>
      <blockquote className="px-5 py-4 text-[0.95rem] italic leading-relaxed text-zinc-200">
        <span aria-hidden="true" className="mr-2 text-zinc-600">&gt;</span>
        {children}
      </blockquote>
    </div>
  );
}
