import type { Contribution } from "@/types";

export const tinygradOnnxLstm: Contribution = {
  title: "ONNX LSTM operator (forward, reverse, bidirectional)",
  project: "tinygrad/tinygrad",
  date: "March 2026",
  fields: ["Open Source Engineer"],
  status: "closed",
  links: {
    pr: "https://github.com/tinygrad/tinygrad/pull/15453",
    repo: "https://github.com/tinygrad/tinygrad",
  },
  description: [
    "Implemented the ONNX LSTM operator inside tinygrad's ONNX backend, supporting forward, reverse, and bidirectional directions per the ONNX spec",
    "Followed tinygrad's existing ONNX-backend conventions for shape handling, weight reshaping, and gate ordering so the implementation slotted in alongside existing recurrent ops",
    "Closed on line-count policy — kept the entry on the portfolio because the implementation work is real even though it didn't merge",
  ],
  techStack: "Python, tinygrad, ONNX",
  technicalDetails: [
    "Direction parameter dispatched to forward / reverse / bidirectional code paths sharing a common gate-computation kernel",
    "Weight tensor reshaping from ONNX's IFGO (input/forget/cell/output) layout into the per-direction stacked form tinygrad expects internally",
    "End-to-end regression suite comparing outputs against ONNX Runtime on canonical sequence-classification fixtures, covering both stateful and stateless LSTM modes",
  ],
  metrics: {
    linesOfCode: 146,
    filesChanged: 2,
  },
};
