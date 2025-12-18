export const xyntra = {
  title: "Xyntra — ML Graph Fusion Compiler Pass",
  date: "2025 (In Progress)",
  fields: ["AI Engineering", "Systems Engineering"],
  links: {
    github: "https://github.com/Capataina/Xyntra",
  },
  description: [
    "Designing compiler pass for ONNX and TorchScript graph fusion to reduce GPU overhead",
    "Uses e-graph rewriting to identify kernel fusion opportunities automatically",
    "Plans WGSL and PTX code generation backends with autotuned tile sizes",
  ],
  technicalDetails: [
    "Type-safe IR with NodeID, TensorShape, OpKind primitives, and graph representation",
    "Validation framework with cycle detection, shape compatibility, and operation constraints",
    "E-graph rewriting for pattern matching and fusion legality analysis",
    "GPU code generation for fused kernels targeting WGSL and PTX (early foundation stage)",
  ],
};
