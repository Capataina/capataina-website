"use client";

import { useMemo } from "react";
import { AnsiBox } from "./AnsiBox";

/** Standard GELU: x · Φ(x) using the cumulative normal Φ. */
function gelu(x: number): number {
  const cdf = 0.5 * (1 + erf(x / Math.SQRT2));
  return x * cdf;
}

function quickGelu(x: number): number {
  return x * sigmoid(1.702 * x);
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function erf(x: number): number {
  // Abramowitz & Stegun 7.1.26 approximation; ~1.5e-7 accuracy.
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

const VIEW_WIDTH = 480;
const VIEW_HEIGHT = 200;
const X_MIN = -3;
const X_MAX = 3;
const Y_MIN = -0.4;
const Y_MAX = 3.2;

interface GeluComparisonProps {
  label?: string;
}

export function GeluComparison({ label = "QUICKGELU VS GELU" }: GeluComparisonProps) {
  const { geluPath, quickPath, gapPath, maxGap, maxGapX } = useMemo(() => {
    const samples = 200;
    const xs: number[] = [];
    const ys1: number[] = [];
    const ys2: number[] = [];
    let mGap = 0;
    let mGapX = 0;
    for (let i = 0; i <= samples; i += 1) {
      const x = X_MIN + (i / samples) * (X_MAX - X_MIN);
      const y1 = gelu(x);
      const y2 = quickGelu(x);
      const gap = Math.abs(y1 - y2);
      if (gap > mGap) {
        mGap = gap;
        mGapX = x;
      }
      xs.push(x);
      ys1.push(y1);
      ys2.push(y2);
    }
    const toX = (x: number) =>
      ((x - X_MIN) / (X_MAX - X_MIN)) * VIEW_WIDTH;
    const toY = (y: number) =>
      VIEW_HEIGHT - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * VIEW_HEIGHT;

    const buildPath = (ys: number[]) =>
      xs
        .map((x, i) => `${i === 0 ? "M" : "L"} ${toX(x).toFixed(2)} ${toY(ys[i]).toFixed(2)}`)
        .join(" ");

    const gapStart = `M ${toX(mGapX).toFixed(2)} ${toY(gelu(mGapX)).toFixed(2)}`;
    const gapEnd = `L ${toX(mGapX).toFixed(2)} ${toY(quickGelu(mGapX)).toFixed(2)}`;

    return {
      geluPath: buildPath(ys1),
      quickPath: buildPath(ys2),
      gapPath: `${gapStart} ${gapEnd}`,
      maxGap: mGap,
      maxGapX: mGapX,
    };
  }, []);

  return (
    <AnsiBox
      label={label}
      meta={`max gap ≈ ${maxGap.toFixed(4)} at x = ${maxGapX.toFixed(2)}`}
    >
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="GELU compared with QuickGELU"
      >
        {/* Axes */}
        <line
          x1={0}
          y1={((0 - Y_MIN) / (Y_MAX - Y_MIN)) * VIEW_HEIGHT}
          x2={VIEW_WIDTH}
          y2={((0 - Y_MIN) / (Y_MAX - Y_MIN)) * VIEW_HEIGHT}
          stroke="rgb(63,63,70)"
          strokeWidth={1}
          strokeDasharray="2 4"
        />
        <line
          x1={((0 - X_MIN) / (X_MAX - X_MIN)) * VIEW_WIDTH}
          y1={0}
          x2={((0 - X_MIN) / (X_MAX - X_MIN)) * VIEW_WIDTH}
          y2={VIEW_HEIGHT}
          stroke="rgb(63,63,70)"
          strokeWidth={1}
          strokeDasharray="2 4"
        />
        {/* GELU (solid, zinc) */}
        <path d={geluPath} fill="none" stroke="rgb(212,212,216)" strokeWidth={1.5} />
        {/* QuickGELU (dashed, purple) */}
        <path
          d={quickPath}
          fill="none"
          stroke="var(--accent-purple)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        {/* Max-gap marker */}
        <path d={gapPath} stroke="rgb(244,114,182)" strokeWidth={1.5} />
        <circle
          cx={((maxGapX - X_MIN) / (X_MAX - X_MIN)) * VIEW_WIDTH}
          cy={VIEW_HEIGHT - ((gelu(maxGapX) - Y_MIN) / (Y_MAX - Y_MIN)) * VIEW_HEIGHT}
          r={2.5}
          fill="rgb(244,114,182)"
        />
      </svg>
      <div className="mt-3 flex items-center justify-between gap-4 text-[0.75rem] text-zinc-500">
        <span>
          <span className="text-zinc-300">───</span>
          <span className="ml-2">GELU (erf-based, PyTorch default)</span>
        </span>
        <span>
          <span style={{ color: "var(--accent-purple)" }}>┄┄┄</span>
          <span className="ml-2">QuickGELU = x · σ(1.702 · x)</span>
        </span>
      </div>
    </AnsiBox>
  );
}
