"use client";

import { useMemo, useState } from "react";
import { AnsiBox } from "./AnsiBox";

const GRID = 12;
const SHADES = [" ", "·", "░", "▒", "▓", "█"];

/**
 * Mock A-FINE adapter score. Real version blends fidelity and naturalness
 * via a learned function of (s_nat_d, s_nat_r). We sketch the asymmetry
 * the paper describes: when the reference is itself low-quality
 * (s_nat_r low), fidelity carries less weight; when both natural scores
 * are high, fidelity dominates. The asymmetry on the diagonal is the
 * design intelligence.
 */
function adapterScore(sNatD: number, sNatR: number, sFid: number): number {
  const refConfidence = sigmoid(6 * (sNatR - 0.5));
  const distConfidence = sigmoid(6 * (sNatD - 0.5));
  const fidWeight = refConfidence * (0.4 + 0.6 * distConfidence);
  const natWeight = 1 - fidWeight;
  return fidWeight * sFid + natWeight * sNatD;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

interface AdapterHeatmapProps {
  label?: string;
}

export function AdapterHeatmap({ label = "ADAPTER ASYMMETRY" }: AdapterHeatmapProps) {
  const [sFid, setSFid] = useState(0.7);
  const [cursor, setCursor] = useState({ x: 8, y: 3 });

  const { rows, cursorScore, mirrorScore } = useMemo(() => {
    const grid: string[][] = [];
    let minS = Infinity;
    let maxS = -Infinity;
    const scores: number[][] = [];
    for (let y = 0; y < GRID; y += 1) {
      const sNatR = 1 - y / (GRID - 1);
      const row: number[] = [];
      for (let x = 0; x < GRID; x += 1) {
        const sNatD = x / (GRID - 1);
        const score = adapterScore(sNatD, sNatR, sFid);
        row.push(score);
        if (score < minS) minS = score;
        if (score > maxS) maxS = score;
      }
      scores.push(row);
    }
    const range = Math.max(maxS - minS, 1e-6);
    for (let y = 0; y < GRID; y += 1) {
      const row: string[] = [];
      for (let x = 0; x < GRID; x += 1) {
        const t = (scores[y][x] - minS) / range;
        const idx = Math.min(
          SHADES.length - 1,
          Math.max(0, Math.round(t * (SHADES.length - 1)))
        );
        row.push(SHADES[idx]);
      }
      grid.push(row);
    }
    const cs = scores[cursor.y][cursor.x];
    const ms = scores[cursor.x][cursor.y]; // swap-twin score (mirror across diagonal)
    return { rows: grid, cursorScore: cs, mirrorScore: ms };
  }, [sFid, cursor.x, cursor.y]);

  const cursorSNatD = cursor.x / (GRID - 1);
  const cursorSNatR = 1 - cursor.y / (GRID - 1);

  return (
    <AnsiBox
      label={label}
      meta={`s_fid = ${sFid.toFixed(2)} · cell (${cursor.x}, ${cursor.y})`}
    >
      <div className="grid items-start gap-6 md:grid-cols-[auto_1fr]">
        <div>
          <div className="select-none whitespace-pre leading-[1.15] text-zinc-200">
            {rows.map((row, y) => (
              <div key={y} className="flex">
                {row.map((cell, x) => {
                  const isCursor = cursor.x === x && cursor.y === y;
                  const isMirror = cursor.x === y && cursor.y === x && !isCursor;
                  return (
                    <button
                      key={x}
                      type="button"
                      onMouseEnter={() => setCursor({ x, y })}
                      onClick={() => setCursor({ x, y })}
                      className="inline-flex h-5 w-5 items-center justify-center text-base transition-colors hover:bg-white/[0.04]"
                      style={{
                        color: isCursor
                          ? "var(--accent-purple)"
                          : isMirror
                            ? "rgb(244,114,182)"
                            : "rgb(212,212,216)",
                      }}
                      aria-label={`s_nat_d ${(x / (GRID - 1)).toFixed(2)}, s_nat_r ${(1 - y / (GRID - 1)).toFixed(2)}`}
                    >
                      {cell}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between px-1 text-[0.65rem] text-zinc-600">
            <span>s_nat_d → 0</span>
            <span>s_nat_d → 1</span>
          </div>
        </div>

        <div className="space-y-3 text-[0.8rem]">
          <div>
            <div className="text-[0.7rem] uppercase tracking-wide text-zinc-500">
              cursor (purple)
            </div>
            <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
              <span className="text-zinc-500">s_nat_d</span>
              <span className="text-zinc-200">{cursorSNatD.toFixed(2)}</span>
              <span className="text-zinc-500">s_nat_r</span>
              <span className="text-zinc-200">{cursorSNatR.toFixed(2)}</span>
              <span className="text-zinc-500">score</span>
              <span style={{ color: "var(--accent-purple)" }}>
                {cursorScore.toFixed(3)}
              </span>
            </div>
          </div>
          <div>
            <div className="text-[0.7rem] uppercase tracking-wide text-zinc-500">
              swap twin (pink)
            </div>
            <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
              <span className="text-zinc-500">s_nat_d</span>
              <span className="text-zinc-200">{cursorSNatR.toFixed(2)}</span>
              <span className="text-zinc-500">s_nat_r</span>
              <span className="text-zinc-200">{cursorSNatD.toFixed(2)}</span>
              <span className="text-zinc-500">score</span>
              <span className="text-zinc-300">{mirrorScore.toFixed(3)}</span>
            </div>
          </div>
          <div className="border-t border-zinc-700/60 pt-2 text-[0.75rem] text-zinc-500">
            asymmetry Δ ={" "}
            <span className="text-zinc-300">
              {(cursorScore - mirrorScore).toFixed(3)}
            </span>
            {Math.abs(cursorScore - mirrorScore) > 0.05 && (
              <span className="ml-2 text-zinc-600">
                (swap matters — this is where &quot;adaptive&quot; lives)
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <div className="flex items-center justify-between text-[0.75rem] text-zinc-500">
          <span>s_fid (fidelity prior)</span>
          <span className="font-mono text-zinc-300">{sFid.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={sFid}
          onChange={(e) => setSFid(parseFloat(e.target.value))}
          className="w-full"
          style={{ accentColor: "var(--accent-purple)" }}
          aria-label="Fidelity prior"
        />
      </div>
    </AnsiBox>
  );
}
