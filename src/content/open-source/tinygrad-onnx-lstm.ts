import type { Contribution } from "@/types";

export const tinygradOnnxLstm: Contribution = {
  title: "ONNX LSTM operator (minimal, supports Silero VAD v5)",
  project: "tinygrad/tinygrad",
  date: "May 2026",
  fields: ["Open Source Engineer"],
  status: "open",
  links: {
    pr: "https://github.com/tinygrad/tinygrad/pull/16119",
    repo: "https://github.com/tinygrad/tinygrad",
  },
  description: [
    "Implemented a minimal ONNX LSTM operator inside tinygrad's ONNX backend, scoped to exactly what Silero VAD v5 needs — forward direction, default activations — at +14 tokenised lines",
    "Resurrection of an earlier broader implementation (PR #15453) that was closed on line-budget policy; the lesson was to ship the smallest version that closes a real upstream issue, not the comprehensive one",
    "Closes upstream issue #10897 (Silero VAD support); awaiting maintainer review",
  ],
  techStack: "Python, tinygrad, ONNX",
  technicalDetails: [
    "Forward-direction only — bidirectional and reverse paths deferred until a downstream model genuinely needs them, keeping the line-count inside tinygrad's strict per-file budget",
    "Default activations (sigmoid for gates, tanh for cell) — the activation parameter is wired but not generalised, mirroring the policy that surface area should follow demand, not anticipated demand",
    "End-to-end Silero VAD parity test: outputs match onnxruntime within float precision on canonical voice-activity fixtures",
  ],
  metrics: {
    linesOfCode: 23,
    filesChanged: 2,
  },
};
