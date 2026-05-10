import type { Skill } from "@/types";

export const compilerGPU: Skill = {
  name: "Compilers & GPU",
  fields: [
    "Applied AI & ML Infrastructure Engineer",
    "Systems & Infrastructure Engineer",
  ],
  subskills: [
    "Typed IR Design",
    "E-graph Rewriting",
    "WGSL",
    "PTX",
    "ONNX",
    "TorchScript",
    "Kernel Fusion",
    "Autotuning",
  ],
  bulletPoints: [
    "ML graph-fusion compiler pass (Xyntra) using e-graph rewriting to identify kernel-fusion opportunities and emit optimised WGSL or PTX kernels for ONNX and TorchScript models",
    "Type-safe IR design — NodeID, TensorShape, OpKind primitives surface shape/op mismatches at compile time, not at the codegen step",
    "E-graph rewriting layer where equivalent fragments share an e-class, so non-local rewrites become local pattern matches over the e-class graph",
    "Cross-platform GPU codegen targeting WGSL (browser/wgpu) and PTX (NVIDIA) backends with autotuned tile sizes and fused kernels",
    "Practical GPU-side performance work informs the compiler decisions — when to fuse, when to split, when an autotune is worth the search cost",
  ],
};
