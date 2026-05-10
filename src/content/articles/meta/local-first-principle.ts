import type { Article } from "@/types";

export const localFirstPrinciple: Article = {
  slug: "local-first-design-principle",
  title: "Local-first as a design principle, not a label",
  type: "Article",
  date: "2026-05-02",
  project: "Portfolio",
  description:
    "Four of my projects (Cernio, Aurix, Image Browser, NeuroDrive) describe themselves as local-first. The phrase means different things in each context. This article unpacks what local-first actually requires, what the interpretations look like across projects, and when local-first is the wrong choice.",
  tags: ["architecture", "local-first", "design-principles", "engineering"],
  body: `# Local-first as a design principle, not a label

Four of the five projects in my portfolio use the phrase "local-first" in their README or design documents:

| Project       | Local-first interpretation                                  |
|---------------|-------------------------------------------------------------|
| Cernio        | SQLite database, terminal UI, AI runs through Claude Code on the user's machine |
| Aurix         | Zero paid APIs, all computation on-device, read-only        |
| Image Browser   | ONNX models on the user's machine, no cloud, no API calls   |
| NeuroDrive     | Single-machine RL simulator, no distributed training         |

The phrase is doing a lot of work across these projects, and it means different things in each context. "Local-first" is a marketing-friendly label that hides real engineering decisions underneath.

This article unpacks what local-first actually requires, what the interpretations look like across each project, and when local-first is the wrong choice.

---

## TL;DR

| Aspect                        | What local-first requires                              |
|-------------------------------|--------------------------------------------------------|
| Data ownership                 | The user's data lives on the user's machine             |
| Computation                    | The work happens on the user's hardware                 |
| Network independence            | The app runs offline (or with degraded modes that fail loud) |
| Vendor independence              | No required external service                            |
| Cost predictability              | $0 per query / per user / per anything                 |
| Failure isolation                 | Outages in third-party services do not break the app   |

> [!important] **The phrase that hides the work**
>
> "Local-first" sounds simple. The real engineering is choosing a stack that delivers all six properties consistently, and recognising when one of them has to be sacrificed.

---

## What each property actually means

### Data ownership

The user's data stays on the user's machine. Not "stays unless we backup it to our cloud." Not "primarily local but we sync." The data lives on disk where the user controls it. If the user uninstalls the app, the data either stays (and the user knows where) or gets deleted (and the user knows it did).

| Storage choice                  | Data ownership                              |
|---------------------------------|---------------------------------------------|
| SQLite file in app-data dir      | ✓ user owns it; can copy / backup           |
| Encrypted SQLite + user-managed key | ✓ user owns it with explicit security    |
| Hosted database with API access   | ✗ user has access; vendor owns the storage  |
| Browser localStorage              | mostly ✓ but ephemeral and browser-controlled |
| Hosted with user-controlled keys   | ✗ user can lose data via vendor incident    |

For Cernio, Image Browser, and Aurix: SQLite file in the platform's app-data directory. Cernio writes to \`~/.cernio/cernio.db\`. Image Browser writes to \`~/Library/Application Support/com.ataca.image-browser/cernio.db\`. Each user owns their data.

### Computation

The work that produces the user's results happens on the user's hardware. Not "the API call happens on the user's hardware while the model runs on our cloud." The actual computation that transforms inputs to outputs runs locally.

| Compute model                       | Local-first?                              |
|-------------------------------------|--------------------------------------------|
| ONNX model on-device                 | ✓                                          |
| Rust matrix math on-device            | ✓                                          |
| API call to hosted model              | ✗                                          |
| Hybrid (small model local, big API)   | partial; depends on which work matters    |

For Image Browser: CLIP + DINOv2 + SigLIP-2 all run on the user's CPU. For NeuroDrive: PPO and the brain-inspired learner run on the user's CPU. For Aurix: Q64.96 math runs on the user's CPU. The computation is local in every case.

### Network independence

The app can run offline. Not "the app gracefully degrades when offline." It can do its core function without an internet connection.

| Feature                              | Offline-capable for these projects? |
|--------------------------------------|-------------------------------------|
| Cernio: browse already-graded jobs    | ✓                                    |
| Cernio: search new jobs               | ✗ (needs ATS endpoints)              |
| Image Browser: search indexed library  | ✓                                    |
| Image Browser: first launch model download | ✗ (one-time)                     |
| Aurix: backtest with synthetic data    | ✓                                    |
| Aurix: live arbitrage detection        | ✗ (needs chain data)                  |
| NeuroDrive: train, simulate            | ✓                                    |

Each project has degraded modes (offline → cannot scrape new ATSes for Cernio; offline → cannot fetch new chain data for Aurix), but the core competency (browsing, searching, training, simulating) works offline.

### Vendor independence

The app does not require any specific external service. If a vendor disappears, the app keeps working.

| Dependency type                       | Vendor-independent?                        |
|---------------------------------------|--------------------------------------------|
| Open-source frameworks (Rust, React)   | ✓                                          |
| Standardised formats (ONNX, JSON)      | ✓                                          |
| Hosted free APIs (Alchemy, subgraphs)  | partial (Aurix has 4-tier fallback)        |
| Single hosted service required          | ✗                                          |

For Aurix, the 4-tier fallback exists specifically because no single hosted service is acceptable as a dependency. If Alchemy shuts down, Aurix routes to the subgraph. If the subgraph shuts down, Aurix routes to public RPC. If everything shuts down, Aurix runs against mocks (tests only).

For Cernio, the ATS endpoints are vendor-dependent in a different way: if Greenhouse shuts down, the data source goes away, but Cernio keeps working on whatever it has stored.

### Cost predictability

$0 per user per query. Not "$0 on the free tier, more if you upgrade." Genuinely zero recurring cost for the core competency.

| Project           | Per-query cost                              |
|-------------------|---------------------------------------------|
| Cernio            | $0 (local Rust + local Claude Code skill)   |
| Image Browser       | $0 (local ONNX inference)                    |
| Aurix             | $0 (free tier APIs only)                     |
| NeuroDrive         | $0 (local Rust simulator)                    |

For Cernio specifically, Claude Code skill calls cost Anthropic API tokens. Estimated cost per full grading run on 1184 jobs: ~$1. For a typical user that runs the grader weekly, $4/month is real. But that is per-user, not per-query, and is metered by how much the user actually uses it.

### Failure isolation

A failure in any external service does not break the app. The app might lose a feature, but not its core function.

For Cernio: if Anthropic's API is down, the grader cannot grade. But the existing graded jobs are still browseable. The user can still navigate the database. The TUI still works. Only the new-grading workflow is affected.

For Aurix: if Alchemy is rate-limiting, the 4-tier fallback kicks in. If all four tiers fail, the app surfaces "data sources unreachable" and stops trying. The user can still view backtests against previously-ingested data.

---

## Cross-project comparison

\`\`\`
                  Local-first dimensions per project

                  Cernio   Aurix   Image    NeuroDrive
                                    Browser
   data ownership  ✓✓       ✓✓     ✓✓      ✓✓
   computation     ✓+API*  ✓       ✓✓      ✓✓
   network indep   partial  partial ✓ (after install) ✓✓
   vendor indep    partial  ✓✓     ✓        ✓✓
   cost            partial* ✓✓     ✓✓       ✓✓
   failure iso     ✓        ✓✓     ✓        ✓✓

   * Cernio uses Claude API for grading; not free, but per-user low-cost
\`\`\`

The honest version of local-first across these projects: Cernio is mostly-local-with-API-augmentation (grading uses Claude). The other three are fully local in the strong sense.

> [!important] **Cernio's tradeoff explicit**
>
> Cernio's grading skill makes Claude API calls. This is the only piece of any of my projects that requires external infrastructure to do its core function. The trade-off was deliberate:
>
>   - Local LLM inference for job grading would require running a 30B+ parameter model locally
>   - That model would either be much worse than Claude (small enough to run locally) or require expensive hardware (large enough to be competitive)
>   - Per-grading cost via API is ~$0.001; the trade-off favours quality over strict locality
>
> The honest framing is "local-first with a deliberate cloud augmentation for one specific quality-critical operation."

---

## What local-first is NOT

A few things "local-first" is often claimed to mean but does not:

| Claim                                             | Truth                                                  |
|---------------------------------------------------|--------------------------------------------------------|
| "Local-first means privacy-respecting"             | Local-first is necessary but not sufficient for privacy |
| "Local-first means slow"                            | Local can be faster than cloud (network latency wins)   |
| "Local-first means no sync"                         | Local-first apps can sync; they just don't require it    |
| "Local-first means open source"                     | The two are orthogonal                                  |
| "Local-first means single-user"                     | Local-first can be multi-user (CRDT-based)              |
| "Local-first means small data"                      | Local-first can handle massive data (databases scale)   |

Local-first is a design property of the architecture, not a feature checklist or a marketing line.

---

## When local-first is the wrong choice

Local-first is not universally right. There are real cases where it is the wrong call:

| Use case                                    | Why local-first does not fit                            |
|---------------------------------------------|--------------------------------------------------------|
| Multi-user real-time collaboration            | Requires server-side conflict resolution                |
| Cross-device sync as the core competency       | The sync IS the product (e.g. Notion, Linear)           |
| Audit / compliance requirements                | Centralised log is the regulatory requirement           |
| LLM inference at SOTA quality                  | The SOTA models do not run locally yet                  |
| Massive-scale data analysis (TB+)              | The compute does not fit on a user's machine            |
| Network effects (the data IS the network)      | Each user only sees their fragment                       |
| Live-streaming media                            | Centralised distribution is the right architecture     |

For these use cases, fighting to be local-first produces a worse product. The right approach is cloud-first or hybrid.

> [!note] **The decision question**
>
> "Should this be local-first?" is not the right question. The right question is: "Which of the six local-first properties (data ownership, computation, network independence, vendor independence, cost predictability, failure isolation) matter for this product, and how much?"
>
> Answer that, and the architecture follows.

---

## Cross-cutting design patterns

A few architectural patterns recur across the four local-first projects:

### Pattern 1: SQLite as the database

\`\`\`
                  SQLite usage across projects

   Cernio:        WAL mode, 5 tables, 325 tests
   Image Browser: WAL mode, 5 tables, 125 tests, batched-embedding writes
   Aurix:         WAL mode, 7+ tables (Vector A), 139 tests
   NeuroDrive:    (no SQLite — analytics use parquet/JSON files)
\`\`\`

SQLite is the right database for local-first apps. Single file. No server. ACID transactions. WAL mode for concurrent reader/writer. The choice is essentially universal once you commit to local-first.

### Pattern 2: Tauri 2 for desktop apps

\`\`\`
                  Tauri stack across projects

   Image Browser: Tauri 2 + React 19 + TS5
   Aurix:        Tauri 2 + React 19 + TS5

   Cernio:        Ratatui TUI (terminal app, not Tauri)
   NeuroDrive:    Bevy game engine (not Tauri)
\`\`\`

Tauri 2 produces small (~80 MB) desktop binaries with full system integration. The same Rust + TS architecture transfers across projects with no major learning curve.

### Pattern 3: Read-only when possible

\`\`\`
                  Read-only discipline

   Cernio:        writes to its own SQLite; never writes to ATS endpoints
   Image Browser: writes to its own SQLite; never writes to source images
   Aurix:         read-only on chain (never submits transactions)
   NeuroDrive:    writes to logs / analytics; never writes to external state
\`\`\`

Read-only at the boundary is a powerful safety property. Cernio cannot submit job applications (you have to copy the URL and apply manually). Aurix cannot send transactions (literally cannot lose your money). The apps are observability tools, not actuators.

This is a deliberate choice. Adding write capability would unlock features (auto-apply, auto-trade) but adds risk (wrong apply, wrong trade). For these projects, the observability-only mode is the right scope.

---

## Why this matters as a portfolio signal

> [!important] **The local-first signal to a hiring manager**
>
> A portfolio of local-first projects signals:
>
>   - Comfort with full-stack desktop development (Tauri, Rust+TS)
>   - Discipline about data ownership and user privacy
>   - Cost-conscious architecture (zero recurring infrastructure)
>   - Ability to design for offline / unreliable network conditions
>   - Resistance to vendor lock-in
>   - Engineering thinking that does not depend on "throw it at the cloud"
>
> These signals matter most for product engineering at companies whose values align (privacy-first products, decentralised systems, on-device AI). They matter less at companies whose architecture is fundamentally cloud-first.

The portfolio is targeted at the first kind of company. The local-first design across multiple projects is part of how the portfolio signals fit.

---

## What I would not do again

A few things I would do differently with the benefit of hindsight:

| Decision                                          | What I would change                              |
|---------------------------------------------------|--------------------------------------------------|
| Cernio's data folder location                      | Use OS conventions consistently (XDG on Linux)    |
| Image Browser's per-launch model verification      | Check checksums on launch to detect corruption    |
| Aurix's silent-fallthrough tier in v1               | Surface active data tier from day one             |
| NeuroDrive's pre-restructure naming                | Use the eventual milestone names from the start   |

The local-first design itself does not have anything I would reverse. The patterns work. The architecture transfers cleanly across projects. The user-visible properties (no recurring cost, full data ownership, offline-capable) are exactly what the design produces.

---

## What is in each project's notes

The architecture decisions for each project's local-first choices live in:

\`\`\`
  Capataina/LifeOS/Projects/<name>/Decisions.md
\`\`\`

Specifically:

| Project       | Decision documents                                        |
|---------------|-----------------------------------------------------------|
| Cernio        | "Local-first with Claude API augmentation"                |
| Aurix         | "Zero paid APIs", "Read-only architecture"                |
| Image Browser   | "On-device ONNX over hosted inference"                     |
| NeuroDrive     | "MacBook Air as deliberate constraint"                     |

Each decision is dated, justified, and (where applicable) revisited if the project's needs changed. The notes are the source of truth for "why local-first?" in each context.

---

## Closing

> [!important] **The principle, stated cleanly**
>
> Local-first is the architectural choice that the user's machine is the primary place where their data lives, where their computation happens, and where their app runs offline. It is not a marketing line; it is a design discipline that produces specific properties at the cost of specific limitations.
>
> Use it where the properties matter. Use cloud-first where the limitations dominate. The decision belongs in your architecture document, not your README's tagline.

For my five projects, four are local-first because the properties (data ownership, offline capability, zero recurring cost) matter for personal tools and analytics. The fifth (Nyquestro) is local-first in scope (single-machine matching engine) but the trading domain has different scaling concerns; if Nyquestro ever went to production, the local-first framing would need to be revisited.

The pattern transfers. The tools (Tauri 2, SQLite, ONNX in Rust, Claude Code skills) work consistently across projects. The discipline (no recurring cost, full data ownership, offline-capable) is uniform. The result is a portfolio where every project earns its place by the same standard.

That is local-first as a design principle. Apply where it fits. Skip where it does not. Document the choice either way.
`,
};
