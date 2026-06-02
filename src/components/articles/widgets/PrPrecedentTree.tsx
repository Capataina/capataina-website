"use client";

import { AnsiBox } from "./AnsiBox";

export interface PrecedentRow {
  /** Burn PR number. */
  pr: number;
  /** Short metric label. */
  metric: string;
  /** What the precedent contributed (one short line). */
  note: string;
}

interface PrPrecedentTreeProps {
  /** The PR this article is about — sits at the root of the tree. */
  rootPr: number;
  rootLabel: string;
  /** Precedents the root inherits the pattern from. */
  precedents: PrecedentRow[];
  label?: string;
}

const BURN_PR = (n: number) => `https://github.com/tracel-ai/burn/pull/${n}`;

export function PrPrecedentTree({
  rootPr,
  rootLabel,
  precedents,
  label = "PRECEDENT CHAIN",
}: PrPrecedentTreeProps) {
  return (
    <AnsiBox label={label} meta={`${precedents.length} inherited patterns`}>
      <div className="space-y-1">
        <a
          href={BURN_PR(rootPr)}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded px-1 py-0.5 transition-colors hover:bg-white/[0.04]"
          style={{ color: "var(--accent-purple)" }}
        >
          <span className="text-zinc-500">#{rootPr}</span>{" "}
          <span>{rootLabel}</span>
        </a>
        {precedents.map((row, i) => {
          const isLast = i === precedents.length - 1;
          const branch = isLast ? "└─" : "├─";
          return (
            <a
              key={row.pr}
              href={BURN_PR(row.pr)}
              target="_blank"
              rel="noopener noreferrer"
              className="grid items-baseline gap-3 rounded px-1 py-0.5 text-zinc-300 transition-colors hover:bg-white/[0.04]"
              style={{ gridTemplateColumns: "auto auto 1fr" }}
            >
              <span className="text-zinc-600">{branch}</span>
              <span>
                <span className="text-zinc-500">#{row.pr}</span>{" "}
                <span>{row.metric}</span>
              </span>
              <span className="truncate text-[0.8rem] text-zinc-500">
                {row.note}
              </span>
            </a>
          );
        })}
      </div>
    </AnsiBox>
  );
}
