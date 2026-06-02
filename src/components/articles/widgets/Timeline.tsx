"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AnsiBox } from "./AnsiBox";

export interface TimelineEvent {
  /** ISO date YYYY-MM-DD. */
  date: string;
  /** Descriptive label rendered next to the dot. Should read as a
   *  short sentence on its own ("claimed the issue") so the collapsed
   *  state already tells the timeline. */
  label: string;
  /** Expanded detail revealed on click. */
  detail: string;
  /** Optional actor (e.g. "laggui", "Caner") shown as a small role tag. */
  actor?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  /** Optional title rendered at the top of the AnsiBox. */
  label?: string;
}

/**
 * Vertical event log. Titles alone read top-to-bottom as the timeline.
 * Click any row to expand its detail; click again to collapse. Only one
 * row stays expanded at a time so the eye has a single focus point.
 */
export function Timeline({ events, label = "TIMELINE" }: TimelineProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <AnsiBox
      label={label}
      meta={`${events.length} milestones — click any to expand`}
    >
      <ol className="space-y-0">
        {events.map((event, idx) => {
          const isExpanded = idx === expandedIdx;
          const isFirst = idx === 0;
          const isLast = idx === events.length - 1;
          return (
            <li
              key={`${event.date}-${idx}`}
              className="grid cursor-pointer gap-3 rounded transition-colors hover:bg-white/[0.03]"
              style={{ gridTemplateColumns: "auto 1fr auto" }}
              onClick={() =>
                setExpandedIdx((current) => (current === idx ? null : idx))
              }
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpandedIdx((current) => (current === idx ? null : idx));
                }
              }}
              aria-expanded={isExpanded}
            >
              <div className="flex flex-col items-center pt-[0.5rem]">
                <span
                  className="h-2 w-px"
                  style={{
                    background: isFirst ? "transparent" : "rgb(63,63,70)",
                  }}
                  aria-hidden="true"
                />
                <span
                  className="text-base leading-none transition-colors"
                  style={{
                    color: isExpanded
                      ? "var(--accent-purple)"
                      : "rgb(113,113,122)",
                  }}
                  aria-hidden="true"
                >
                  {isExpanded ? "●" : "○"}
                </span>
                <span
                  className="w-px flex-1"
                  style={{
                    background: isLast ? "transparent" : "rgb(63,63,70)",
                    minHeight: "0.75rem",
                  }}
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 py-2 pr-2">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span
                    className="font-mono text-[0.78rem]"
                    style={{
                      color: isExpanded
                        ? "var(--accent-purple)"
                        : "rgb(161,161,170)",
                    }}
                  >
                    {event.date}
                  </span>
                  <span
                    className="text-[0.9rem]"
                    style={{
                      color: isExpanded ? "rgb(244,244,245)" : "rgb(212,212,216)",
                    }}
                  >
                    {event.label}
                  </span>
                  {event.actor && (
                    <span className="text-[0.7rem] text-zinc-500">
                      @{event.actor}
                    </span>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="detail"
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{
                        opacity: 1,
                        height: "auto",
                        marginTop: "0.5rem",
                      }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{
                        duration: 0.22,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="overflow-hidden"
                    >
                      <p className="text-[0.85rem] leading-relaxed text-zinc-300">
                        {event.detail}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center pt-2 pr-1">
                <span
                  aria-hidden="true"
                  className="text-zinc-600 transition-transform duration-150"
                  style={{
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                    fontSize: "0.7rem",
                  }}
                >
                  ▶
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </AnsiBox>
  );
}
