"use client";

import type { CSSProperties, ReactNode } from "react";

interface AnsiBoxProps {
  /** Short label rendered at the top-left in uppercase tracking. */
  label?: string;
  /** Optional right-side annotation in the header. */
  meta?: ReactNode;
  /** Pane body. */
  children: ReactNode;
  /** Override total width; defaults to fluid (max-w-full). */
  style?: CSSProperties;
  className?: string;
}

/**
 * Shared wrapper for the article's inline widgets. Same dark-glass
 * background as the code-block surface so widgets feel like part of the
 * prose rather than a foreign panel. Single subtle border, no loud
 * colours — the ANSI house style.
 */
export function AnsiBox({ label, meta, children, style, className }: AnsiBoxProps) {
  return (
    <div
      className={`my-6 overflow-hidden rounded-lg border border-zinc-700/60 ${className ?? ""}`}
      style={{
        background: "hsla(285, 8%, 14%, 0.7)",
        ...style,
      }}
    >
      {(label || meta) && (
        <div className="flex items-center justify-between gap-3 border-b border-zinc-700/60 px-4 py-2 text-[0.65rem] uppercase tracking-[0.15em] text-zinc-500">
          {label && <span>{label}</span>}
          {meta && <span className="font-mono normal-case tracking-normal text-zinc-400">{meta}</span>}
        </div>
      )}
      <div className="px-4 py-4 font-mono text-[0.85rem] leading-[1.5] text-zinc-200/90">
        {children}
      </div>
    </div>
  );
}
