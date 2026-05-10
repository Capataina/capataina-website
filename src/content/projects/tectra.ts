import type { Project } from "@/types";

export const tectra: Project = {
  title: "Tectra — Production-shape trading infrastructure scaffold in C++",
  date: "2024 – present",
  fields: [
    "Low Level Financial Systems Engineer",
    "Systems & Infrastructure Engineer",
  ],
  links: {
    github: "https://github.com/Capataina/Tectra",
  },
  description: [
    "Production-style trading infrastructure scaffold combining a market-data feed handler, a pre-trade risk engine, a strategy execution framework, a backtesting engine, and a deterministic replay system in C++",
    "Targets the architectural shape of real exchange-connected trading systems — dual-plane design with a binary fast path for sub-microsecond decision making and a structured control plane for management",
    "Designed around the constraint that a strategy that passes backtest must be bit-identical when replayed on the same historical session — replay determinism is the load-bearing test discipline",
  ],
  techStack: "C++, FlatBuffers, Prometheus, ITCH",
  technicalDetails: [
    "ITCH decoder with zero-copy parsing, gap detection, and L2 book reconstruction — every message is interpreted in place against the wire layout, no per-message allocations on the hot path",
    "Hot-reloadable risk rules — price bands, size limits, throttles all live in a config layer the engine reloads atomically without dropping market data, so risk policy changes never require downtime",
    "Append-only checksummed journals — every order, every fill, every market-data event is durably logged with end-to-end checksums, supporting post-incident root-cause analysis without ambiguity",
    "Dual-plane architecture: binary fast path for low-latency decisions, structured control plane for management — the two planes share data structures via FlatBuffers schemas so debugging tools can read the fast-path state without slowing it down",
  ],
};
