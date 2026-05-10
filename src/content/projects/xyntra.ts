import type { Project } from "@/types";

export const xyntra: Project = {
  title: "Xyntra — ML graph fusion compiler with WGSL/PTX codegen",
  date: "2024 – present",
  fields: [
    "Applied AI & ML Infrastructure Engineer",
    "Systems & Infrastructure Engineer",
  ],
  links: {
    github: "https://github.com/Capataina/Xyntra",
  },
  description: [
    "ML graph-fusion compiler pass using e-graph rewriting to identify kernel-fusion opportunities and emit optimised WGSL or PTX kernels for ONNX and TorchScript models",
    "Targets an inference path that bypasses general-purpose graph executors — same forward pass, fewer kernel launches, fewer memory round-trips",
    "Currently a typed IR + stub validator with the e-graph rewriting and WGSL/PTX backends as the next two milestones",
  ],
  techStack: "Rust, ONNX, e-graphs, WGSL, PTX",
  technicalDetails: [
    "Type-safe IR — NodeID, TensorShape, OpKind primitives — every node in the graph is a typed enum that surfaces shape/op mismatches at compile time, not at the codegen step",
    "Validation framework with cycle detection, shape-compatibility propagation, and operation-constraint checks; the IR refuses to lower a graph that violates any structural invariant",
    "E-graph rewriting layer for pattern-matching fusion opportunities — equivalent fragments share an e-class, so non-local rewrites become local pattern matches over the e-class graph",
    "Planned WGSL + PTX backends with autotuned tile sizes — fused kernels emitted directly, bypassing the general-purpose ONNX runtime executor for the inference path",
  ],
};
