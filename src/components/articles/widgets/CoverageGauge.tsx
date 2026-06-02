"use client";

import { AnsiBox } from "./AnsiBox";

interface CoverageGaugeProps {
  /** The PR's patch coverage as a percentage 0–100. */
  patchPct: number;
  /** The project's target coverage as a percentage 0–100. */
  targetPct: number;
  /** Footer note explaining the gap. */
  note?: string;
  label?: string;
}

const TRACK_WIDTH = 40;

/**
 * Single horizontal coverage bar. The fill is block-characters; a `┊`
 * marker shows the target threshold. Honest visual of "merged anyway"
 * when the patch-coverage bar stops short of the threshold marker.
 */
export function CoverageGauge({
  patchPct,
  targetPct,
  note,
  label = "CODECOV",
}: CoverageGaugeProps) {
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const fillCells = Math.round((clamp(patchPct) / 100) * TRACK_WIDTH);
  const targetCell = Math.round((clamp(targetPct) / 100) * TRACK_WIDTH);

  const cells: string[] = [];
  for (let i = 0; i < TRACK_WIDTH; i += 1) {
    if (i === targetCell - 1) {
      cells.push("│");
    } else if (i < fillCells) {
      cells.push("█");
    } else {
      cells.push("░");
    }
  }
  const bar = cells.join("");

  return (
    <AnsiBox
      label={label}
      meta={`patch ${patchPct.toFixed(2)}% · target ${targetPct.toFixed(0)}%`}
    >
      <div className="space-y-2">
        <div className="grid items-baseline gap-3" style={{ gridTemplateColumns: "auto 1fr auto" }}>
          <span className="text-zinc-500">patch</span>
          <span className="overflow-hidden whitespace-pre" style={{ color: "var(--accent-purple)" }}>
            {bar}
          </span>
          <span className="w-16 text-right text-zinc-300">{patchPct.toFixed(2)}%</span>
        </div>
        <div className="grid items-baseline gap-3 text-[0.75rem]" style={{ gridTemplateColumns: "auto 1fr auto" }}>
          <span className="text-zinc-600">target</span>
          <span className="text-zinc-600">
            {"─".repeat(Math.max(0, targetCell - 1))}
            <span className="text-zinc-400">┊</span>
            {"─".repeat(Math.max(0, TRACK_WIDTH - targetCell))}
          </span>
          <span className="w-16 text-right text-zinc-500">{targetPct.toFixed(0)}%</span>
        </div>
      </div>
      {note && (
        <div className="mt-3 border-t border-zinc-700/60 pt-2 text-[0.75rem] text-zinc-400">
          {note}
        </div>
      )}
    </AnsiBox>
  );
}
