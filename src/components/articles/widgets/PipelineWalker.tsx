"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { AnsiBox } from "./AnsiBox";

export interface PipelineStage {
  /** Short id like "patch", "vit", "fidelity". When the id matches a
   *  known visualization key, the viz renders inside the detail panel. */
  id: string;
  /** Display label. */
  label: string;
  /** Tensor shape after this stage. */
  shape: string;
  /** Expanded prose detail rendered below the stepper. */
  detail: string;
}

interface PipelineWalkerProps {
  stages: PipelineStage[];
  label?: string;
}

const SHADES = ["░", "▒", "▓"];

function texture(seed: number, length: number): string[] {
  const out: string[] = [];
  let x = seed;
  for (let i = 0; i < length; i += 1) {
    x = (x * 1664525 + 1013904223) >>> 0;
    out.push(SHADES[x % SHADES.length]);
  }
  return out;
}

/**
 * Centred ASCII-art container with a soft `breathing` opacity. Every
 * viz uses this — the breathing gives the static drawings a gentle
 * pulse so the panel never feels frozen.
 */
function VizFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-center">
      <motion.div
        initial={{ opacity: 0.85 }}
        animate={{ opacity: [0.88, 1, 0.88] }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="inline-block"
      >
        {children}
      </motion.div>
    </div>
  );
}

function VizPre({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <pre
      className="whitespace-pre text-center font-mono text-[0.78rem] leading-[1.3] text-zinc-300"
      style={style}
    >
      {children}
    </pre>
  );
}

/** Subtle randomised-cell flicker used by the input viz. Picks a small
 *  handful of (row, col) coordinates to swap with a different shade every
 *  ~700ms, then swaps them back so the donut/image silhouettes survive. */
function useFlicker(rows: number, cols: number, count = 3) {
  const [bumps, setBumps] = useState<Map<string, number>>(new Map());
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const intervalId = setInterval(() => {
      const next = new Map<string, number>();
      for (let i = 0; i < count; i += 1) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        next.set(`${r},${c}`, Math.floor(Math.random() * SHADES.length));
      }
      setBumps(next);
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setBumps(new Map()), 220);
    }, 700);
    return () => {
      clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [rows, cols, count]);
  return bumps;
}

function InputViz() {
  const ROWS = 6;
  const COLS = 18;
  const dist = useMemo(
    () => Array.from({ length: ROWS }, (_, r) => texture(7 + r * 31, COLS)),
    []
  );
  const ref = useMemo(
    () => Array.from({ length: ROWS }, (_, r) => texture(11 + r * 31, COLS)),
    []
  );
  const distBumps = useFlicker(ROWS, COLS, 2);
  const refBumps = useFlicker(ROWS, COLS, 2);

  const renderRow = (
    row: string[],
    rowIdx: number,
    bumps: Map<string, number>
  ) =>
    row
      .map((char, colIdx) => {
        const bump = bumps.get(`${rowIdx},${colIdx}`);
        return bump !== undefined ? SHADES[bump] : char;
      })
      .join("");

  return (
    <VizFrame>
      <VizPre>
        {"distorted              reference\n"}
        {"┌──────────────────┐   ┌──────────────────┐\n"}
        {dist
          .map(
            (row, i) =>
              `│${renderRow(row, i, distBumps)}│   │${renderRow(
                ref[i],
                i,
                refBumps
              )}│`
          )
          .join("\n")}
        {"\n└──────────────────┘   └──────────────────┘\n"}
        {"    224 × 224 × 3            224 × 224 × 3"}
      </VizPre>
    </VizFrame>
  );
}

function PatchViz() {
  return (
    <VizFrame>
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <VizPre>
          {"14 × 14 = 196 patches  (showing 7 × 7)\n\n"}
          {"┌──┬──┬──┬──┬──┬──┬──┐\n"}
          {[0, 2, 4, 1, 3, 5, 2].map((seed, idx, arr) => {
            const cells: string[] = [];
            for (let i = 0; i < 7; i += 1) {
              cells.push(`│${SHADES[(seed + i) % SHADES.length].repeat(2)}`);
            }
            const row = cells.join("") + "│";
            return (
              <span key={idx}>
                {row}
                {"\n"}
                {idx < arr.length - 1 ? "├──┼──┼──┼──┼──┼──┼──┤\n" : ""}
              </span>
            );
          })}
          {"└──┴──┴──┴──┴──┴──┴──┘\n\n"}
          {"each 16×16 patch → 768-dim embedding"}
        </VizPre>
      </motion.div>
    </VizFrame>
  );
}

function PosEmbedViz() {
  // Continuously-shifting sparkline rows — positional encodings really
  // are wave-shaped, and the shifting communicates that.
  const bars = "▁▂▃▄▅▆▇█▇▆▅▄▃▂▁";
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 140);
    return () => clearInterval(id);
  }, []);
  const rowFor = (offset: number) =>
    Array.from(
      { length: 30 },
      (_, i) => bars[(i + offset + tick) % bars.length]
    ).join("");
  return (
    <VizFrame>
      <VizPre>
        {"positional encoding (one bar = one patch token)\n\n"}
        {`dim 0   ${rowFor(0)}\n`}
        {`dim 1   ${rowFor(3)}\n`}
        {`dim 2   ${rowFor(6)}\n`}
        {`dim 3   ${rowFor(9)}\n`}
        {`dim 4   ${rowFor(12)}\n\n`}
        {"each token's vector gets added to its patch embedding"}
      </VizPre>
    </VizFrame>
  );
}

function VitViz() {
  // Attention pattern with a slowly-breathing brightness so it feels
  // alive without redrawing the structure.
  const SIZE = 18;
  const lines = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < SIZE; i += 1) {
      const cells: string[] = [];
      for (let j = 0; j < SIZE; j += 1) {
        const distance = Math.abs(i - j);
        const clsBoost = i === 0 || j === 0 ? 1.4 : 0;
        const intensity = Math.max(0, 3 - distance) + clsBoost;
        const idx = Math.min(3, Math.max(0, Math.floor(intensity)));
        cells.push([" ", "░", "▒", "▓"][idx] ?? " ");
      }
      out.push(cells.join(""));
    }
    return out;
  }, []);
  return (
    <VizFrame>
      <motion.div
        animate={{ opacity: [0.78, 1, 0.78] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <VizPre>
          {"self-attention pattern (one of 12 heads × 12 blocks)\n\n"}
          {lines.map((l, i) => (
            <span key={i}>{l + "\n"}</span>
          ))}
          {"\nbright diagonal = local context\n"}
          {"bright row 0 = CLS token attends globally"}
        </VizPre>
      </motion.div>
    </VizFrame>
  );
}

/** Fills a `█` bar from 0 to the target percentage on mount; idles
 *  afterwards. */
function FillBar({ pct, width = 10 }: { pct: number; width?: number }) {
  const [filled, setFilled] = useState(0);
  useEffect(() => {
    const target = Math.round(pct * width);
    let current = 0;
    const id = setInterval(() => {
      current += 1;
      setFilled(Math.min(target, current));
      if (current >= target) clearInterval(id);
    }, 35);
    return () => clearInterval(id);
  }, [pct, width]);
  return (
    <span>
      {"█".repeat(filled)}
      {"░".repeat(Math.max(0, width - filled))}
    </span>
  );
}

function FidelityViz() {
  return (
    <VizFrame>
      <VizPre>
        {"distorted feats   ▓▒▓░▒▓░▒░▓▓░▒▓▒░▓▒░▒\n"}
        {"reference feats   ▓▒▓░▒▓▒▒░▓▓░░▓▒░▓▒░▒\n"}
        {"                  ─── SSIM-style ───\n\n"}
        <span>
          {"mean match     "}
          <FillBar pct={0.82} />
          {"    0.82\n"}
        </span>
        <span>
          {"var match      "}
          <FillBar pct={0.71} />
          {"    0.71\n"}
        </span>
        <span>
          {"covariance     "}
          <FillBar pct={0.91} />
          {"    0.91\n"}
        </span>
        {"               ─────────────────\n"}
        <span>
          {"fidelity       "}
          <FillBar pct={0.836} />
          {"    "}
          <span style={{ color: "var(--accent-purple)" }}>0.836</span>
        </span>
      </VizPre>
    </VizFrame>
  );
}

function NaturalnessViz() {
  return (
    <VizFrame>
      <VizPre>
        <span>
          {"distorted CLS → MLP →   "}
          <FillBar pct={0.71} />
          {"   s_nat_d = 0.71\n\n"}
        </span>
        <span>
          {"reference CLS → MLP →   "}
          <FillBar pct={0.85} />
          {"   s_nat_r = 0.85\n\n"}
        </span>
        {"each image scored independently; no cross-comparison.\n"}
        {"this is the part that lets A-FINE notice a bad reference."}
      </VizPre>
    </VizFrame>
  );
}

function CalibratorViz() {
  return (
    <VizFrame>
      <motion.div
        animate={{ scale: [1, 1.015, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <VizPre>
          {"calibrated = σ(β₁·x + β₂) · β₃ + β₄\n\n"}
          {"1.0 ┤                              ──────────\n"}
          {"    │                       ──────\n"}
          {"    │                  ────\n"}
          {"0.5 ┤              ──\n"}
          {"    │           ──\n"}
          {"    │       ────\n"}
          {"0.0 ┤──────                                  \n"}
          {"    └─────────────────────────────────\n"}
          {"     -3       -1        1         3\n\n"}
          {"5 β params trained jointly with the adapter"}
        </VizPre>
      </motion.div>
    </VizFrame>
  );
}

function AdapterViz() {
  return (
    <VizFrame>
      <VizPre>
        {"fidelity        0.84 ─┐\n"}
        {"                       │\n"}
        {"s_nat_d         0.71 ─┼── adaptive blend ──▶  "}
        <span style={{ color: "var(--accent-purple)" }}>A-FINE 0.79</span>
        {"\n                       │\n"}
        {"s_nat_r         0.85 ─┘\n\n"}
        <span>
          {"ref naturalness high  →  trust fidelity     "}
          <FillBar pct={0.7} />
          {"\n"}
        </span>
        <span>
          {"ref naturalness low   →  trust naturalness  "}
          <FillBar pct={0.3} />
          {"\n"}
        </span>
        <span>
          {"current weighting                            "}
          <span style={{ color: "var(--accent-purple)" }}>
            <FillBar pct={0.7} />
          </span>
        </span>
      </VizPre>
    </VizFrame>
  );
}

const VIZ_REGISTRY: Record<string, () => ReactNode> = {
  input: InputViz,
  patch: PatchViz,
  pos: PosEmbedViz,
  vit: VitViz,
  fidelity: FidelityViz,
  naturalness: NaturalnessViz,
  calibrator: CalibratorViz,
  adapter: AdapterViz,
};

export function PipelineWalker({
  stages,
  label = "FORWARD PASS",
}: PipelineWalkerProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = stages[activeIdx];
  const VizComponent = VIZ_REGISTRY[active.id];

  return (
    <AnsiBox label={label} meta={`${stages.length} stages`}>
      <div className="overflow-x-auto">
        <div className="flex min-w-full items-stretch gap-0">
          {stages.map((stage, idx) => {
            const isActive = idx === activeIdx;
            const isLast = idx === stages.length - 1;
            return (
              <div key={stage.id} className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className="flex flex-col items-center gap-1 rounded px-3 py-2 text-left transition-colors hover:bg-white/[0.04]"
                  aria-label={`Stage ${idx + 1}: ${stage.label}`}
                >
                  <span
                    className="text-base"
                    style={{
                      color: isActive
                        ? "var(--accent-purple)"
                        : "rgb(113,113,122)",
                    }}
                  >
                    {isActive ? "●" : "○"}
                  </span>
                  <span
                    className="text-[0.75rem]"
                    style={{
                      color: isActive
                        ? "var(--accent-purple)"
                        : "rgb(212,212,216)",
                    }}
                  >
                    {stage.label}
                  </span>
                  <span className="text-[0.65rem] text-zinc-600">
                    {stage.shape}
                  </span>
                </button>
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="self-center text-zinc-700"
                  >
                    →
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 border-t border-zinc-700/60 pt-3">
        <div className="flex items-baseline justify-between gap-3 text-[0.75rem] text-zinc-500">
          <span>
            <span style={{ color: "var(--accent-purple)" }}>
              {active.label}
            </span>
            <span className="mx-2 text-zinc-700">·</span>
            <span className="text-zinc-400">{active.shape}</span>
          </span>
          <span className="text-zinc-600">
            [{activeIdx + 1}/{stages.length}]
          </span>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.985 }}
            transition={{
              duration: 0.32,
              ease: [0.16, 1, 0.3, 1],
              opacity: { duration: 0.22 },
            }}
            className="space-y-3"
          >
            {VizComponent && (
              <div
                className="mt-3 rounded border border-zinc-800/80 px-4 py-4"
                style={{ background: "hsla(285, 8%, 11%, 0.6)" }}
              >
                <VizComponent />
              </div>
            )}
            <p className="text-[0.85rem] leading-relaxed text-zinc-200">
              {active.detail}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </AnsiBox>
  );
}
