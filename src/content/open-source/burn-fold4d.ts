import type { Contribution } from "@/types";

export const burnFold4d: Contribution = {
  title: "fold4d (Col2Im) operator — inverse of unfold4d",
  project: "tracel-ai/burn",
  date: "May 2026 — queued",
  fields: ["Open Source Engineer"],
  status: "open",
  links: {
    pr: "https://github.com/tracel-ai/burn/issues/4519",
    repo: "https://github.com/tracel-ai/burn",
  },
  description: [
    "Informally claimed via maintainer 👍 on 2026-05-10 — adding the fold4d (Col2Im) operator as a first-class Burn primitive, completing the unfold/fold pair the framework currently exposes only one half of",
    "Implementation queued behind the active A-FINE PR review; planned ~460 LOC across 11 files following Burn's autodiff op convention",
    "Backward pass is free — fold4d decomposes into already-differentiable Burn primitives, so the reverse-mode contribution drops out of the forward implementation without manual gradient code",
  ],
  techStack: "Rust, Burn, ONNX Col2Im-18",
  technicalDetails: [
    "Specification anchored to ONNX Col2Im opset 18 — the same semantics PyTorch's nn.Fold and TensorFlow's tf.image.extract_patches inverse follow, so existing model weights port cleanly",
    "Added as an inverse of Burn's existing unfold4d: shape-equivalent on round-trip (`fold4d(unfold4d(x)) == x` modulo overlap-add accumulation) — the reproducer for the round-trip identity was the first test written",
    "Targets the same surface area as PR #4894 (burn-store + burn-import-onnx) — keeps the contribution arc inside one familiar code region rather than spreading across the whole framework",
  ],
};
