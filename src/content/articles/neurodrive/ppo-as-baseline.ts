import type { Article } from "@/types";

export const neurodrivePpoAsBaseline: Article = {
  slug: "neurodrive-ppo-as-baseline",
  title: "PPO as a diagnostic baseline, not a target",
  type: "Article",
  date: "2026-04-23",
  project: "NeuroDrive",
  description:
    "Why the PPO learner in NeuroDrive is permanent infrastructure rather than scaffolding waiting to be torn down. The case for keeping a working baseline running alongside experimental work, even (especially) when the experimental work is the point.",
  tags: ["reinforcement-learning", "ppo", "engineering-discipline"],
  body: `# PPO as a diagnostic baseline, not a target

NeuroDrive's plan, as originally written, had PPO and the brain-inspired learner in sequence. PPO would prove the environment was learnable. Then PPO would be retired. Then the brain-inspired learner would be the only thing in the codebase, and the project would be about whether biological rules can drive a car around a track.

That plan was wrong.

The post-restructure plan, locked in on April 19, 2026, has PPO permanently alive. Both learners run in the same simulator. They share the environment, the observation vector, and the reward function. The trainer layout that gets used most often is \`SideBySide { ppo: 8, brain: 8 }\`: eight PPO agents and eight brain-inspired agents on the same track, learning at the same time, observable in the same telemetry pipeline.

This article is about why that change matters and why it is more general than NeuroDrive.

---

## What PPO is doing in this project

PPO does three jobs, simultaneously, every run:

\`\`\`
                          ┌─────────────────────────┐
                          │  PPO agent (permanent)  │
                          └─────────────┬───────────┘
                                        │
                ┌───────────────────────┼───────────────────────┐
                ▼                       ▼                       ▼
   ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
   │ 1. Environment      │ │ 2. Diagnostic       │ │ 3. Comparative      │
   │    validation       │ │    baseline         │ │    reference        │
   ├─────────────────────┤ ├─────────────────────┤ ├─────────────────────┤
   │ "is the environment │ │ "is a failure in    │ │ "how does the brain │
   │  even learnable?"   │ │  the new learner    │ │  learner stack up   │
   │                     │ │  or in the env?"    │ │  against a known-   │
   │                     │ │                     │ │  working algorithm?"│
   └─────────────────────┘ └─────────────────────┘ └─────────────────────┘
\`\`\`

| Job                       | What it answers                                                |
|---------------------------|----------------------------------------------------------------|
| Environment validation    | "Is the Monaco track + reward function actually learnable?"    |
| Diagnostic baseline       | "If both learners stop converging, did the environment break?" |
| Comparative reference     | "Is the brain-inspired result good in absolute terms?"         |

None of those three jobs go away when the brain-inspired learner ships. PPO is needed forever, because every change to the environment, every refactor of the simulator, every new milestone is a chance for something to break. The PPO baseline is the canary that tells you the environment is still healthy.

---

## The cost of pretending PPO is scaffolding

There is a recurring failure mode in research projects:

\`\`\`
month 0:    baseline built, runs reliably, useful for validation
month 3:    no one runs the baseline anymore (busy with the new thing)
month 6:    baseline does not even compile (refactors broke it)
month 9:    the new thing is doing weird things; nobody can run the baseline
            to see whether the weird thing is in the algorithm or the env
month 12:   "we should rebuild the baseline" — but who has time?
\`\`\`

The fix is to refuse to treat the baseline as scaffolding from the start. PPO is not in NeuroDrive because it might be useful later; it is there because it is permanently part of the diagnostic loop. Every PR that touches the environment runs PPO. Every refactor of the simulator runs PPO. Every milestone gets a PPO regression check.

> [!important] **The trade-off**
>
> This is more work in the short term than not doing it. The dual codebase has to be maintained. The trainer layouts have to support side-by-side. The analytics pipeline has to produce comparable numbers for two different learning algorithms.
>
> It is also dramatically less work in the long term than the alternative: debugging an experimental learner in isolation, where every failure could be the environment, the reward, the algorithm, or the implementation, with no ground-truth reference to disambiguate.

---

## What PPO actually looks like in the codebase

The PPO learner is hand-written Rust. No external ML framework. Asymmetric actor-critic.

### Network architecture

\`\`\`
Actor (policy)              Critic (value)
─────────────              ──────────────
obs[43] ─▶ Linear(43, 64)   obs[43] ─▶ Linear(43, 128)
        ─▶ tanh                     ─▶ tanh
        ─▶ Linear(64, 64)           ─▶ Linear(128, 128)
        ─▶ tanh                     ─▶ tanh
        ─▶ Linear(64, 2)            ─▶ Linear(128, 1)

       μ_steer μ_throttle               V(s)
       + log_std (learned)
\`\`\`

The asymmetry is deliberate. The critic uses 2x128 hidden layers, double the actor's 2x64. This was added after discovering 40.6 percent tanh saturation in a symmetric 2x64 critic; the wider critic gives more value-prediction capacity.

### Hyperparameters

| Parameter            | Value      | Notes                                    |
|----------------------|-----------:|------------------------------------------|
| \`gamma\`            | 0.99       | High discount: values long-term reward   |
| \`gae_lambda\`       | 0.95       | Bias-variance trade-off                  |
| \`clip_epsilon\`     | 0.2        | PPO clipped surrogate                    |
| \`ppo_epochs\`       | 4          | Per rollout                              |
| \`max_steps\`        | 512        | Total transitions across all cars        |
| Actor LR             | 3e-4       | Adam (no weight decay)                   |
| Critic LR            | 5e-4       | **AdamW with weight decay 3e-4**         |
| Entropy coef         | 0.01       | Applied to log-std gradient              |
| log_std floor        | **−1.0**   | Min sigma ≈ 0.37 (prevents collapse)     |
| Adam ε               | 1e-5       | Increased from 1e-8 for stability        |
| Gradient clip        | 0.5        | L2 norm, applied separately              |

The interesting parts of the implementation are not the equations. They are well documented in the original PPO paper. The interesting parts are the pieces that come from running the thing on a real-time simulator on modest hardware.

### What was tuned the hard way

| Issue observed              | Symptom                              | Fix that landed                      |
|-----------------------------|--------------------------------------|--------------------------------------|
| Dead neurons (ReLU)         | 34-57% of hidden units always zero   | Switch to tanh activations           |
| Throttle exploration collapse| sigma → 0.07; no cornering           | Raise log_std floor from -2 to -1    |
| Critic saturation           | 40.6% tanh saturation; bad crash V   | Widen critic to 2x128, add weight decay |
| Unbounded value scale       | LR re-tuning every reward change      | PopArt adaptive normalisation        |
| Myopic behaviour            | No anticipation of corners 4 ahead   | Raise gamma 0.99 → 0.995             |
| Policy drift mid-update     | Late epochs hurt more than helped    | Target-KL early stopping             |

Each of those is a calibration that came from a specific failure mode the project hit during M5. None of them are exotic; they are all in the PPO literature. The point is that they are all real fixes to real problems on this specific task. The PPO baseline is not "naive PPO." It is a calibrated PPO that learns Monaco reliably, and that is what makes it valid as a diagnostic baseline.

### The validation run

The M5 validation (\`reports/analytics/run_1776556719.md\`) confirmed:

\`\`\`
fleet performance:

  cars completing full Monaco loop:        8 / 8        ✓
  fleet max-progress spread:               1.1%          ✓
  crash rate (final chunk):               56%            ✓
  crash rate (first chunk):              100%

  crash anticipation analysis:
    crashes with throttle release > 0.25s before impact:    96%
    crashes with throttle release < 0.25s before impact:     4%
    → policy is anticipating crashes, not just reacting
\`\`\`

That is the bar the brain-inspired learner has to clear, on the same environment, with no backprop and no global error signal.

---

## What this changes about how I think about research projects

> [!important] **The general principle**
>
> Any time the project's experimental work needs an environment to run in, build a working baseline that runs in the same environment, and treat it as permanent infrastructure.
>
> The baseline is not a competitor to the experimental work. It is the instrument that makes the experimental work measurable.

This applies far beyond reinforcement learning.

| Domain                  | Baseline candidate                     |
|-------------------------|----------------------------------------|
| Compiler optimisations  | The existing optimisation pass          |
| Ranking models          | The existing ranker                     |
| Database engines        | SQLite, Postgres, the prior version     |
| Image classifiers       | A standard backbone (ResNet, ViT)       |
| Web frameworks          | The prior framework or "bare HTTP"      |
| Build systems           | Bazel, the existing build               |

The baseline does not need to be sophisticated. It needs to work and to keep working.

When the new thing produces a result, the question "is the result good?" is meaningless without the baseline running in the same conditions. With the baseline, the question becomes "what did the new thing buy us?" That is the question worth answering.

---

## What this means for the brain-inspired learner

The brain-inspired learner does not need to outperform PPO to count as a successful research result.

| Asymmetry              | PPO                                | Brain-inspired                          |
|------------------------|------------------------------------|------------------------------------------|
| Error signal           | Global (chain-rule backprop)       | Local (presynaptic × postsynaptic × DA)  |
| Update timing          | Batch (every chunk)                 | Continuous (every tick, gated by reward) |
| Value learning         | Critic + bootstrapping              | Plastic value predictor (M8)             |
| Network capacity       | Dense MLP                            | Sparse evolving graph                    |
| Catastrophic forgetting| Solved by re-training               | Has to handle it through homeostasis     |
| Decades of tuning      | Yes                                 | No                                       |

PPO has every advantage. The brain-inspired learner is using local rules with no global error signal, no batch updates, and a fundamentally different mechanism.

What the brain-inspired learner needs to do is converge to a coherent driving policy under those constraints. That is the research question. The PPO baseline is the existence proof that this environment is learnable; the brain-inspired learner has to demonstrate that biological rules are sufficient for it.

When that result lands (positively or negatively), it will be measurable because PPO is right there, on the same track, with the same reward, producing the same telemetry.

> [!note] **The honest framing**
>
> If the brain-inspired learner converges to within 30 percent of PPO's lap times, that is a strong positive result. The mechanism (local rules) is sufficient for non-trivial continuous control.
>
> If it converges but takes 10x longer, that is still a positive result with a caveat: sufficient but slower.
>
> If it does not converge at all, the failure mode (which mechanism is missing? what pathology emerges?) is the research output. Each failure mode points at a specific milestone in the long-term plan.

That is the value of keeping the baseline alive. Every result is interpretable.

---

## The discipline cost in numbers

The dual-codebase overhead in NeuroDrive:

| Cost class                              | Cost                                         |
|-----------------------------------------|----------------------------------------------|
| PPO source code maintenance             | ~5,000 LOC, low churn after M5               |
| Trainer layout abstraction              | F4 cycle + ZST markers, ~800 LOC             |
| Analytics dual-pipeline                 | Same telemetry events, separate aggregation  |
| CI runtime (PPO regression test)        | ~3 minutes per PR                            |
| Cognitive load                          | Two algorithms in head when refactoring env  |

Total amortised cost: meaningful, but small compared to the cost of debugging the brain-inspired learner without a baseline. The math works out clearly in favour of keeping PPO alive.

The NeuroDrive milestone roadmap explicitly schedules PPO regression checks at every environment change. M7 (brain visualiser), M9 (multi-neuromodulator), M10 (multi-track evaluation) all have a PPO regression step in their acceptance criteria. The baseline does not get to bit-rot because the project structure prevents it.

---

## Closing

The PPO learner in NeuroDrive is not retired and never will be. It is permanent infrastructure. It exists because the brain-inspired learner is what the project is about, and the brain-inspired learner cannot be evaluated honestly without a known-working reference running alongside it.

If you are running a research project, the question to ask early is: what is my baseline, and how do I keep it healthy as the experimental work moves? The answer is rarely zero work, and almost always less work than the alternative.

The thing that is worth measuring is what the new approach buys you. You cannot measure that without the baseline. So you keep the baseline alive.

That is the whole argument. PPO stays.
`,
};
