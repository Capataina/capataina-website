import type { Article } from "@/types";
import Body from "./burn-afine-pr.mdx";

export const burnAfinePr: Article = {
  slug: "burn-afine-pr",
  title:
    "A-FINE for Burn: shipping a CVPR 2025 image-quality metric into a Rust ML framework",
  type: "Dev Log",
  date: "2026-05-11",
  project: "Burn (OSS)",
  description:
    "PR #4894 to tracel-ai/burn shipped A-FINE — a CVPR 2025 adaptive image-quality metric — into the Rust ML framework. 1,864 lines, 10 files, an inlined CLIP Vision Transformer, two assessment heads, a 5-parameter calibrator, and an asymmetric adapter that relaxes the perfect-reference assumption. Merged 9 days after the PR opened. The full walk through the design calls, the maintainer conversation, the implementation traps, and the math.",
  tags: [
    "rust",
    "burn",
    "open-source",
    "machine-learning",
    "computer-vision",
    "clip",
    "image-quality",
  ],
  body: Body,
};
