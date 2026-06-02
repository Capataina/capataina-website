"use client";

import { AnsiBox } from "./AnsiBox";

export interface FileLocRow {
  path: string;
  loc: number;
  role: string;
}

interface FileLocBarsProps {
  files: FileLocRow[];
  /** Total LOC for the proportion bars; defaults to sum-of-files. */
  total?: number;
  label?: string;
}

const BLOCK_FULL = "█";
const BLOCK_LIGHT = "░";
const TRACK_WIDTH = 24;

/**
 * Vertical list of files with horizontal block-bar LOC visualisation.
 * Bars use block characters so they sit inside the same monospace cell
 * grid as the file path — the whole widget reads like a tree diff
 * summary in a terminal.
 */
export function FileLocBars({ files, total, label = "FILE BREAKDOWN" }: FileLocBarsProps) {
  const sum = total ?? files.reduce((acc, f) => acc + f.loc, 0);
  const maxLoc = Math.max(...files.map((f) => f.loc), 1);

  return (
    <AnsiBox label={label} meta={`${files.length} files · ${sum.toLocaleString()} LOC`}>
      <div className="space-y-1">
        {files.map((file) => {
          const ratio = file.loc / maxLoc;
          const filled = Math.max(1, Math.round(ratio * TRACK_WIDTH));
          const bar =
            BLOCK_FULL.repeat(filled) + BLOCK_LIGHT.repeat(TRACK_WIDTH - filled);
          const pct = ((file.loc / sum) * 100).toFixed(1);
          return (
            <div
              key={file.path}
              className="group grid items-baseline gap-3 rounded px-2 py-1 transition-colors hover:bg-white/[0.03]"
              style={{ gridTemplateColumns: "minmax(0,1fr) auto auto auto" }}
            >
              <span className="truncate text-zinc-300">{file.path}</span>
              <span className="text-zinc-600 group-hover:text-zinc-500">
                {bar}
              </span>
              <span className="w-12 text-right text-zinc-400">{file.loc}</span>
              <span className="w-12 text-right text-zinc-600">{pct}%</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 border-t border-zinc-700/60 pt-2 text-[0.75rem] text-zinc-500">
        {files
          .slice()
          .sort((a, b) => b.loc - a.loc)
          .slice(0, 3)
          .map((f, i) => (
            <span key={f.path}>
              {i > 0 && <span className="mx-2 text-zinc-700">·</span>}
              <span className="text-zinc-400">{f.path.split("/").pop()}</span>{" "}
              <span className="text-zinc-600">{f.role}</span>
            </span>
          ))}
      </div>
    </AnsiBox>
  );
}
