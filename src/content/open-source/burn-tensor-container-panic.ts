import type { Contribution } from "@/types";

export const burnTensorContainerPanic: Contribution = {
  title:
    "TensorContainer / Grad.get panic fix — closes two issues with one change",
  project: "tracel-ai/burn",
  date: "May 2026 — scoping",
  fields: ["Open Source Engineer"],
  status: "open",
  links: {
    pr: "https://github.com/tracel-ai/burn/issues/3969",
    repo: "https://github.com/tracel-ai/burn",
  },
  description: [
    "Engaging on a duplicate-bug pair filed 8 months apart — issue #2924 (Mar 2025) and issue #3969 (Nov 2025) both report the same panic: `Grad.get` unwraps internally instead of returning `Option`, so a missing gradient panics rather than letting the caller branch on absence",
    "Posted scoping comment on #3969 2026-05-10 surfacing the previously-unanswered design question that stalled VirtualNonsense's PR #2965 — Result-API vs Backend-generic split",
    "Awaiting maintainer direction on the API shape; one fix lands cleanly into both issues since the underlying defect is shared",
  ],
  techStack: "Rust, Burn, autodiff backend",
  technicalDetails: [
    "Root cause shared between #2924 and #3969: `Grad.get` calls `.unwrap()` on an internal Option that's reachable as `None` for valid inputs (modules whose parameters didn't participate in the autodiff pass) — the panic is observable from any caller using the documented public API",
    "Two API directions on the table: (a) Result-API — `Grad.get` returns `Result<Tensor, GradError>` so callers explicitly handle absence; (b) Backend-generic — push the fix down into the autodiff backend so `None` returns naturally upward. Both fix the panic; trade-off is between ergonomic call-sites and consistent backend semantics",
    "VirtualNonsense's PR #2965 stalled on exactly this question — the maintainer never confirmed which direction to take, so the PR went stale. Re-engaging the question is the unblocking move, not the fix itself",
    "Once the direction lands, the implementation is small (~50-100 LOC across the autodiff backend + the public Module API surface) — the gating constraint is policy, not implementation difficulty",
  ],
};
