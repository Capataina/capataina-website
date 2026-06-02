"use client";

import { useMemo, useState } from "react";
import { AnsiBox } from "./AnsiBox";

type Distortion = "translation" | "blur" | "noise";

const WIDTH = 38;
const HEIGHT = 18;
const SHADES = " .,-~:;=!*#$@";

interface Cell {
  char: string;
  lum: number;
}

type Grid = Cell[][];

/**
 * Project an ASCII donut into a (HEIGHT × WIDTH) char grid. The donut is
 * static — no per-frame spin. We render once at a flattering view angle
 * and let the distortion slider be the action.
 *
 * The classic-ish projection algorithm: torus parametric (i, j) loops,
 * z-buffer for occlusion, luminance = surface normal · light direction.
 * The y-coordinate is compressed by an aspect factor so the donut reads
 * round at typical monospace cell ratios (~2:1 height:width).
 */
function renderDonut(A: number, B: number): Grid {
  const grid: Grid = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    grid.push(Array.from({ length: WIDTH }, () => ({ char: " ", lum: 0 })));
  }
  const zBuf: number[][] = grid.map((row) => row.map(() => 0));

  const R1 = 1;
  const R2 = 2;
  const K2 = 5;
  const K1 = (WIDTH * K2 * 3) / (8 * (R1 + R2));

  for (let j = 0; j < Math.PI * 2; j += 0.07) {
    const cosj = Math.cos(j);
    const sinj = Math.sin(j);
    for (let i = 0; i < Math.PI * 2; i += 0.02) {
      const cosi = Math.cos(i);
      const sini = Math.sin(i);

      const cx = R2 + R1 * cosj;
      const cy = R1 * sinj;

      const x =
        cx * (Math.cos(B) * cosi + Math.sin(A) * Math.sin(B) * sini) -
        cy * Math.cos(A) * Math.sin(B);
      const y =
        cx * (Math.sin(B) * cosi - Math.sin(A) * Math.cos(B) * sini) +
        cy * Math.cos(A) * Math.cos(B);
      const z = K2 + Math.cos(A) * cx * sini + cy * Math.sin(A);
      const ooz = 1 / z;

      const xp = Math.floor(WIDTH / 2 + K1 * ooz * x);
      const yp = Math.floor(HEIGHT / 2 - K1 * ooz * y * 0.5);

      const L =
        cosj * cosi * Math.sin(B) -
        Math.cos(A) * cosj * sini -
        Math.sin(A) * sinj +
        Math.cos(B) * (Math.cos(A) * sinj - cosj * Math.sin(A) * sini);

      if (
        yp >= 0 &&
        yp < HEIGHT &&
        xp >= 0 &&
        xp < WIDTH &&
        L > 0 &&
        ooz > zBuf[yp][xp]
      ) {
        zBuf[yp][xp] = ooz;
        const idx = Math.min(
          SHADES.length - 1,
          Math.max(0, Math.floor(L * 8))
        );
        grid[yp][xp] = { char: SHADES[idx], lum: idx };
      }
    }
  }
  return grid;
}

function cloneGrid(g: Grid): Grid {
  return g.map((row) => row.map((c) => ({ ...c })));
}

function translate(g: Grid, dx: number): Grid {
  const out: Grid = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    const row: Cell[] = [];
    for (let x = 0; x < WIDTH; x += 1) {
      const sx = x - dx;
      if (sx < 0 || sx >= WIDTH) {
        row.push({ char: " ", lum: 0 });
      } else {
        row.push({ ...g[y][sx] });
      }
    }
    out.push(row);
  }
  return out;
}

function blur(g: Grid, strength: number): Grid {
  // strength ∈ [0, 1]. 0 → identity. 1 → full 3x3 averaging.
  const out = cloneGrid(g);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      let sum = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny < 0 || ny >= HEIGHT || nx < 0 || nx >= WIDTH) continue;
          sum += g[ny][nx].lum;
          count += 1;
        }
      }
      const avg = sum / count;
      const blended = g[y][x].lum * (1 - strength) + avg * strength;
      const idx = Math.min(
        SHADES.length - 1,
        Math.max(0, Math.round(blended))
      );
      out[y][x] = { char: SHADES[idx], lum: idx };
    }
  }
  return out;
}

function noise(g: Grid, strength: number, seed: number): Grid {
  // Deterministic noise via a small LCG so the visualisation doesn't
  // flicker on re-render when nothing relevant changed.
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s / 0xffffffff) * 2 - 1;
  };
  const out = cloneGrid(g);
  const span = (SHADES.length - 1) * strength;
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      // Only perturb foreground pixels; background stays clean so the
      // donut silhouette survives high noise.
      if (g[y][x].lum === 0) continue;
      const delta = rand() * span;
      const lum = Math.min(
        SHADES.length - 1,
        Math.max(0, Math.round(g[y][x].lum + delta))
      );
      out[y][x] = { char: SHADES[lum], lum };
    }
  }
  return out;
}

function psnr(reference: Grid, distorted: Grid): number {
  const max = SHADES.length - 1;
  let mse = 0;
  let count = 0;
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const diff = reference[y][x].lum - distorted[y][x].lum;
      mse += diff * diff;
      count += 1;
    }
  }
  mse /= count;
  if (mse === 0) return Infinity;
  return 10 * Math.log10((max * max) / mse);
}

function gridToString(g: Grid): string {
  const lines = g.map((row) => row.map((c) => c.char).join(""));
  // Drop blank rows top + bottom so the rendered donut's vertical extent
  // matches the pre's height exactly. The projection math leaves uneven
  // empty bands above vs below the donut depending on the view angle;
  // trimming them keeps the donut visually centred in its container.
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === "") start += 1;
  while (end > start && lines[end - 1].trim() === "") end -= 1;
  return lines.slice(start, end).join("\n");
}

const TRACK_WIDTH = 28;

function bar(pct: number): string {
  const clamped = Math.max(0, Math.min(1, pct));
  const filled = Math.round(clamped * TRACK_WIDTH);
  return "█".repeat(filled) + "░".repeat(TRACK_WIDTH - filled);
}

function syntheticSsim(d: Distortion, t: number): number {
  // Translation strength is direction-agnostic — left vs right shift
  // produces identical metric scores.
  const mag = Math.abs(t);
  switch (d) {
    case "translation":
      return 1 - 0.18 * mag;
    case "blur":
      return 1 - 0.82 * mag;
    case "noise":
      return 1 - 0.55 * mag;
  }
}

function syntheticAFine(d: Distortion, t: number): number {
  const mag = Math.abs(t);
  switch (d) {
    case "translation":
      return 1 - 0.12 * mag;
    case "blur":
      return 1 - 0.58 * mag;
    case "noise":
      return 1 - 0.62 * mag;
  }
}

const VERDICTS: Record<Distortion, string> = {
  translation:
    "PSNR collapses on shift while humans barely notice. SSIM and A-FINE hold steady because both compare features, not raw pixels.",
  blur:
    "SSIM over-penalises blur because local structure breaks even when global content is preserved. A-FINE softens the curve.",
  noise:
    "Noise hurts all three. A-FINE pulls in tighter than SSIM because it weighs naturalness — heavy noise stops looking like a real image.",
};

interface MetricComparisonProps {
  label?: string;
}

export function MetricComparison({
  label = "PSNR / SSIM / A-FINE",
}: MetricComparisonProps) {
  const [distortion, setDistortion] = useState<Distortion>("translation");
  // Translation is bipolar in [-1, 1] with 0 = centred; blur/noise are
  // unipolar strength in [0, 1]. Switching distortion type resets t to
  // the sensible default for the new mode so the slider position stays
  // semantic.
  const [t, setT] = useState(0);

  const handleDistortionChange = (d: Distortion) => {
    setDistortion(d);
    setT(d === "translation" ? 0 : 0.5);
  };

  const sliderMin = distortion === "translation" ? -1 : 0;
  const sliderMax = 1;

  const referenceGrid = useMemo(() => renderDonut(0.6, 0.5), []);

  const distortedGrid = useMemo(() => {
    if (t === 0) return referenceGrid;
    switch (distortion) {
      case "translation":
        // Signed shift: negative = left, positive = right.
        return translate(referenceGrid, Math.round(t * 5));
      case "blur":
        return blur(referenceGrid, Math.abs(t));
      case "noise":
        return noise(referenceGrid, Math.abs(t), 12345);
    }
  }, [distortion, t, referenceGrid]);

  const psnrValue = useMemo(
    () => psnr(referenceGrid, distortedGrid),
    [referenceGrid, distortedGrid]
  );
  const ssimValue = syntheticSsim(distortion, t);
  const afineValue = syntheticAFine(distortion, t);

  // Normalise PSNR to a 0-1 bar scale. 40 dB ≈ "great" → full bar. 5 dB ≈
  // "essentially destroyed" → near-empty bar.
  const psnrNorm = Math.max(
    0,
    Math.min(1, (psnrValue === Infinity ? 40 : psnrValue) / 40)
  );

  return (
    <AnsiBox
      label={label}
      meta={`${distortion} · t = ${t >= 0 ? "+" : ""}${t.toFixed(2)}`}
    >
      <div className="flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-wide">
        {(["translation", "blur", "noise"] as Distortion[]).map((d) => {
          const isActive = d === distortion;
          return (
            <button
              key={d}
              type="button"
              onClick={() => handleDistortionChange(d)}
              className="rounded px-2 py-1 transition-colors hover:bg-white/[0.04]"
              style={{
                color: isActive ? "var(--accent-purple)" : "rgb(161,161,170)",
                borderBottom: isActive
                  ? `1px solid var(--accent-purple)`
                  : "1px solid transparent",
              }}
            >
              {d}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[0.65rem] uppercase tracking-wider text-zinc-500">
            reference
          </div>
          <pre
            className="overflow-x-auto whitespace-pre rounded border border-zinc-800/80 px-2 py-2 text-center text-[0.78rem] leading-[1.05] text-zinc-200"
            style={{ background: "hsla(285, 8%, 11%, 0.6)" }}
          >
            {gridToString(referenceGrid)}
          </pre>
        </div>
        <div>
          <div className="mb-1 text-[0.65rem] uppercase tracking-wider text-zinc-500">
            distorted
          </div>
          <pre
            className="overflow-x-auto whitespace-pre rounded border border-zinc-800/80 px-2 py-2 text-center text-[0.78rem] leading-[1.05]"
            style={{
              background: "hsla(285, 8%, 11%, 0.6)",
              color: "var(--accent-purple)",
            }}
          >
            {gridToString(distortedGrid)}
          </pre>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        {[
          {
            name: "PSNR",
            value:
              psnrValue === Infinity ? "∞" : psnrValue.toFixed(2) + " dB",
            norm: psnrNorm,
          },
          {
            name: "SSIM",
            value: ssimValue.toFixed(3),
            norm: ssimValue,
          },
          {
            name: "A-FINE",
            value: afineValue.toFixed(3),
            norm: afineValue,
            accent: true,
          },
        ].map((m) => (
          <div
            key={m.name}
            className="grid items-baseline gap-3"
            style={{ gridTemplateColumns: "5rem 1fr 5rem" }}
          >
            <span className="text-zinc-500">{m.name}</span>
            <span
              className="whitespace-pre"
              style={{
                color: m.accent
                  ? "var(--accent-purple)"
                  : "rgb(212,212,216)",
              }}
            >
              {bar(m.norm)}
            </span>
            <span className="text-right text-zinc-300">{m.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-1">
        <div className="flex items-center justify-between text-[0.75rem] text-zinc-500">
          <span>
            {distortion === "translation" ? "shift direction" : "distortion strength"}
          </span>
          <span className="font-mono text-zinc-300">{t.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={0.01}
          value={t}
          onChange={(e) => setT(parseFloat(e.target.value))}
          className="w-full"
          style={{ accentColor: "var(--accent-purple)" }}
          aria-label={
            distortion === "translation"
              ? "Shift direction — negative shifts left, positive shifts right"
              : "Distortion strength"
          }
        />
        <div className="flex justify-between text-[0.65rem] text-zinc-600">
          {distortion === "translation" ? (
            <>
              <span>← shift left</span>
              <span>centre</span>
              <span>shift right →</span>
            </>
          ) : (
            <>
              <span>none</span>
              <span>maximum</span>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 border-t border-zinc-700/60 pt-2 text-[0.75rem] text-zinc-400">
        {VERDICTS[distortion]}
      </div>
    </AnsiBox>
  );
}
