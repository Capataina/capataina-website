"use client";

import { useMemo, useState } from "react";
import { AnsiBox } from "./AnsiBox";

const VIEW_WIDTH = 480;
const VIEW_HEIGHT = 180;
const X_MIN = -0.4;
const X_MAX = 0.4;
// Fixed y-axis so the curve flattens visibly as c grows — auto-fit
// previously hid the collapse by rescaling.
const Y_MIN = 0;
const Y_MAX = 1.3;
const C_MIN = Math.log10(1e-12);
const C_MAX = Math.log10(1e-3);
const PAPER_LOG_C = -10;

/**
 * Single-channel SSIM-style fidelity ratio. We sweep one of the
 * distorted feature means against a fixed reference, so the curve
 * traces "how does fidelity change as the distorted feature drifts
 * away from the reference?". With c at the paper's 1e-10, the answer
 * has shape — the curve dips meaningfully around the mismatched
 * region. With c too large the ratio numerator + denominator both
 * get swamped by c and the score sticks near 1 everywhere: silent
 * collapse.
 */
function fidelityScore(x: number, c: number): number {
  const muR = 0.04;
  const sigmaR = 0.02;
  const muD = muR + x;
  const sigmaD = sigmaR + 0.15 * Math.abs(x);
  const sigmaDR = sigmaR * sigmaD * Math.exp(-12 * x * x);

  const num = (2 * muD * muR + c) * (2 * sigmaDR + c);
  const den = (muD * muD + muR * muR + c) * (sigmaD * sigmaD + sigmaR * sigmaR + c);
  return num / den;
}

function buildPath(c: number, color: string): string {
  const samples = 220;
  const toX = (x: number) => ((x - X_MIN) / (X_MAX - X_MIN)) * VIEW_WIDTH;
  const toY = (y: number) =>
    VIEW_HEIGHT - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * VIEW_HEIGHT;

  const parts: string[] = [];
  for (let i = 0; i <= samples; i += 1) {
    const x = X_MIN + (i / samples) * (X_MAX - X_MIN);
    const y = fidelityScore(x, c);
    const xp = toX(x).toFixed(2);
    const yp = Math.max(0, Math.min(VIEW_HEIGHT, toY(y))).toFixed(2);
    parts.push(`${i === 0 ? "M" : "L"} ${xp} ${yp}`);
  }
  // The color param is unused inside the path string; it's threaded for
  // callsite parity with multi-curve buildPath variants.
  void color;
  return parts.join(" ");
}

interface RatioCollapseProps {
  label?: string;
}

export function RatioCollapse({
  label = "FIDELITY RATIO — c SENSITIVITY",
}: RatioCollapseProps) {
  const [logC, setLogC] = useState(PAPER_LOG_C);
  const c = Math.pow(10, logC);

  const { path, paperPath, scoreRange, minScore, maxScore } = useMemo(() => {
    const samples = 220;
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i <= samples; i += 1) {
      const x = X_MIN + (i / samples) * (X_MAX - X_MIN);
      const y = fidelityScore(x, c);
      if (y < lo) lo = y;
      if (y > hi) hi = y;
    }
    return {
      path: buildPath(c, "var(--accent-purple)"),
      paperPath: buildPath(Math.pow(10, PAPER_LOG_C), "rgb(113,113,122)"),
      scoreRange: hi - lo,
      minScore: lo,
      maxScore: hi,
    };
  }, [c]);

  const collapse =
    scoreRange < 0.02
      ? { tag: "FULLY COLLAPSED", tone: "rgb(244,114,182)" }
      : scoreRange < 0.1
        ? { tag: "RATIO COMPRESSING", tone: "rgb(248,113,113)" }
        : scoreRange < 0.3
          ? { tag: "DRIFTING", tone: "rgb(251,191,36)" }
          : { tag: "STABLE", tone: "var(--accent-purple)" };

  const verdict =
    logC <= -9
      ? "paper-grade — full dynamic range available"
      : logC <= -6
        ? "starting to drift, less discrimination at the extremes"
        : logC <= -3
          ? "ratio compressing toward 1 — score is losing meaning"
          : "ratio collapsed — every input gets ≈ the same score";

  return (
    <AnsiBox
      label={label}
      meta={`c = 10^${logC.toFixed(1)} ≈ ${c.toExponential(2)}`}
    >
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Fidelity-ratio response curve at the current stabilising constant c"
      >
        {/* Horizontal grid lines at 0.25, 0.5, 0.75, 1.0. */}
        {[0.25, 0.5, 0.75, 1.0].map((y) => {
          const yp = VIEW_HEIGHT - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * VIEW_HEIGHT;
          return (
            <g key={y}>
              <line
                x1={0}
                x2={VIEW_WIDTH}
                y1={yp}
                y2={yp}
                stroke="rgb(39,39,42)"
                strokeWidth={1}
              />
              <text
                x={4}
                y={yp - 3}
                fontSize={9}
                fontFamily="ui-monospace,monospace"
                fill="rgb(82,82,91)"
              >
                {y.toFixed(2)}
              </text>
            </g>
          );
        })}
        {/* Reference: paper's c=1e-10 — always visible so the user can see
            what "stable" looks like next to the current setting. */}
        <path
          d={paperPath}
          fill="none"
          stroke="rgb(113,113,122)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        {/* Current setting. */}
        <path
          d={path}
          fill="none"
          stroke="var(--accent-purple)"
          strokeWidth={2}
        />
      </svg>

      <div className="mt-2 grid items-baseline gap-2 text-[0.7rem] md:grid-cols-3">
        <span className="text-zinc-500">
          <span className="text-zinc-300">───</span>
          <span className="ml-2">current c</span>
        </span>
        <span className="text-zinc-500">
          <span className="text-zinc-600">┄┄┄</span>
          <span className="ml-2">reference (c = 1e-10)</span>
        </span>
        <span className="text-right" style={{ color: collapse.tone }}>
          {collapse.tag}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-baseline justify-between text-[0.75rem] text-zinc-500">
          <span>c stabilising constant</span>
          <span className="font-mono text-zinc-300">
            10^{logC.toFixed(1)}
          </span>
        </div>
        <input
          type="range"
          min={C_MIN}
          max={C_MAX}
          step={0.1}
          value={logC}
          onChange={(e) => setLogC(parseFloat(e.target.value))}
          className="w-full"
          style={{ accentColor: "var(--accent-purple)" }}
          aria-label="Stabilising constant c (log scale)"
        />
        <div className="flex justify-between text-[0.65rem] text-zinc-600">
          <span>1e-12</span>
          <span>
            <span style={{ color: "var(--accent-purple)" }}>1e-10 paper</span>
          </span>
          <span>1e-6</span>
          <span>1e-3 collapsed</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-zinc-700/60 pt-3 text-[0.75rem]">
        <div>
          <div className="text-zinc-500">score range</div>
          <div className="mt-0.5 font-mono" style={{ color: collapse.tone }}>
            {scoreRange.toFixed(4)}
          </div>
        </div>
        <div>
          <div className="text-zinc-500">min · max</div>
          <div className="mt-0.5 font-mono text-zinc-300">
            {minScore.toFixed(3)} … {maxScore.toFixed(3)}
          </div>
        </div>
        <div>
          <div className="text-zinc-500">verdict</div>
          <div className="mt-0.5 text-zinc-300">{verdict}</div>
        </div>
      </div>
    </AnsiBox>
  );
}
