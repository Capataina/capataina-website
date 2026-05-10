import type { Project } from "@/types";

export const imageBrowser: Project = {
  title:
    "Image Browser — Local-first Pinterest-style image manager with 3-encoder semantic search",
  date: "2024 – present",
  fields: [
    "Applied AI & ML Infrastructure Engineer",
    "Systems & Infrastructure Engineer",
  ],
  links: {
    github: "https://github.com/Capataina/PinterestStyleImageBrowser",
  },
  description: [
    "Local-first Pinterest-style image manager built around a 3-encoder semantic-search ensemble (CLIP + DINOv2 + SigLIP-2) combined via Reciprocal Rank Fusion — natural-language queries, visual-similarity search, and tag-based browsing all over the same index",
    "WAL-mode SQLite background indexing handles concurrent reads while new images are being scanned; typed IPC envelopes between the Tauri 2 backend and the React frontend make every error path explicit",
    "Fully offline, privacy-preserving by design — no cloud dependencies, no telemetry, no external services; every embedding is computed locally via ONNX Runtime",
  ],
  techStack:
    "Rust, Tauri 2, React, TypeScript, SQLite, ONNX Runtime, CLIP, DINOv2, SigLIP-2",
  technicalDetails: [
    "Reciprocal Rank Fusion across the three encoders — each encoder ranks results independently, the RRF score combines them with a tunable rank-weighting constant; the ensemble is more robust than any single encoder alone",
    "Recursive filesystem scanner with WAL-mode SQLite — concurrent reads from the UI never block the background indexer, and the indexer survives mid-scan crashes via per-file commit checkpoints",
    "Typed IPC error envelopes — every Tauri command returns a tagged-union Result type so frontend handlers exhaustively cover success / known-error / unknown-error cases",
    "Embeddings normalised + cosine-similarity computed in Rust against the SQLite-backed embedding store; visual-similarity search reuses the same pipeline as text-query search by encoding a reference image instead of a query string",
  ],
};
