import type { Article } from "@/types";

export const neurodriveOneBrainOneLifetime: Article = {
  slug: "neurodrive-one-brain-one-lifetime",
  title: "One brain, one lifetime: building biological learning rules into a real-time control task",
  type: "White Paper",
  date: "2026-04-20",
  project: "NeuroDrive",
  description:
    "NeuroDrive's research question, the constraint that defines it (no backprop, no weight resets, no ML frameworks), and the milestone-6 substrate that makes the question answerable. A first-principles look at what changes when you remove the standard machine-learning toolkit from a continuous control problem.",
  tags: ["reinforcement-learning", "biologically-plausible", "rust", "research"],
  body: `# One brain, one lifetime: building biological learning rules into a real-time control task

NeuroDrive is a research project, not a product. It is a Rust simulator that drops a single learning agent into a top-down 2D racing environment modelled on the Monaco Grand Prix circuit, and asks whether biologically plausible learning rules can produce coherent driving behaviour.

The framing matters. There is a version of this project that would be uninteresting: train a neural network with backpropagation to drive a car around a track. That problem was solved in the early 2010s by everyone who ever ran an OpenAI Gym tutorial. NeuroDrive deliberately rules out the tools that make that problem easy.

This article explains what got ruled out, why, and what was put in its place.

---

## The research question

> Can biologically plausible learning rules, meaning local synaptic plasticity, eligibility traces, reward-gated updates, homeostasis, and structural adaptation, produce coherent autonomous driving behaviour in a real-time continuous control task, given a single agent that learns continuously across its entire lifetime, and given no backpropagation?

Each constraint in that sentence rules out a piece of the standard machine-learning toolkit.

### The constraint table

| Constraint                   | Rules out                                  | Why                                              |
|------------------------------|--------------------------------------------|--------------------------------------------------|
| Local synaptic plasticity    | Backpropagation                            | Real neurons have no global error signal         |
| Eligibility traces           | Instant credit assignment                  | Biology bridges time gaps with synaptic memory   |
| Reward-gated updates         | Pure supervised learning                   | Brain learns from reward, not labels             |
| Homeostasis                  | Unbounded weight growth                    | Real neurons stay in healthy firing ranges       |
| Structural adaptation        | Fixed topology                             | Real brains rewire across a lifetime             |
| One agent, one lifetime      | Episode resets, population methods         | Catastrophic forgetting is the *problem*          |
| No backprop                  | Gradient-based learning in the brain net   | The mechanism is what is being tested            |
| No external ML frameworks    | PyTorch, tch-rs, candle                    | No library can hide a bad assumption             |

### What "local" means in practice

\`\`\`
                          backpropagation:

   loss ──▶ ∂loss/∂out ──▶ ∂loss/∂h2 ──▶ ∂loss/∂h1 ──▶ ∂loss/∂w
                              ▲              ▲             ▲
                              │              │             │
                              └──────────────┴─────────────┘
                              every layer needs the global signal
                              propagated backward via chain rule


                      three-factor learning:

      pre  ──── trace builds ───▶  post
       │            (Hebbian)         │
       │                              │
       └──── ambient dopamine ────────┘
              (modulator)
                    │
                    ▼
              update rule:
        Δw = η × pre × post × dopamine
              (every term is local to the synapse)
\`\`\`

The brain's synapses do not have access to a global error signal. They update their weights based on what fired before them (presynaptic activity), what fired after them (postsynaptic activity), and ambient neuromodulators (mostly dopamine in real systems). NeuroDrive uses local rules only.

---

## The biology-first principle

The single most load-bearing decision in NeuroDrive is what to do when the brain-inspired learner runs into a problem.

> [!important] **The thesis as a constraint**
>
> When NeuroDrive hits a pathology, the answer comes from biology, not from the ML toolkit. If biology does not have a clear answer, the response is to research the biology more. Not to fall back on ML defaults.

This rules out reaching for dropout, batch norm, experience replay, Elastic Weight Consolidation, or any other ML-toolkit default as a response to a pathology unless it has a direct biological analogue.

| Pathology              | ML default                  | Biology default                                |
|------------------------|-----------------------------|------------------------------------------------|
| Activation saturation  | Layer norm, batch norm      | Synaptic scaling, intrinsic excitability       |
| Catastrophic forgetting| EWC, replay buffers          | Sleep replay, hippocampal consolidation        |
| Vanishing gradients    | Skip connections, ReLU       | (no analogue — biology does not use gradients) |
| Exploration collapse   | Entropy bonuses              | Stochastic neurotransmitter release            |
| Slow learning          | Larger batch, higher LR     | Eligibility traces, neuromodulation gain       |

The discipline cost is real. Sometimes biology has a clear analogue (synaptic scaling for saturation). Sometimes it does not (long-horizon credit assignment is not solved in biology either; it is an active research question). The harder problems do not get a quick fix. They get logged and moved into the long-term roadmap.

The value is in the negative space. Most "biologically inspired" ML papers reach for the ML toolkit at the first sign of trouble. What gets published is a system that looks biological in its top-line claim and is mostly the standard toolkit underneath. NeuroDrive does not allow that move.

---

## What milestone 6 actually shipped

The brain-inspired substrate landed in master on April 19, 2026. Code lives at \`src/brain/inspired/\`:

\`\`\`
src/brain/inspired/
├── config.rs        — hyperparameters, defaults
├── forward.rs       — neuron activation, message passing
├── graph.rs         — sparse topology, slot-stable storage
├── homeostasis.rs   — synaptic scaling + intrinsic excitability
├── plasticity.rs    — three-factor rule + eligibility traces
├── structural.rs    — continual-backprop utility tracking
└── mod.rs           — top-level brain struct, lifecycle
\`\`\`

Roughly 50 KB of source and 30 KB of tests. The substrate has these pieces:

### Component table

| Component               | What it does                                       | Biological analogue                |
|-------------------------|----------------------------------------------------|------------------------------------|
| Sparse graph topology   | Network is a directed graph, not layered           | Cortical microcircuits             |
| Three-factor plasticity | \`Δw = pre × post × modulator\`                    | Dopamine-modulated Hebbian         |
| Eligibility traces      | Per-synapse memory, decays at λ = 0.992            | Calcium-mediated trace dynamics    |
| Raw-reward modulator    | v1 uses raw reward as third factor                 | Phasic dopamine release            |
| Synaptic scaling        | Normalises incoming weights to target range        | Tumor necrosis factor α-mediated   |
| Intrinsic excitability  | Per-neuron threshold adjusts to firing rate        | Voltage-gated channel modulation   |
| Continual backprop CBP  | Replaces low-utility connections                   | Pruning + neurogenesis             |

### The three-factor rule, written out

\`\`\`
plasticity (per synapse, per tick):

   trace_t = λ · trace_{t-1} + pre_t · post_t

   when reward signal arrives:
       Δw = η · trace_t · M(reward)

   where:
       λ = 0.992       (trace decay, ≈ 125-tick half-life)
       η = learning rate
       M = modulator function (v1: raw reward, v8: TD-error sign)
\`\`\`

The trace builds up while pre and post co-fire. When reward arrives, only synapses with non-zero traces get updated. Without reward, the trace decays back to zero and nothing happens.

### Sparse topology, stable slots

The network is not layered. Neurons are nodes in a directed graph with sparse connectivity. The storage uses a slot-stable design with an \`alive\` flag and free-lists, so neuron and synapse identifiers stay stable even as the graph changes shape:

\`\`\`rust
struct Brain {
    neurons: Vec<NeuronSlot>,        // alive flag + state
    synapses: Vec<SynapseSlot>,      // alive flag + state
    free_neurons: Vec<NeuronId>,     // recyclable IDs
    free_synapses: Vec<SynapseId>,
    activity: ActivityBuffer,         // rate-coded outputs
}

struct NeuronSlot {
    alive: bool,
    threshold: f32,                  // intrinsic excitability
    activity_avg: f32,                // for homeostasis target
    incoming: SmallVec<SynapseId>,
    outgoing: SmallVec<SynapseId>,
}

struct SynapseSlot {
    alive: bool,
    pre: NeuronId,
    post: NeuronId,
    weight: f32,
    trace: f32,                       // eligibility trace
    utility: f32,                     // CBP score
}
\`\`\`

New connections sprout based on activity correlations. Low-utility connections get pruned. The topology evolves during training.

---

## What is deliberately not in version one

A few things that look like they should be in a "biological brain" implementation are explicitly deferred.

### The deferral table

| Deferred mechanism            | Why                                              | Lives in                |
|-------------------------------|--------------------------------------------------|-------------------------|
| STDP (spike-timing-dependent) | Requires LIF neurons + sub-tick scheduling       | Long-Term Plan          |
| Multiple neuron types         | Dale's law adds significant complexity            | Long-Term Plan          |
| Sleep / replay consolidation  | Worth doing once forgetting becomes the bottleneck | Long-Term Plan          |
| Multi-region architecture     | A full cortex/BG/hippocampus stack is its own project | Research Frontier  |
| Dendritic compartments        | Single-compartment neurons enough for v1          | Research Frontier       |
| Glial cells                   | Astrocytes modulate plasticity; v1 ignores them  | Research Frontier       |

Each future milestone names a biological mechanism AND a pathology it addresses. Items get pulled forward when a pathology motivates them, not before.

### Why the rate-coded version one works without STDP

Real STDP cares about the millisecond-scale firing-time difference between pre- and post-synaptic neurons. Implementing that requires:

1. Leaky-integrate-and-fire (LIF) neurons (not rate-coded)
2. Sub-tick scheduling (not 60 Hz frame-aligned)
3. Spike trains and exact timestamps

Version one uses a rate-coded approximation. The Hebbian rule reads:

\`\`\`
pre  = activity[source] from previous tick
post = activity[target] from current tick
\`\`\`

That gives STDP-*like* causal semantics (presynaptic activity precedes postsynaptic) without the architectural cost of LIF + sub-tick scheduling. It is not the same thing. It is the closest approximation that fits the budget.

---

## The milestone roadmap

The post-restructure milestone structure:

\`\`\`
M1  Environment + keyboard controller            [✓ complete]
M2  PPO baseline from scratch                    [✓ complete]
M3  Multi-car + analytics pipeline               [✓ complete]
M4  Performance overhaul (21× frame-time)        [✓ complete]
M5  Critic target-scaling (PopArt, γ, t-KL)      [✓ complete]
M6  Brain-inspired v1 — the substrate            [✓ shipped, behavioural pending]
M7  Brain visualisation                          [→ next]
M8  Brain-inspired v2 — plastic value predictor  [   queued]
M9  Multi-neuromodulator refinement              [   queued]

Long-Term Plan (ordering flexible, pathology-driven):
    • Dale's law
    • Synaptic delays
    • Short-term synaptic dynamics (Tsodyks-Markram)
    • Multiple neuron types
    • Sleep/replay consolidation
    • Spiking neurons + STDP

M10 Evaluation (multi-track, transfer)            [   eval phase]
M11 Writeup / release preparation                 [   final]

Research Frontier (out of scope, not forgotten):
    • Dendritic compartments, glial cells
    • Multi-region architecture
    • Developmental programs / critical periods
    • Embodied proprioception, evolutionary priors
\`\`\`

---

## What this proves if it works

The thing being tested is whether biological learning is sufficient for non-trivial continuous control. "Sufficient" is a high bar. It does not mean "matches PPO exactly." PPO is a global, gradient-based, well-tuned algorithm with decades of optimisation behind it. The brain-inspired learner is using local rules with no global error signal, no batch updates, no replay buffer, and no separate target network.

### The success criteria

| Criterion                              | PPO (baseline)     | Brain-inspired (target)            |
|----------------------------------------|--------------------|------------------------------------|
| Completes Monaco loop                  | ✓ all 8 cars       | demonstrate convergence             |
| Lap-time consistency                   | ±1.1% spread       | reasonable, not necessarily match   |
| Crash rate (best chunks)               | 56%                | improving over training             |
| Anticipatory throttle release          | 96% of crashes      | demonstrate predictive behaviour    |
| Catastrophic forgetting resistance     | not tested         | retain after track variation        |
| Compute envelope                       | 60 Hz, 8 cars      | same                                |

If the brain-inspired learner produces a fleet that completes Monaco laps with reasonable consistency and reasonable lap times, that is the result. It does not need to beat PPO. It needs to demonstrate that the mechanism (local rules plus neuromodulation plus homeostasis plus structural plasticity) is enough to drive a non-trivial continuous control task to convergence.

> [!note] **Failure modes are informative.**
>
> If the brain-inspired learner fails, the way it fails points at the missing mechanism.
>
> | Failure shape                  | Likely missing mechanism      |
> |--------------------------------|-------------------------------|
> | Activation collapse / saturation| Homeostasis tuning           |
> | Plateau without progress       | Long-horizon credit (M8 TD)   |
> | Performance drop on track variant | Replay / consolidation     |
> | Topology lock-in               | Structural plasticity gain    |
>
> Each failure mode is a research lead, not a project killer.

---

## Why this is on a portfolio site

NeuroDrive does not look like the projects most engineers ship. There is no SaaS revenue, no million-user product, no clean before-and-after comparison.

What it has:

- A research question with a clean problem statement
- A well-defined constraint set the project actually honours
- An honest implementation that does not cheat by reaching for the ML toolkit
- A fleet of cars that demonstrably complete a non-trivial track under the baseline
- A brain-inspired substrate that is shipped code, with behavioural validation as the next milestone

If you are evaluating engineers based on what they choose to work on when no one is watching, this is a useful signal. The constraint set is hard. The implementation is from scratch. The discipline of "look at biology first" is unusual in ML work and is what makes the eventual answer (whatever it turns out to be) interesting rather than obvious.

NeuroDrive runs at 60 Hz on a MacBook Air with eight cars in flight. The biological constraint is the project's thesis, not a marketing line. Whether the thesis holds up is the question milestone 7 onwards is built to answer.

---

## References

The literature this work is anchored against:

| Topic                          | Reference                                         |
|--------------------------------|---------------------------------------------------|
| Three-factor learning rules    | Frémaux & Gerstner (2016), Lisman (2018)          |
| Eligibility traces in RL       | Sutton & Barto (Reinforcement Learning, ch. 12)   |
| Continual backpropagation      | Dohare et al. (2024)                              |
| Hebbian rate-coded learning    | Gerstner et al. (Neuronal Dynamics, ch. 19-20)    |
| Synaptic scaling               | Turrigiano (2008), Tetzlaff et al. (2011)         |
| PPO baseline                   | Schulman et al. (2017)                            |
| PopArt adaptive normalisation  | van Hasselt et al. (2016)                         |
| Dead-neuron rate in ReLU MLPs  | Andrychowicz et al. (2020)                        |

The full reading list lives in \`context/references/\` in the repo, organised by milestone.

---

The project is open. The code is at [github.com/Capataina/NeuroDrive](https://github.com/Capataina/NeuroDrive). The thesis is testable. The next milestone is a behavioural training run that will produce the first real evidence either way. Whatever happens, it will be measurable, because PPO is right there as the diagnostic baseline.
`,
};
