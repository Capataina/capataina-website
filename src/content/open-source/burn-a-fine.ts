import type { Contribution } from "@/types";

export const burnAFine: Contribution = {
  title: "A-FINE no-reference image-quality metric",
  project: "tracel-ai/burn",
  date: "April 2026",
  fields: ["Open Source Engineer"],
  status: "open",
  links: {
    pr: "https://github.com/tracel-ai/burn/pull/4894",
    repo: "https://github.com/tracel-ai/burn",
  },
  description: [
    "Implemented A-FINE, a no-reference perceptual image-quality metric, as a first-class component of Burn — Rust's native deep-learning framework",
    "Inlined a full CLIP ViT backbone with a from-scratch PyTorch-weight loader so the metric runs end-to-end inside Burn without external Python dependencies",
    "Refactored the existing CLIP forward pass to expose CLS-token features as a reusable extraction surface, unblocking future feature-based metrics in the framework",
  ],
  techStack: "Rust, Burn, CLIP ViT, PyTorch weight loading",
  technicalDetails: [
    "Five evaluator heads — technical quality, structural fidelity, aesthetic, authenticity, and overall — each with their own learned projection layer over the CLIP CLS-token",
    "End-to-end regression suite verifying numerical equivalence with the original reference implementation across canonical test images",
    "`forward_with_features` refactor preserves CLS-token output as a stable public feature-extraction API for downstream Burn metrics, not just A-FINE",
    "PyTorch weight loader handles the layer-name mapping, tensor reshaping, and dtype coercion required to deserialise reference checkpoints into Burn's tensor format",
  ],
  metrics: {
    linesOfCode: 1864,
    filesChanged: 10,
  },
};
