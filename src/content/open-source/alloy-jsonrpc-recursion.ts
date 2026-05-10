import type { Contribution } from "@/types";

export const alloyJsonRpcRecursion: Contribution = {
  title: "JSON-RPC recursion-limit deserialisation fix",
  project: "alloy-rs/alloy",
  date: "May 2026 — queued",
  fields: ["Open Source Engineer"],
  status: "open",
  links: {
    pr: "https://github.com/alloy-rs/alloy/issues/1156",
    repo: "https://github.com/alloy-rs/alloy",
  },
  description: [
    "Engaged on a 14-month-stale Alloy bug — JSON-RPC deserialisation hits serde_json's default recursion limit on deeply-nested response shapes, causing the Ethereum RPC client to error before the response is parsed",
    "Interest comment posted 2026-05-10 picking up the original volunteer's abandoned thread — DaniPopes (maintainer) had already endorsed an in-tree fix; ~30-LOC patch already drafted in-thread by another contributor",
    "Direct stack overlap with Aurix's hand-crafted JSON-RPC + ABI-encoding work — exactly the kind of contribution where production usage in the personal-project layer surfaces a bug worth fixing upstream",
  ],
  techStack: "Rust, Alloy, serde_json",
  technicalDetails: [
    "Root cause is serde_json's StackOverflowError on default 128-level recursion when deserialising deeply-nested Result-shape JSON-RPC responses — common with debug_traceTransaction over long contract call chains",
    "Fix lifts the recursion-limit ceiling on Alloy's RPC deserialiser surface, configured via a builder method so callers who want the strict default can keep it",
    "Coordinating with joneskm (the original 14-month-silent volunteer) before opening the PR — the stale-claim etiquette matters more than the few-day delay",
  ],
};
