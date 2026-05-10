import type { Article } from "@/types";

export const portfolioStrategy: Article = {
  slug: "crypto-quant-portfolio-strategy",
  title: "Depth on one vector: the crypto-quant portfolio strategy",
  type: "Article",
  date: "2026-05-09",
  project: "Portfolio",
  description:
    "My 5-project engineering portfolio (Cernio, NeuroDrive, Aurix, Nyquestro, Image Browser) is organised around a deliberate strategy: depth on one project per role-targeted vector, not breadth across many. Why this beats the breadth-first approach for senior engineering interviews, and how each project earns its position in the portfolio.",
  tags: ["career", "portfolio-design", "engineering"],
  body: `# Depth on one vector: the crypto-quant portfolio strategy

I maintain five active engineering projects. Each one has its own GitHub repo, its own roadmap, and its own active development cadence. From the outside this looks like the standard "engineer has lots of side projects" pattern.

It is not. The portfolio is structured deliberately around a single strategy:

> Depth on one project per role-targeted vector. Not breadth across many shallow projects.

This article is about what that strategy is, why I think it works better than the alternative, and how each of the five projects earns its position.

---

## TL;DR

| Project        | Role vector                                 | Depth signal                                  |
|----------------|---------------------------------------------|-----------------------------------------------|
| Aurix          | Crypto-quant / DeFi engineering              | Q64.96 math from scratch, V3 LP backtester    |
| NeuroDrive      | ML research / biological computation         | One-brain-one-lifetime constraint, no backprop|
| Cernio          | Systems / AI-augmented tooling                | 9 specialised AI skills, 325-test audit        |
| Nyquestro       | Low-latency trading / safe Rust                | Lock-free matching, zero unsafe blocks         |
| Image Browser    | Local-first ML applications                   | 3-encoder RRF, on-device inference            |

Each project is the strongest single thing I could build to signal capability in one specific role direction. None of them are "let me have something in every area."

---

## The breadth-first failure mode

The default portfolio shape for an engineer with many interests is:

\`\`\`
                  Breadth-first portfolio

   ┌──────────────────────────────────────────────────────────┐
   │ Web app (React + Node)            ── 2 months work        │
   │ ML demo (Jupyter + Streamlit)     ── 3 weeks work          │
   │ CLI tool (Python + click)         ── 1 week                │
   │ Mobile app (React Native)         ── 6 weeks                │
   │ Game (Unity)                      ── 4 weeks                │
   │ Algo viz (D3)                      ── 1 week                │
   │ ...                                                          │
   └──────────────────────────────────────────────────────────┘

   "I have something in every area I'm interested in"
\`\`\`

This looks impressive at a glance. It fails to land at the level that matters:

| What hiring managers actually look for                | What breadth-first delivers              |
|------------------------------------------------------|------------------------------------------|
| Can this person ship something substantial?           | Maybe — each project is small             |
| Do they understand depth in any specific area?         | Probably not, given the time per project  |
| Can they make hard engineering decisions?              | Hard to tell from a tutorial-shaped repo  |
| Do they have judgement under real constraints?         | Constraints are absent from toy projects  |
| Is the README accurate to the code?                    | Often not, since toys do not get audited  |

Breadth-first portfolios are common, the signal they send is weak, and the work they describe is rarely substantive enough to discuss meaningfully in an interview.

---

## The depth-first alternative

\`\`\`
                  Depth-first portfolio (mine)

   ┌──────────────────────────────────────────────────────────┐
   │ Aurix          ── 10,500 LoC Rust + 9,000 LoC TS           │
   │                  Q64.96 math from scratch                   │
   │                  V3 LP backtester with audit cycle           │
   │                  139 backend tests passing                   │
   ├──────────────────────────────────────────────────────────┤
   │ NeuroDrive      ── 14,000 LoC Rust + ML from scratch        │
   │                  6 milestones shipped, brain-inspired learner│
   │                  133 tests, 21x perf overhaul                │
   ├──────────────────────────────────────────────────────────┤
   │ Cernio         ── 14,000 LoC Rust + 9 AI skills              │
   │                  456 companies, 1184 graded jobs              │
   │                  325 tests, 27-finding audit                  │
   ├──────────────────────────────────────────────────────────┤
   │ Nyquestro       ── safe Rust, lock-free matching             │
   │                  zero unsafe, Coinbase WS integration         │
   ├──────────────────────────────────────────────────────────┤
   │ Image Browser    ── 28 Tauri commands, 3-encoder RRF        │
   │                  125+62 tests, ONNX in Rust                   │
   └──────────────────────────────────────────────────────────┘

   "I have one project at the depth of a senior engineer per role vector"
\`\`\`

Five projects. Each is a serious engineering deliverable. Each targets a specific role direction.

| Property                                          | Depth-first delivers                          |
|---------------------------------------------------|-----------------------------------------------|
| Can this person ship something substantial?       | Yes — five substantial things                  |
| Depth in any specific area?                        | Yes — measurable per project                   |
| Hard engineering decisions?                         | Yes — documented in commit history             |
| Judgement under real constraints?                   | Yes — each project has its own constraints     |
| README accurate to the code?                        | Yes — each project audited                      |

---

## Why "one per vector" specifically

The role-targeted axis is what makes this strategy work. Each project is the strongest single thing I could build to signal capability in one specific role direction.

### Aurix → crypto-quant / DeFi engineering

\`\`\`
                  What Aurix signals for crypto-quant audiences

   ┌─────────────────────────────────────────────────────────┐
   │ Q64.96 fixed-point math implemented from scratch          │
   │ ├─ matches V3's exact on-chain math                       │
   │ ├─ tested against 50+ synthetic fixtures                  │
   │ └─ same representation as Uniswap V3 itself                │
   ├─────────────────────────────────────────────────────────┤
   │ Uniswap V3 LP backtester (M2.0 → M2.8)                    │
   │ ├─ closed-form IL math                                     │
   │ ├─ LVR computation                                          │
   │ └─ adaptive-tercile vol regime classifier                   │
   ├─────────────────────────────────────────────────────────┤
   │ Four-tier free-data fallback (zero paid APIs)              │
   │ ├─ Alchemy → subgraph → public RPC → mock                 │
   │ └─ silent-fallthrough trap documented + fixed              │
   ├─────────────────────────────────────────────────────────┤
   │ Audit cycle: 28 findings, every one shipped                 │
   └─────────────────────────────────────────────────────────┘

   target audience: quant LP desks, Uniswap Labs, DeFi-aware trading firms
\`\`\`

For a crypto-quant role, Aurix says: this person understands V3 math at the same level the protocol itself does, can build serious analytics from scratch, ships in compressed timelines (2 days for Vector A), and audits their own work.

### NeuroDrive → ML research / biological computation

\`\`\`
                  What NeuroDrive signals for ML research audiences

   ┌─────────────────────────────────────────────────────────┐
   │ "One brain, one lifetime" constraint                       │
   │ ├─ no backpropagation in the brain-inspired learner       │
   │ ├─ no weight resets between episodes                       │
   │ ├─ no external ML frameworks (PyTorch, candle, tch-rs)    │
   │ └─ biology-first principle (rule out ML defaults)         │
   ├─────────────────────────────────────────────────────────┤
   │ M4: 21x frame-time improvement, dual GEMM on AMX           │
   │ M5: PopArt, target-KL stopping, observation norm           │
   │ M6: brain-inspired substrate shipped (60 KB source)        │
   ├─────────────────────────────────────────────────────────┤
   │ Real-time control under 16.67 ms frame budget               │
   │ on a MacBook Air with 8 GB unified memory                   │
   └─────────────────────────────────────────────────────────┘

   target audience: ML research labs, biological-plausibility researchers
\`\`\`

For an ML research role, NeuroDrive says: this person can build an entire RL system from scratch in Rust, holds a hard research constraint, ships engineering-grade infrastructure (dual GEMM backend, PopArt, target-KL), and operates at the intersection of biology and ML in a way that is unusual in the field.

### Cernio → systems + AI-augmented tooling

\`\`\`
                  What Cernio signals for systems / AI tooling audiences

   ┌─────────────────────────────────────────────────────────┐
   │ "Scripts for volume, AI for judgement"                     │
   │ ├─ 6 ATS provider integrations (deterministic Rust)        │
   │ ├─ 9 specialised Claude Code skills                        │
   │ └─ rubric-anchored grading across 1184 jobs                │
   ├─────────────────────────────────────────────────────────┤
   │ 22-factor location-evaluation rubric                       │
   │ ├─ three-tier framework                                     │
   │ ├─ 10-agent synthesis pass                                  │
   │ └─ lifestyle modulator                                       │
   ├─────────────────────────────────────────────────────────┤
   │ Session 9: 18 → 325 tests, 27-finding audit                 │
   │ ├─ caught 2 silent data-loss bugs                            │
   │ └─ 4 HIGH-severity findings resolved                         │
   └─────────────────────────────────────────────────────────┘

   target audience: AI infra / agentic systems / Rust systems shops
\`\`\`

For a systems + AI tooling role, Cernio says: this person builds production-grade AI-augmented systems, designs skills with calibration discipline, audits their own code, and ships TUI applications that are actually used daily.

### Nyquestro → low-latency trading / safe Rust

For an HFT or low-latency trading role, Nyquestro says: this person understands wait-free vs lock-free vs blocking, can build a matching engine in safe Rust without unsafe blocks, integrates risk controls and observability from the start, and knows the trade-offs that production trading systems demand.

### Image Browser → local-first ML applications

For a local-first / on-device ML role, Image Browser says: this person ships desktop ML applications in Rust+Tauri, uses ONNX Runtime correctly, integrates multiple encoders via RRF, and handles the boring infrastructure (SQLite WAL tuning, watcher debouncing, model downloads) that makes the product usable.

---

## What "depth on one vector" requires

This strategy is not free. Each project takes serious time:

| Project       | Approximate time invested | Active maintenance        |
|---------------|--------------------------|---------------------------|
| Aurix          | ~6 weeks                 | currently active            |
| NeuroDrive      | ~8 weeks                  | currently active            |
| Cernio         | ~5 weeks                  | currently active            |
| Nyquestro       | ~2 weeks (pre-Phase A)   | next on the queue           |
| Image Browser    | ~6 weeks                  | currently active            |

Total: ~27 weeks of focused engineering effort across the five projects. That is a real time investment. The output is five substantial things rather than fifteen toys.

> [!important] **The trade-off**
>
> Depth-first means saying "no" to the project ideas that would feel productive but would be shallow. The 16th project on the breadth-first list is always tempting; I have to refuse it.
>
> The discipline pays off in the room where a senior engineer asks "tell me about the hardest engineering decision you made on Aurix" — I have a real answer that demonstrates actual depth.

---

## How this maps to interview conversations

\`\`\`
                  Interview readiness per project

   Aurix:        "Tell me about the Q64.96 math implementation"
                 → 20-minute conversation about V3 math, fixed-point
                   arithmetic, the 28-finding audit cycle, the synthetic-
                   first validation strategy

   NeuroDrive:   "Why no backpropagation?"
                 → 30-minute conversation about biological plausibility,
                   three-factor learning rules, eligibility traces,
                   PPO as a diagnostic baseline

   Cernio:        "How do you keep grade quality consistent at scale?"
                 → 25-minute conversation about skill calibration,
                   anchored examples, four iterations of the rubric

   Nyquestro:     "Lock-free vs wait-free — when does each apply?"
                 → 20-minute conversation about per-symbol queues,
                   CAS-based order book updates, tombstone cleanup

   Image Browser: "Why three encoders, why RRF?"
                 → 25-minute conversation about score distribution
                   heterogeneity, Cormack 2009, per-encoder toggle
\`\`\`

Each conversation can go for 20-30 minutes at engineer-to-engineer depth before either party runs out of substance. That is the bar for a senior engineering interview.

A breadth-first portfolio cannot do this. The 5-minute project gets a 5-minute conversation. The 5-week project gets a 30-minute conversation. The 5-month project gets a 60-minute conversation.

---

## The honest framing

> [!important] **What this strategy is NOT**
>
> This is not "I built five products and shipped them to users." Three of the five are personal tools (Cernio, Image Browser, Nyquestro). One is a research project (NeuroDrive). One is a portfolio-targeted backtester (Aurix).
>
> None of them are revenue-generating SaaS. None of them have 10,000 users. The signal they send is not "this person can build a startup" — it is "this person can do serious engineering work."
>
> Different signal, different role match.

For a senior engineering role at a serious technical company, the signal "can do serious engineering work" is the right one. For a startup founder role, the signal would need to be different (revenue, growth, product-market fit).

The portfolio is targeted at the first kind of role. The strategy is honest about what it is and is not signalling.

---

## What this generalises to

The "depth on one vector per role direction" pattern works for any portfolio-building exercise where the audience is senior engineers evaluating capability:

| Audience                                  | Vectors to cover                                       |
|-------------------------------------------|--------------------------------------------------------|
| Quant trading firms                        | math depth, low-latency systems, market data ingestion   |
| ML research labs                            | research thinking, from-scratch implementation, depth   |
| AI infrastructure shops                     | systems work, AI-augmented tooling, evaluation rigour    |
| Startup founders                            | product, growth, customer engagement (different shape)  |
| Engineering management                      | mentorship, team-building (different shape)              |

For each axis, identify the single strongest project you could build to signal capability there. Build that project to genuine depth. Resist the urge to shore up gaps with shallow projects in other directions.

---

## What is on the public side

Each of the five projects has its own GitHub repo and its own articles on this website:

| Project          | GitHub                                                    | Articles                                   |
|------------------|-----------------------------------------------------------|--------------------------------------------|
| Aurix             | github.com/Capataina/Aurix                                | 5 articles in the Aurix series             |
| NeuroDrive         | github.com/Capataina/NeuroDrive                           | 5 articles in the NeuroDrive series        |
| Cernio            | github.com/Capataina/Cernio                                | 5 articles in the Cernio series             |
| Nyquestro          | github.com/Capataina/Nyquestro                            | 2 articles in the Nyquestro series          |
| Image Browser       | github.com/Capataina/PinterestStyleImageBrowser            | 4 articles in the Image Browser series     |

For a hiring manager evaluating any single direction, the path is: pick the matching project, read its articles, look at the code, ask substantive questions. The portfolio is designed to make that path productive.

---

## Closing

Depth on one vector is the strategy. Five projects, five role directions, five substantial deliverables.

The breadth-first alternative is tempting (more checkboxes, more "I have something in every area"), but it does not produce the signal that matters. Senior engineers evaluate other engineers on depth, not breadth. The portfolio that signals depth is the one that survives a substantive technical conversation in the room.

If you are building an engineering portfolio for the kind of role where the conversation will go to engineer-to-engineer depth, this is the strategy I would use. The compounding effect over time is real: each project keeps getting better at depth, and the conversation about it keeps getting more interesting.

That is the bar. Five projects. Each one able to sustain a 30-minute conversation with someone senior. The rest is execution.
`,
};
