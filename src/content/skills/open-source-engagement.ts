import type { Skill } from "@/types";

export const openSourceEngagement: Skill = {
  name: "Open Source Engagement",
  fields: ["Open Source Engineer"],
  subskills: [
    "Issue Triage",
    "Repro Isolation",
    "Build from Source",
    "Patch Scoping",
    "PR Etiquette",
    "Maintainer Engagement",
    "Long-Lived Releases",
    "Bug-Fix-with-Regression-Test",
  ],
  bulletPoints: [
    "Active contributor across the Rust ML ecosystem — Burn (PR #4894 ablation regression for `fine`, issue #4519 fold4d Col2Im operator, dual-issue tensor-container panic fix collapsing #3969 + #2924), Alloy (JSON-RPC recursion-limit fix in queue), tinygrad (PR #16119 minimal ONNX LSTM operator landing live)",
    "Single-fix-multiple-issue pattern — the Burn tensor-container panic patch closes two separate panic reports (#3969 and #2924) by tracing both back to one root cause and shipping the regression test that gates both at once",
    "Build-from-source contribution loop — local clone, reproduce against `main`, isolate the minimal patch, write the regression test, push a focused diff with a maintainer-readable description; favouring small surgical changes over sprawling rewrites the maintainer will close",
    "Long-lived game-mod releases on Nexus / Steam Workshop / SPT-AKI / tModLoader / CurseForge — 18+ mods across RimWorld + Minecraft + Terraria + Escape from Tarkov, 150,000+ aggregate downloads with sustained user feedback and bug-fix releases over years",
    "Per-project communication layer (Capataina/OpenSourceContributions umbrella repo) capturing repo-specific conventions — comms templates, issue-search heuristics, maintainer reply windows — so the next contribution costs less context-switch than the previous one",
    "Issue triage as input signal — reading existing issue threads to understand which fixes the maintainers actually want vs which would be rejected on scope, then choosing the patch that lands cleanly",
  ],
};
