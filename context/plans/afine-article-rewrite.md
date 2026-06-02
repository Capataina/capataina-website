# A-FINE article rewrite — scoping & research

> Source of truth doc for the rewrite of `src/content/articles/open-source/burn-afine-pr.ts` into a publication-grade LinkedIn-ready engineering writeup.
>
> Scope: research consolidation, factual-correction ledger, gap analysis, section plan, widget proposals. **No implementation in this pass.**

---

## 1. What this article needs to become

The current article (~2,700 words, ~10 min) reads like a personal dev log written before the PR landed. It now needs to become **a citable engineering writeup of a merged contribution to a serious Rust ML framework**, suitable as Caner's first LinkedIn publication.

Target shape:

| Axis | Current | Target |
|---|---|---|
| Length | ~2,700 words | 5,500–7,500 words |
| Read time | ~10 min | 20–30 min |
| Voice | Dev log, slightly apologetic, "approaching three weeks of review time" | Confident engineering writeup, "merged in 9 days from PR open" |
| Framing | "what I built" | "what was built and why each decision was right" |
| Factual accuracy | Multiple errors (acronym, paper title, review timeline, file paths, status) | Every claim verifiable against PR diff + paper + maintainer reviews |
| Math content | None — only mentions "4-layer MLP head" | Real formulas: fidelity ratio in feature space, logistic calibrator, adapter blend |
| Code excerpts | Pseudocode invented for the article | Real excerpts from the merged PR |
| Visual content | Tables + ASCII pipeline diagram | Add: timeline, file-LOC bar chart, math callouts, maintainer quotes, optional interactive widgets |
| Audience signal | "I learned things doing this" | "Here is what shipped, here is why, here is what I learned, here is what's next" |

The frame from the prior chat (image #1 in the user's message) anchors the genre: **engineering writeup of a merged OSS contribution to a serious ML framework**. Not a paper, not a casual blog. Compare to Rust/ML practitioner writeups, not academic papers.

---

## 2. Source material — what we have to draw from

### 2.1 LifeOS vault

| File | Path | What it gives us |
|---|---|---|
| Burn engagement log | `Projects/Open Source Contributions/Repos/Burn.md` | The 25-day silence story, claim/confirm dates verbatim, the precedent PR chain (LPIPS / DISTS / Gram / FID), meta-issue culture, laggui's response style, "Yeah it should be up for graps!" quote, queue snapshot, repo norms |
| OSS Decisions | `Projects/Open Source Contributions/Decisions.md` | D1–D11: umbrella folder, gitignore-whitelist, one-concern-per-PR rule, three-concurrent-thread ceiling, no AI commit trailers default, vault-vs-OSS-repo split. **Real design rationale for everything around the PR.** |
| Tessarix A-FINE lesson | `Projects/Tessarix/Systems/A-FINE Lesson.md` | The metric's actual mechanics in depth: full-reference (not no-reference), QuickGELU vs GELU 1% gap, fused-QKV transposed split bug, 0-D scalar drop, SSIM-style fidelity ratio with c-constants, logistic calibrator with 5 β params, adapter asymmetry on (s_nat_d, s_nat_r), 8-dim simplification, "what A-FINE doesn't do" |

### 2.2 The live PR (`tracel-ai/burn` #4894 — MERGED 2026-05-11)

| Field | Value |
|---|---|
| URL | https://github.com/tracel-ai/burn/pull/4894 |
| State | MERGED 2026-05-11T13:10:09Z (commit `d2825c4`) |
| Additions / Deletions | +1864 / -0 across 10 files |
| Codecov patch coverage | 76.18 % (vs project target 80 %) — merged despite under-target |
| Codecov project delta | −0.15 % (project coverage 65.34 % after merge) |

**Actual file paths (corrected — current article cites wrong directory):**

| File | Path | LOC | Role |
|---|---|---|---|
| `mod.rs` | `crates/burn-train/src/metric/vision/afine/mod.rs` | 19 | Module entry |
| `clip_attention.rs` | `…/afine/clip_attention.rs` | 137 | Multi-head attention block |
| `clip_vit.rs` | `…/afine/clip_vit.rs` | 367 | Inlined CLIP ViT (patch embed + pos embed + class token + N blocks) |
| `quick_gelu.rs` | `…/afine/quick_gelu.rs` | 71 | **QuickGELU activation** — CLIP-specific, ~1 % different from erf-GELU |
| `heads.rs` | `…/afine/heads.rs` | 383 | Fidelity head + naturalness head |
| `calibrators.rs` | `…/afine/calibrators.rs` | 250 | 5-parameter logistic calibrator |
| `metric.rs` | `…/afine/metric.rs` | 370 | Top-level metric, forward, adapter combining heads |
| `weights.rs` | `…/afine/weights.rs` | 264 | PyTorch weight loader (uses `burn-store`) |
| `crates/burn-train/src/metric/vision/mod.rs` | (modified) | +2 | Register A-FINE in module tree |
| `burn-book/src/building-blocks/metric.md` | (modified) | +1 | Doc index line |

**Review timeline (verified from `gh pr view`):**

| Date | Actor | Event |
|---|---|---|
| 2026-03-25 | Caner | Claim comment on meta-issue #4312 |
| 2026-03-25 | laggui | Confirms: *"Yeah it should be up for graps!"* |
| 2026-04-19 | Caner | Re-engages after 25-day silence with technical questions about PR-size strategy and CLIP ViT inlining |
| 2026-04-23 | laggui | Guidance: single-PR, inline CLIP ViT, follow LPIPS pattern |
| 2026-04-28 | Caner | PR #4894 opened |
| 2026-04-30 | codecov | Patch coverage report 76.18 % |
| 2026-05-05 | laggui | Acknowledgement: *"Just letting you know I am aware of this PR 🙏 but haven't gotten around to it yet; bigger PRs require a bit more context switching"* |
| 2026-05-06 | laggui | **CHANGES_REQUESTED** — one comment, single round: *"Pretty clean implementation! Just one minor comment but otherwise LGTM"* (re: `forward_with_features` returning a `ClipOutput { features, cls: Option }` struct) |
| 2026-05-07 | Caner | Pushed the refactor |
| 2026-05-07 15:27 UTC | laggui | **APPROVED** — *"LGTM! Your response time was totally fine btw 😄"* |
| 2026-05-11 | tracel-team | MERGED |

**Total review window: 9 days from PR open to merge.** Not "approaching three weeks" as the current article claims.

### 2.3 The paper (Yang et al. → Chen, Wu, Ma, Zhang 2025)

| Field | Value |
|---|---|
| Title | **Toward Generalized Image Quality Assessment: Relaxing the Perfect Reference Quality Assumption** |
| Authors | Du Chen, Tianhe Wu, Kede Ma, Lei Zhang |
| Affiliations | PolyU, CityU, OPPO |
| Venue | **CVPR 2025** |
| arXiv | [2503.11221](https://arxiv.org/abs/2503.11221) |
| Project page | [tianhewu.github.io/A-FINE-page.github.io](https://tianhewu.github.io/A-FINE-page.github.io/) |
| Reference Python | [ChrisDud0257/AFINE](https://github.com/ChrisDud0257/AFINE/tree/master) (Apache-2.0) |

**The paper's actual contribution** (which the current article completely misses):

> Full-reference IQA traditionally assumes the reference image has perfect quality. That assumption breaks for (a) imaging systems with intrinsic limits, (b) generative enhancement methods that *exceed* the original's quality. A-FINE **relaxes the perfect-reference assumption** by adaptively blending two scores: a fidelity score (how similar to reference) and a naturalness score (how perceptually natural the image looks on its own). When the reference is itself low-quality, A-FINE down-weights fidelity and lets naturalness carry more of the final score. When the reference is high-quality, A-FINE behaves like classical full-reference IQA.

The *adaptive* in "Adaptive Fidelity-Naturalness Evaluator" is where the metric's design intelligence lives. The current article ignores this entirely.

**Datasets the paper benchmarks against:**

| Dataset | Scale | Source |
|---|---|---|
| DiffIQA | ~180,000 images | Diffusion-enhanced images with worse/similar/better human annotations |
| SRIQA-Bench | 100 references × 10 SR methods | Super-resolution outputs (2 regressive + 8 generative) with reliable annotations |
| Established IQA datasets | — | LIVE, TID2013, KADID-10k, etc. |

A-FINE "surpasses standard FR-IQA models" on both established and newly-created benchmarks.

---

## 3. Factual-correction ledger — current article vs reality

Every claim in `burn-afine-pr.ts` that is materially wrong or misleading.

| # | Current article says | Reality | Source |
|---|---|---|---|
| 1 | "A-FINE (Aesthetic, Fidelity, INtegrity, no-reference Evaluation)" | A-FINE = **Adaptive Fidelity-Naturalness Evaluator** | Paper title + project page + LifeOS Burn.md |
| 2 | "no-reference image-quality metric, that scores images without needing a reference" | A-FINE is **full-reference** — takes both a distorted image AND a reference image | Paper abstract; Tessarix lesson explicit |
| 3 | "published in Yang et al. (2024)" | Chen, Wu, Ma, Zhang (CVPR **2025**); arXiv 2503.11221 (March 2025) | Paper |
| 4 | "Status: Open, in active review with maintainer (laggui)" | **MERGED 2026-05-11** | `gh pr view 4894` |
| 5 | "Outstanding work: `forward_with_features` refactor" | Refactor was the one CHANGES_REQUESTED item; addressed 2026-05-07; merged 4 days later | PR reviews |
| 6 | "Reference paper: Yang et al. (2024), A-FINE" | "Toward Generalized Image Quality Assessment: Relaxing the Perfect Reference Quality Assumption" | Paper |
| 7 | "Reference Python implementation: Available; ported as part of the PR" | Specifically: PyIQA's A-FINE implementation, originating from ChrisDud0257/AFINE (Apache-2.0) | Burn.md |
| 8 | File path: `crates/burn-metric/src/afine/…` | Actual: `crates/burn-train/src/metric/vision/afine/…` | PR file list |
| 9 | "A-FINE head (4-layer MLP)" / single head with aesthetic+fidelity+integrity outputs | **Two heads**: fidelity head (SSIM-style ratio in CLIP-feature space) + naturalness head, then a 5-parameter logistic calibrator, then an adapter that blends them | Tessarix lesson + paper |
| 10 | "Review process: Round 1 high-level architecture, Round 2 code review with 4 findings + outstanding refactor" | **One round** of changes requested with one comment ("just one minor comment but otherwise LGTM"); approval next day. The 4-row "Round 2" findings table is fabricated. | PR reviews |
| 11 | "Round 1 questions: should CLIP be inlined or external, should it go in burn-metric or its own crate, should the example be in-tree, test data inclusion" | These were resolved on the meta-issue thread 2026-04-23, before PR open. Not part of formal review rounds. | Burn.md timeline |
| 12 | "Inconsistent doc-comment style across modules — fixed" | Not a real review comment | PR reviews |
| 13 | "Linear::load calls had no error context — added .with_context — fixed" | Not a real review comment | PR reviews |
| 14 | "Preprocessing constants belong in a single module — fixed (`preprocessing.rs`)" | There is no `preprocessing.rs` file in the PR | PR file list |
| 15 | "Test fixture file paths use relative paths — fixed (absolute via `CARGO_MANIFEST_DIR`)" | Not a real review comment | PR reviews |
| 16 | "tests/afine_e2e.rs with three test images (landscape.jpg 6.42, portrait.jpg 7.18, screenshot.jpg 3.95)" | No such test file in the PR. Test fixture scores are fabricated. | PR file list |
| 17 | "examples/afine-cli/ standalone example crate" | No `examples/afine-cli/` directory exists in the PR | PR file list |
| 18 | "The PR is approaching three weeks of review time. That is fine." | 9 days from PR open (2026-04-28) to merge (2026-05-11) | PR dates |
| 19 | "burn-store can read .pt and .pth files. The weight-loading code is roughly 200 LoC" | `weights.rs` is 264 LOC (close but specific number needed); the cited approach (long manual layer-mapping loop) doesn't match what `burn-store` typically does | PR file list |
| 20 | Pseudocode `let score = afine.forward(image)` and `(score, features) = afine.forward_with_features(image)` | The real refactor uses a `ClipOutput { features, cls: Option<…> }` return type | Burn.md |

**Severity ledger:** items 1–8 are public-facing factual errors that will be caught by anyone who clicks the PR link. Items 9–11 mislead on technical depth. Items 12–17 are made-up specifics. Items 18–20 mislead on timeline + implementation reality.

The current article cannot ship as-is to LinkedIn. The corrections are non-negotiable.

---

## 4. Gap analysis — what's covered, what's thin, what's missing

### 4.1 Covered well

| Topic | Where in current article | Keep |
|---|---|---|
| The "don't depend on an external CLIP crate" decision rationale | §"The first decision" | ✓ — strong section, accurate |
| What signals a substantial OSS PR sends to readers | §"What this is worth on a portfolio" | ✓ — keep, refine |
| The maintainer's-job-easier framing | §"What the review taught me" | ✓ — keep, anchor to laggui's real quote |

### 4.2 Thin — exists but underdeveloped

| Topic | What's there | What it needs |
|---|---|---|
| The CLIP ViT inlining | A short Rust pseudocode excerpt + "~600 LoC" | Real excerpts from `clip_vit.rs` (367 LOC) and `clip_attention.rs` (137 LOC); the patch embedding strategy; positional embedding choice; class token mechanism; QuickGELU vs standard GELU **(currently completely missing)** |
| The PyTorch weight loader | Pseudocode + "~200 LoC" | Real excerpts from `weights.rs` (264 LOC); how `burn-store` actually works; the layer-naming-convention mismatch story (CLIP's HuggingFace vs PyIQA's naming); how the calibrator weights came across separately |
| End-to-end testing | Fabricated test file | The real test approach (parity tests against PyIQA reference outputs captured offline); what tolerance was used; what fixtures shipped |
| The review experience | Two fabricated rounds | Single real round with verbatim laggui quotes; what the `ClipOutput` struct refactor actually changed; how fast Caner turned it around (1 day) |

### 4.3 Missing — should be added

| Topic | Why it matters | Source available |
|---|---|---|
| **The paper's actual contribution** (relaxing the perfect-reference assumption) | Currently the article doesn't explain *what makes A-FINE A-FINE*. This is the single biggest gap. | Paper abstract + project page |
| **The naturalness head + the adapter** | The "adaptive" half of A-FINE. Without this, the metric sounds like another LPIPS. | Tessarix lesson + paper |
| **The fidelity formula** (SSIM-style ratio in CLIP feature space with c1/c2 stability constants) | Real math content. Distinguishes the article from a typical PR-recap blog. | Tessarix lesson |
| **The 5-parameter logistic calibrator** | One of the four submodules. Should appear in any architecture diagram. | Tessarix lesson |
| **The implementation traps** (QuickGELU vs erf-GELU 1 % gap, fused-QKV transposed split, 0-D scalar drop) | These are the highest-value engineering content — concrete bugs encountered, how they were caught. | Tessarix lesson |
| **The 25-day silence story** | Substantive professional/communication lesson. "What a long silence survives if you come back with technical depth." | Burn.md historical section |
| **The precedent PR chain** (LPIPS #4403, DISTS #4574, Gram #4595, FID #4644) | Anchors A-FINE as part of a checklist culture, not a one-off. Shows engineering taste in template-matching. | Burn.md |
| **The meta-issue #4312 culture** | Where claim/confirm happened. Important context: A-FINE was proposed by torsteingrindvik. | Burn.md |
| **Codecov patch coverage 76.18 % (under 80 % target)** | Honest engineering — merged despite missing the target. Why was the trade-off accepted? | PR comments |
| **What A-FINE doesn't do** (no geometric distortion handling, no saliency, no temporal consistency, no adversarial robustness, no OOD, no distributional comparison) | Honest limits section. Reader trust. | Tessarix lesson |
| **The Burn engagement queue** (concurrent threads: #4519 fold4d, #4938 TensorContainer, #4716 PytorchStore queued) | "This isn't a one-off. Here's the multi-PR program." | Burn.md |
| **D9 — no AI commit trailers default** | Subtle but signals attention to upstream norms. Reader-facing detail that lands the "I care about this work" point. | OSS Decisions.md |
| **D11 — one concern per PR** | Worth a callout if discussing how the PR was scoped. | OSS Decisions.md |
| **The maintainer's actual voice** (laggui: short, friendly, "Yeah it should be up for graps!" / "LGTM!") | Concrete colour. Right-frame: maintainer-as-collaborator. | Burn.md + PR comments |
| **Tessarix as the substrate-proven companion lesson** | One line at the end: "If you want the interactive walkthrough of *how A-FINE works*, the lesson lives at Tessarix/Systems/A-FINE Lesson — written the same day this PR merged, as a deliberate stress test." Connects the two pieces. | Tessarix A-FINE Lesson |

### 4.4 Specifically deletable

| Topic | Why delete |
|---|---|
| The fabricated `tests/afine_e2e.rs` block with landscape/portrait/screenshot fixtures and 6.42/7.18/3.95 scores | Not real |
| The fabricated `examples/afine-cli/` Cargo.toml + main.rs + README | Not real |
| The 4-row "Round 2: code review" findings table | Not real |
| The "approaching three weeks of review time" framing | Wrong; 9 days |
| The "outstanding `forward_with_features` refactor" framing | Wrong; already done and merged |

---

## 5. Proposed section structure (rewrite skeleton)

A 16-section pass. Each section's deliverable is one short paragraph below; the full text gets written in the implementation phase.

| # | Section | Word budget | Carries |
|---|---|---|---|
| 1 | **TL;DR card** | 150 | Status (MERGED), LOC, file count, paper, link, review window. Top-of-article quick-read. |
| 2 | **What A-FINE actually is** | 350 | The paper's pitch: relaxing the perfect-reference assumption; full-reference; adaptive blend of fidelity and naturalness. Sets the genre. |
| 3 | **The meta-issue and the claim** | 300 | Issue #4312 culture; torsteingrindvik's proposal; the "Yeah it should be up for graps!" exchange. |
| 4 | **The 25-day silence — and how it resolved** | 400 | Substantive professional lesson. Coming back with technical questions, not apologies. |
| 5 | **Locking the implementation strategy** | 350 | The 2026-04-23 thread with laggui: single-PR, inline CLIP ViT, follow LPIPS pattern. The precedent PR chain (LPIPS #4403, DISTS #4574, Gram #4595, FID #4644). |
| 6 | **Architecture: the four submodules** | 600 | CLIP ViT backbone → fidelity head → naturalness head → 5-param logistic calibrator → adaptive blend. Real diagram. |
| 7 | **The fidelity formula** | 450 | SSIM-style ratio in CLIP-feature space. c1/c2 stability constants. The ratio-collapse failure mode if c is too large. |
| 8 | **The adapter — where "adaptive" lives** | 400 | The (s_nat_d, s_nat_r) blend. Why the asymmetry is the design intelligence. |
| 9 | **The CLIP ViT inlining** | 500 | Real excerpts from `clip_vit.rs` + `clip_attention.rs`. Patch embed, positional embed, class token, QuickGELU. Why not depend on an external crate. |
| 10 | **The implementation traps** | 600 | QuickGELU vs erf-GELU 1 % gap (the `quick_gelu.rs` file). Fused-QKV transposed split. 0-D scalar drop. Concrete bugs, how they were caught against the PyIQA reference. |
| 11 | **The PyTorch weight loader** | 400 | `weights.rs` (264 LOC). burn-store. The HuggingFace-vs-PyIQA naming mismatch. How calibrator weights came across. |
| 12 | **The review — one round, two quotes** | 350 | Real laggui quotes verbatim. The `ClipOutput { features, cls }` refactor. 9 days end-to-end. Codecov 76.18 % under target — accepted anyway. |
| 13 | **What A-FINE doesn't do** | 250 | Honest limits: no geometric distortion, no saliency, no temporal consistency, no adversarial, no OOD, no distributional comparison. |
| 14 | **What this is part of** | 350 | The burn engagement queue: #4519 fold4d, #4938 TensorContainer, #4716 PytorchStore. Not a one-off; a program. |
| 15 | **Lessons** | 400 | The five or six durable engineering lessons. Maintainer-as-collaborator. One-concern PRs. Code-first to force direction calls. Inline-not-depend. Match precedent. |
| 16 | **The companion lesson** | 150 | Pointer to Tessarix A-FINE lesson — built same-day as the merge, as a deliberate stress test. "If you want the interactive walkthrough of how the metric actually works, that's where it lives." |

**Total target: ~5,950 words ≈ 22-min read.** Adjustable up to ~7,500 if math sections (§7, §8) earn more space.

---

## 6. Interactive widget proposals

The site's current article-rendering vocabulary (`markdown-components.tsx` + `remark-callouts.ts`):

| Primitive | Status |
|---|---|
| Headings h1–h6 with `text-gradient-purple` | ✓ existing |
| Code blocks with Prism syntax highlight (rust, ts, py, bash, etc.) | ✓ existing |
| ASCII art (untagged fenced blocks) → centred monospace | ✓ existing |
| Tables with hover + rounded border | ✓ existing |
| Callouts: `[!warning]` `[!important]` `[!note]` `[!tip]` | ✓ existing |
| Task list checkboxes (custom styled) | ✓ existing |
| Blockquotes with purple-dim left border | ✓ existing |
| Inline code, links (with external-target detection) | ✓ existing |

To add interactive widgets to one article without breaking the others, the path of least resistance is **extending `remark-callouts.ts` (or a sibling plugin) to recognise more marker types** that route to React components in `markdown-components.tsx`. The Article body stays a string; the rendering pipeline does the rest. This matches how callouts already work and preserves the typed-data-layer convention.

Below: widget proposals ranked by signal-per-effort. All stay within the site's aesthetic (dark glass, OKLCH purple accent, Motion entrance, subtle borders, no loud colours).

### Tier 1 — high signal, low effort (static visual widgets)

| # | Widget | What it does | Where it sits | Lift |
|---|---|---|---|---|
| W1 | **PR Timeline** | Horizontal stepper: 6–8 dated milestones from claim through merge. Hover for one-line context. Static, no state. | §3 + §4 + §12 boundary | Low. ~80 LOC React + Motion entrance. Custom marker `[!timeline]` in markdown with structured JSON body. |
| W2 | **File-LOC bar chart** | Horizontal bars for 8 files (clip_vit 367, heads 383, metric 370, weights 264, calibrators 250, clip_attention 137, quick_gelu 71, mod 19). Each bar labelled with file role on hover. | §6 architecture intro | Low. ~60 LOC. Static SVG / CSS bars. |
| W3 | **Coverage gauge** | Circular gauge showing 76.18 % patch coverage against the 80 % project target. Annotation: "merged anyway — here's why." | §12 review | Low. ~50 LOC SVG. |
| W4 | **Maintainer-quote callout** | New callout type `[!maintainer]` — purple-accent panel with small "laggui (tracel-ai)" attribution strip + the verbatim quote. Same visual idiom as existing `[!important]` callouts. | §3, §5, §12 | Trivial — extends `CALLOUT_CONFIG` map. |

### Tier 2 — medium signal, medium effort (interactive visualisations)

| # | Widget | What it does | Where it sits | Lift |
|---|---|---|---|---|
| W5 | **QuickGELU vs GELU plot** | Static SVG line plot, two curves: standard `erf`-based GELU vs `1.702x · sigmoid(x)` QuickGELU. Annotation showing max ~1 % activation gap in the middle of the range. | §10 implementation traps | Medium. ~100 LOC. Could use Recharts (already in stack?) or hand-rolled SVG. |
| W6 | **Ratio-collapse demo** | Slider for the `c` constant in the SSIM-style fidelity ratio. Two-curve plot showing the score curve at `c=1e-10` vs `c=1e-6`. Drives home the silent-failure point. | §7 fidelity formula | Medium. Interactive slider + on-the-fly compute. ~140 LOC. |
| W7 | **PR-precedent graph** | Small node graph: A-FINE #4894 inheriting from LPIPS #4403, DISTS #4574, FID #4644, Gram #4595. Each node clickable to the PR. Renders the precedent-driven culture visually. | §5 strategy | Medium. ~120 LOC SVG + click handlers. |

### Tier 3 — high signal, high effort (the Tessarix-grade widgets)

| # | Widget | What it does | Where it sits | Lift |
|---|---|---|---|---|
| W8 | **A-FINE pipeline walker** | The Tessarix `AFinePipeline` widget — 7-stage interactive forward-pass diagram, click any stage to expand detail. Already exists in the Tessarix repo's `src/components/widgets/afine/`. Could be ported or iframe-embedded if Tessarix has a public web build. | §6 architecture | High if rebuilt; trivial if embedded. **Ask the user.** |
| W9 | **Adapter heatmap mini** | 2D heatmap showing final A-FINE score as a function of `(s_nat_r, s_fid)`. Draggable cursor + asymmetry annotation. Tessarix has this too. | §8 adapter | High. ~250 LOC if rebuilt. |
| W10 | **PSNR/SSIM vs A-FINE comparison** | Two reference/distorted image panels with translation/blur/noise sliders + live PSNR + SSIM + A-FINE readouts. Captures the "classical metrics disagree, A-FINE is the third opinion" story. | §2 what A-FINE is | High. Needs reference image fixtures + on-the-fly metric compute. |

### Recommendation

Ship W1 + W2 + W3 + W4 in the first iteration. They cover the timeline visualisation, the file-structure feel, the coverage-under-target honesty signal, and the maintainer-voice colour — together they pull the article from "mostly prose with tables" to "engineering writeup with visual texture" without inventing new infra. Treat W5 + W6 as a stretch if the Tier-1 work goes faster than expected. W7 (PR graph) is a nice fourth if it slots cleanly into §5. W8–W10 only if the user wants to invest a session on the Tessarix-grade widgets — they would be standout but represent multi-day work each.

**All widgets respect the existing aesthetic:** dark backgrounds via `hsla(285, 8%, 14%, 0.7)` (matches code blocks), purple accent via `var(--accent-purple)`, subtle borders via `border-zinc-700/60`, Motion entrance variants matching the existing `cascade-index` stagger pattern. No new colour primitives, no new font, no new layout system. They feel like the rest of the site or they don't ship.

---

## 7. Implementation phasing (when you greenlight)

| Phase | Scope | Estimated effort |
|---|---|---|
| **A — Fix the wrong claims** | Rewrite the article's body string with corrected facts everywhere, keeping the current visual primitives only (no new widgets). Roughly 6 hours of focused writing. End state: article is technically correct, ~5,500 words, ready for LinkedIn cross-post as-is. | Half a session |
| **B — Tier-1 widgets** | Ship W1 (PR Timeline), W2 (File-LOC chart), W3 (Coverage gauge), W4 (Maintainer callout). Extend `remark-callouts.ts` infrastructure. ~4–6 hours. | Half a session |
| **C — Tier-2 stretch** | W5, W6, W7 if they pay off in the prose. ~6–8 hours total. | Full session |
| **D — Tessarix-grade widgets** | W8–W10. Only if the user wants to invest. ~1–2 sessions per widget. | Multi-session |

Phase A is non-optional before any LinkedIn publication. B is the recommended target. C and D are upside.

---

## 8. Open questions for the user (no clarifying mid-execution; raised here for explicit sign-off before writing)

1. **Acronym disclosure.** The current article published the wrong A-FINE expansion ("Aesthetic, Fidelity, INtegrity, no-reference Evaluation"). The rewrite should either (a) silently use the correct expansion, or (b) include a footnote acknowledging the first draft had it wrong. (a) is cleaner; (b) is more transparent. Default: (a).
2. **Tone on the codecov gap.** Patch coverage was 76.18 % vs 80 % project target, and the PR merged anyway. Want to (a) explicitly discuss it as a trade-off the maintainer accepted, or (b) leave it out? Default: (a) — honest engineering is a signal.
3. **Tessarix link visibility.** Tessarix is private. The companion-lesson callout (§16) — link to a private vault path, or describe it without a clickable target? Default: describe without link, or link to a Tessarix marketing page if one exists.
4. **LinkedIn cross-post shape.** When publishing to LinkedIn, the article becomes a LinkedIn Article (long-form) with the portfolio-site URL as canonical. Want the LinkedIn version to be the full article or a shorter pull-out with "full version on capataina.vercel.app"? Default: full version on LinkedIn, with the portfolio site cross-linked as the home — matches what the prior chat advised.
5. **Widget infra direction.** Tier-1 widgets via remark-plugin marker extension (proposed above) vs migrating to MDX vs adding a `widgets` slot on the Article type. Default: marker extension — smallest blast radius.

---

## 9. Pointers for whoever picks this up

- The current article lives at `src/content/articles/open-source/burn-afine-pr.ts`.
- The article shape (`Article` type) is in `src/types.ts` — the body is a plain markdown string. Custom widgets need to flow through the remark-plugin pattern to keep it that way.
- Site visual conventions: read `src/components/articles/markdown-components.tsx` first; every widget should match its texture.
- Memory entries `feedback_articles_rich_formatting.md` and `feedback_no_em_dashes.md` apply to the rewrite. The article currently violates the em-dash rule in a few places — fix during rewrite.
- The Tessarix A-FINE lesson is the strongest single source for the math content (§§6–10 of the rewrite); read it before drafting those sections.
- The OSS umbrella repo (`Capataina/OpenSourceContributions`) is private and has deeper notes at `Notes/burn/` if anything in the vault Burn.md needs cross-checking.

---

## Cross-vault connections

- `Capataina/LifeOS:Projects/Open Source Contributions/Repos/Burn.md`
- `Capataina/LifeOS:Projects/Open Source Contributions/Decisions.md`
- `Capataina/LifeOS:Projects/Tessarix/Systems/A-FINE Lesson.md`
- `tracel-ai/burn` PR [#4894](https://github.com/tracel-ai/burn/pull/4894) (MERGED)
- arXiv [2503.11221](https://arxiv.org/abs/2503.11221)
- Reference Python: [ChrisDud0257/AFINE](https://github.com/ChrisDud0257/AFINE)
