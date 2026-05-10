import type { Article } from "@/types";

export const ossScoutIssuesSkill: Article = {
  slug: "oss-scout-issues-skill",
  title: "How I scout open-source contributions: a parallel-agent issue scouting skill",
  type: "Article",
  date: "2026-05-10",
  project: "Open Source Contributions",
  description:
    "Picking which open-source issues to engage with is a research problem in itself. The umbrella OSS-contributions repo has a local Claude Code skill called scout-issues that runs across nine vetted Rust ML / systems projects in parallel, ranks candidates by cleanliness > scope > alignment, and produces a cross-project synthesis. The methodology, the ranking, and the first run's findings.",
  tags: ["claude-code", "open-source", "skill-design", "methodology"],
  body: `# How I scout open-source contributions: a parallel-agent issue scouting skill

The umbrella repo \`Capataina/OpenSourceContributions\` (private) is where my open-source work runs. It contains per-repo culture notes, working-memory deep-research files, and a single local Claude Code skill: \`scout-issues\`.

The skill exists because choosing which issue to engage with is harder than it sounds. There are thousands of open issues across the Rust ML and systems ecosystem at any given time. Most are uninteresting (typos, stale feature requests, duplicates). A small minority are well-scoped, well-aligned with my engineering profile, and likely to land cleanly.

\`scout-issues\` runs across nine vetted projects in parallel, applies a consistent rubric, and produces a ranked synthesis. This article is the methodology.

---

## TL;DR

| Component                                  | What it does                                  |
|--------------------------------------------|-----------------------------------------------|
| Vetted projects (9)                         | alloy, burn, candle, mistral.rs, ratatui, tauri, tinygrad, tokio, tract |
| Parallel agents per project                  | One agent per project, running concurrently   |
| Ranking criteria                              | Cleanliness > scope > alignment                |
| Output                                        | Cross-project synthesis with top 10 candidates |
| First run findings                            | burn dominated; surfaced 2 AI-policy corrections |

---

## The nine vetted projects

\`\`\`
                  Project portfolio (Tier 1-3)

   Tier 1 (engagement now):
     ├─ burn          ─ Rust deep-learning framework (most active)
     ├─ tinygrad      ─ minimalist Python framework
     └─ alloy         ─ Rust Ethereum library

   Tier 2 (next candidates):
     ├─ tauri          ─ daily stack, explicit pragmatic AI policy
     ├─ tract          ─ Sonos ONNX/NNEF inference runtime
     ├─ mistral.rs     ─ LLM serving in Rust
     └─ candle         ─ HuggingFace's Rust ML framework

   Tier 3 (aspirational):
     ├─ ratatui        ─ TUI library, daily stack
     └─ tokio          ─ async runtime; aspirational PR target
\`\`\`

Each project has its own per-repo notes folder (\`Notes/<project>/\`) with:

- \`contribution-culture.md\` — how PRs land in this repo
- \`repo-conventions.md\` — code style, commit format, review etiquette
- \`_issue-triage-<date>.md\` — recent scout output for this repo

The Tier system reflects current effort budget. Tier 1 gets most attention. Tier 3 gets occasional checks. The skill runs across all three tiers because aspirational engagements are sometimes warranted when a high-value issue appears.

---

## What \`scout-issues\` does

\`\`\`
                  Scout-issues run flow

   user invokes /scout-issues
        │
        ▼
   ┌──────────────────────────────────────────────────┐
   │ skill reads its config + per-project culture notes │
   └─────────────────────┬─────────────────────────────┘
                         ▼
   ┌──────────────────────────────────────────────────┐
   │ spawn 9 parallel sub-agents (one per project)      │
   │                                                    │
   │   each sub-agent:                                  │
   │     - gh api repos/<project>/issues --state open   │
   │     - read the recent N issues (default: last 50)  │
   │     - apply the ranking rubric                     │
   │     - produce structured candidate list             │
   └─────────────────────┬─────────────────────────────┘
                         ▼
   ┌──────────────────────────────────────────────────┐
   │ synthesis step: merge 9 lists into one ranked     │
   │ cross-project candidate list                       │
   │                                                    │
   │ output: Notes/_issue-scout-<date>.md               │
   └────────────────────────────────────────────────────┘
\`\`\`

The parallel architecture matters: running nine sub-agents concurrently means the scout finishes in ~3 minutes instead of ~30. Each sub-agent has its own context (the project's per-repo notes plus the live GitHub issue list).

---

## The ranking rubric: cleanliness > scope > alignment

The skill applies three criteria in priority order:

### Criterion 1: Cleanliness

> Can this issue land cleanly? Is the design question settled? Has a maintainer indicated direction? Is the implementation path obvious?

\`\`\`
                  Cleanliness signals

   STRONG positive:
     ✓ maintainer has commented with direction
     ✓ issue has a thumbs-up from a maintainer
     ✓ a stale PR exists with maintainer feedback on what's wrong
     ✓ similar issues have been closed recently with clean PRs

   WEAK positive:
     ~ issue has technical depth in the description
     ~ multiple users have repro'd

   NEGATIVE:
     ✗ design question is open
     ✗ disagreement among commenters about approach
     ✗ requires changes across many subsystems
     ✗ touches a file that has not been merged in 6+ months
\`\`\`

A clean issue is one where the engagement is "implement the agreed approach." A dirty issue is "figure out what the approach should be." Clean issues land faster and are higher-value scout picks.

### Criterion 2: Scope

> How big is the change? How many files? How tight is the test surface?

\`\`\`
                  Scope buckets (with examples)

   IDEAL (1-2 days work):
     - single-function bug fix with regression test
     - new ONNX operator with existing backward (free)
     - typo / doc fix that improves discoverability

   LARGE (1-2 weeks):
     - new metric implementation (e.g. A-FINE)
     - cross-cutting API change
     - new ONNX operator with novel backward

   HUGE (1-3 months):
     - new backend
     - architecture refactor
     - new framework primitive
\`\`\`

The skill prefers IDEAL-scope issues. LARGE-scope issues are second-tier. HUGE-scope issues are essentially never the right scout pick (they go through different engagement channels).

### Criterion 3: Alignment

> Does this match my engineering profile? Is this work I can do well?

Each project's per-repo notes include an "alignment axes" section that names the kinds of work in that repo that match my profile. Burn's alignment is highest (Rust + ML, my native stack). alloy is high (Rust + DeFi, secondary stack). ratatui is high (Rust + TUI, daily-driver stack). Other projects are lower-alignment.

| Project   | Alignment score | Why                                          |
|-----------|----------------|----------------------------------------------|
| Burn       | 5/5             | Rust + ML, native stack                       |
| tinygrad   | 4/5             | ML; Python but I'm fluent                     |
| alloy      | 4/5             | Rust + DeFi, paired with Aurix                |
| ratatui    | 5/5             | Rust + TUI; daily-driver stack                |
| tauri      | 5/5             | Rust + frontend; multiple projects use it    |
| tract      | 3/5             | ONNX/NNEF; secondary interest                  |
| mistral.rs  | 4/5             | LLM serving; interest area                     |
| candle      | 4/5             | Rust ML; HF-blessed; secondary                  |
| tokio       | 3/5             | aspirational; high prestige                     |

Higher alignment means the work is more enjoyable, lands more efficiently (less context-switching), and the maintainer can see in my prior work that I have done similar things.

### The full ranking formula

\`\`\`
   ranking_score = cleanliness × 0.5 + scope_fit × 0.3 + alignment × 0.2

   where each component is normalised to [0, 1]:
     cleanliness = 1.0 for "clearly mergeable", 0.0 for "design unsettled"
     scope_fit   = 1.0 for IDEAL scope, 0.5 for LARGE, 0.0 for HUGE
     alignment    = project's alignment score / 5
\`\`\`

The weights are 50/30/20. Cleanliness dominates because a perfectly-aligned, ideally-scoped issue with an open design question still produces a stuck PR. A clean issue at IDEAL scope with adequate alignment is the highest-value scout pick.

---

## What the first run found

The first full scout-issues run (2026-05-10) ranked candidates across all nine projects. The top 10 picks:

\`\`\`
                  Top 10 cross-project picks (2026-05-10)

   rank  score  project        issue                                       scope
   ────  ─────  ─────────────  ─────────────────────────────────────────  ──────
   1     0.92   burn            #4716 PytorchStore non-contiguous handling   IDEAL
   2     0.90   burn            #4519 fold4d (Col2Im) operator              IDEAL
   3     0.88   alloy           #1156 JSON-RPC recursion-limit fix          IDEAL
   4     0.85   burn            #3969 TensorContainer panic (dual with #2924) IDEAL
   5     0.78   tinygrad        #16119 LSTM (already engaged)                IDEAL
   6     0.72   tauri           plugin lifecycle ordering                    LARGE
   7     0.71   ratatui         scroll API refactor                          LARGE
   8     0.68   mistral.rs      streaming token endpoint                      LARGE
   9     0.65   candle          quantisation test gap                         LARGE
   10    0.62   tract           Conv2D fast path for specific shapes          LARGE
\`\`\`

Burn dominated the top of the list (4 of the top 10). This reflects both high alignment (Rust + ML, my native stack) and burn's contribution-friendliness (responsive maintainers, clear conventions).

The skill's output also flagged two AI-policy corrections during the scout:

| Project   | Correction surfaced                                           |
|-----------|---------------------------------------------------------------|
| ratatui    | Now has a formal AI section in CONTRIBUTING.md (was implicit before) |
| tract      | Claude-trailer commits are by external contributor czoli1976, not maintainer kali |

Both of these were small corrections to my per-repo notes. The scout updated them as part of its run.

---

## Why this approach scales

\`\`\`
                  Without scout-issues vs with it

   without:
     - manually check 9 projects' issue trackers, ~1 hour
     - apply mental rubric inconsistently
     - miss cross-project relationships
     - skim issues, miss the design-stuck-vs-clean signal

   with:
     - run /scout-issues, ~3 minutes
     - structured ranking applied consistently
     - cross-project synthesis surfaces patterns
     - explicit "is the design settled?" check per issue
\`\`\`

The skill's value is not "do something I could not have done." It is "apply a consistent rubric across nine projects faster than I could do it manually, every time I want to know what is worth engaging with."

> [!important] **What this generalises to**
>
> Any repeated workflow where the value is in consistency across many inputs benefits from a skill. The structure:
>
> 1. Identify a recurring task you do across N similar contexts
> 2. Write down the rubric you implicitly apply
> 3. Build a skill that applies the rubric consistently
> 4. Run the skill instead of doing it manually
>
> The skill is faster, more honest, and produces output you can reference later.

---

## What is in the skill itself

The \`scout-issues\` skill lives at \`.claude/skills/scout-issues/\` in the umbrella repo. It is roughly:

\`\`\`
.claude/skills/scout-issues/
├── SKILL.md                        ─ the obligations + flow
├── references/
│   ├── ranking-rubric.md           ─ the cleanliness > scope > alignment formula
│   ├── per-project-alignment.md    ─ alignment scores per project
│   ├── scope-buckets.md             ─ IDEAL / LARGE / HUGE definitions
│   ├── ai-policy-checks.md          ─ per-project AI policy patterns
│   └── synthesis-template.md        ─ output structure
├── worked-examples/
│   ├── 2026-05-10-first-run.md     ─ the first full run, annotated
│   └── 2026-04-22-burn-only.md      ─ an earlier single-project run
└── scripts/
    └── fetch_project_issues.py      ─ helper to batch-fetch issues
\`\`\`

The skill is roughly 4,000 lines of markdown across all reference files. The SKILL.md itself is ~200 lines: the obligations, the flow, the output requirements.

---

## The cost of building this

| Component                                | Time invested      |
|------------------------------------------|--------------------|
| Initial rubric design                     | ~4 hours           |
| Per-project alignment notes (9 projects)  | ~6 hours           |
| Synthesis template                         | ~2 hours           |
| First-run validation                       | ~3 hours           |
| Ongoing refinement (per scout run)         | ~30 min/run        |

Total upfront: ~15 hours. Per-run cost: ~30 minutes of human time plus ~3 minutes of agent time.

Without the skill, the equivalent manual scout takes ~1 hour. The skill pays back its upfront cost after ~30 runs.

---

## What this teaches about OSS engagement

> [!important] **The general principle**
>
> Choosing which issue to engage with is a research problem. Doing the research well is what separates "I have time to contribute but nothing lands" from "I have time to contribute and most of what I open lands."
>
> The single most useful signal is **cleanliness**: has the design question been answered? If yes, the issue is engageable. If no, the issue is either dead or requires a scoping conversation before any code is written.

For someone considering OSS contribution at scale:

| Practice                                              | Effort                              | Payoff                                |
|-------------------------------------------------------|-------------------------------------|---------------------------------------|
| Curate a list of 5-15 vetted target projects          | ~10 hours of research                | every engagement starts oriented      |
| Write per-project culture notes                        | ~1 hour per project                  | review-time wins from convention-matching |
| Apply consistent ranking across issues                  | ~30 min/run × frequency               | no wasted engagements on dirty issues  |
| Update notes after each engagement                       | ~30 min per engagement                | next engagement is cheaper             |

The compounding effect is real. The first engagement at burn was expensive (had to learn the culture, conventions, review etiquette). The fourth engagement is cheap (notes already exist).

---

## Status of the umbrella OSS repo

| Property                          | Value                                          |
|-----------------------------------|------------------------------------------------|
| Repo HEAD                          | \`b7e08c2\`                                     |
| Repo created                       | 2026-05-09                                      |
| Days active                        | 2 (heavy iteration)                            |
| Total commits                      | 11                                              |
| Notes files                         | 64 markdown + 1 Python script                  |
| Vetted projects                     | 9                                               |
| Active engagements                   | 6 (5 ball-on-others, 1 ball-on-me)             |

The repo is bootstrapped, the skill works, the scout has produced its first cross-project synthesis. The next iteration is to use the scout's top picks to drive the engagement queue.

---

## Closing

\`scout-issues\` is a small piece of infrastructure that makes a real difference to engagement quality. The skill's design is generic enough to apply to any cross-project research task; the specific instance is "find me clean Rust ML / systems issues to contribute to."

The methodology is portable: identify your vetted target set, write down your alignment criteria, codify the cleanliness signals, and build the skill once. Then run it whenever you want to know what is worth your time.

The first run surfaced 10 strong candidates. Several are now active engagements (A-FINE PR #4894, fold4d queued behind it, alloy #1156 scoping). The skill's value is not in any single run; it is in being able to run it again next week, with the same rubric, and get a similarly-honest answer about where to spend the next engagement budget.

That is what skill-based infrastructure buys: consistency over time, at low marginal cost per use. Worth the upfront investment.
`,
};
