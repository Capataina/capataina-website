import type { Skill } from "@/types";

export const desktopDevelopment: Skill = {
  name: "Local-First Desktop Applications",
  fields: [
    "Systems & Infrastructure Engineer",
    "Applied AI & ML Infrastructure Engineer",
  ],
  subskills: [
    "Tauri 2",
    "Rust Backend",
    "React Frontend",
    "Typed IPC",
    "SQLite (WAL mode)",
    "ONNX Runtime",
    "Asset Protocol",
  ],
  bulletPoints: [
    "Local-first Tauri 2 desktop applications shipping production-grade features — Image Browser (3-encoder semantic search) and Aurix (DeFi analytics platform) both built on the same Rust + React + SQLite + Tauri stack",
    "Typed IPC envelopes — every Tauri command returns a tagged-union Result so frontend handlers exhaustively cover success / known-error / unknown-error cases instead of relying on stringly-typed errors",
    "WAL-mode SQLite as the embedded database — concurrent reads from the UI never block the background indexer, and indexers survive mid-scan crashes via per-file commit checkpoints",
    "ONNX Runtime for embedded ML inference — CLIP, DINOv2, SigLIP-2 all run locally without cloud dependencies; embeddings normalised + cosine-similarity computed in Rust against the SQLite-backed embedding store",
    "Privacy-preserving by construction — no telemetry, no external services, no remote calls during normal operation; the local-first stance is a design choice, not a marketing line",
  ],
};
