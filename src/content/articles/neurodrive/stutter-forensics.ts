import type { Article } from "@/types";

export const neurodriveStutterForensics: Article = {
  slug: "neurodrive-stutter-forensics",
  title: "Stutter forensics: getting eight RL agents under a 60 Hz frame budget on a MacBook Air",
  type: "Dev Log",
  date: "2026-04-16",
  project: "NeuroDrive",
  description:
    "The full story of how NeuroDrive went from 426 stutters per run down to 2, told as the chronological investigation it actually was. Six optimisations, one frame budget, and a deliberately constrained piece of hardware as the forcing function.",
  tags: ["rust", "performance", "ppo", "profiling"],
  body: `# Stutter forensics: getting eight RL agents under a 60 Hz frame budget on a MacBook Air

NeuroDrive is built on a 2022 MacBook Air. Eight CPU cores, an integrated GPU, 8 GB of unified memory shared between everything, and a 60 Hz display. This is a deliberate constraint, not a limitation. The thesis of the project is that biologically-inspired learning rules should run at real-time speeds on modest hardware, because the brain does. If the architecture cannot keep up at 60 frames per second on a MacBook Air, it is the wrong architecture.

That made performance a first-class problem from the start.

## The hardware envelope

| Component       | Detail                                          |
|-----------------|-------------------------------------------------|
| Machine         | MacBook Air (M2, 2022)                          |
| CPU             | Apple M2, 8 cores (4P + 4E) at 3.50 GHz         |
| GPU             | Apple M2, 8 cores at 1.40 GHz (integrated)      |
| Memory          | **8 GB unified** (shared CPU/GPU/everything)    |
| Architecture    | ARM64 (NEON SIMD, no SSE/AVX)                   |
| Display         | 60 Hz                                           |
| Frame budget    | **16.67 ms**                                    |
| Power envelope  | Fan-less; thermal throttling kicks in fast      |

The 8 GB unified memory constraint is the most important fact. CPU and GPU share the same pool. Memory-intensive work (large rollout buffers, trace captures, the renderer) competes for the same bytes. There is no graphics RAM to fall back to. The profiling infrastructure and analytics pipeline must be memory-lean by default. No unbounded buffers.

> [!important] **Frame budget is the forcing function.**
> Every system in the per-tick pipeline has to fit within 16.67 ms across all 8 cars. If any one system blows the budget, the simulator stutters. There is no graceful degradation path; either the frame ships on time or you see the hiccup on screen.

## What stuttering actually looks like

A stutter is not a slowdown. The simulator does not run at 50 Hz instead of 60. What happens is much worse: 90 percent of frames complete on time and look smooth, then one frame takes 47 ms because PPO is doing a chunk update, and that one frame is *visible*.

The eye is exquisitely sensitive to frame-time inconsistency. A single 47 ms hiccup in a stream of 16 ms frames feels like a hard pause.

\`\`\`
frame timing histogram (before optimisation, 426 stutters per run):

  cars=8, ticks=18000, max_steps=512

  6ms  ████████████████████████████████████████████████░ 41%
  8ms  ████████████████████████████████░░░░░░░░░░░░░░░░░ 27%
 10ms  █████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 14%
 12ms  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  7%
 16ms  ▎├ frame budget (16.67 ms)
 17ms  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  4%
 20ms  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  2%
 30ms  █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 1.4%
 47ms  ░ — chunk-update spikes
\`\`\`

The 426 figure comes from a per-run counter that increments every time a frame exceeds the 16.67 ms budget. Most of those were small overruns (17 to 20 ms). The bad ones were 30 to 50 ms when the PPO update happened to land on a heavy chunk.

Profiling showed the cost concentrating in two places:

1. The PPO update's matrix kernel (the inner loop of the network forward and backward passes)
2. The rollout buffer copies that the update needed (the \`PreparedUpdate\` clone)

Everything else (physics, rendering, observation extraction) was already comfortably under budget.

## The PPO chunk update is the boss fight

PPO collects \`max_steps\` (512) transitions across all 8 cars, then runs an update. The update is 4 epochs of forward and backward passes through the network across the buffer.

\`\`\`
                  ┌──────────────────────────────────┐
                  │  Rollout collection (per tick)   │
                  │  8 cars × 1 step = 8 transitions │
                  └────────────────┬─────────────────┘
                                   │ 64 ticks
                                   ▼
                  ┌──────────────────────────────────┐
                  │  Chunk full: 64 × 8 = 512        │
                  │  PPO update fires                │
                  └────────────────┬─────────────────┘
                                   │ 4 epochs
                                   ▼
                  ┌──────────────────────────────────┐
                  │  forward(batch=64) × 4 epochs    │
                  │  backward(batch=64) × 4 epochs   │
                  │  Adam step × 4 epochs            │
                  │  → policy and value updated      │
                  └──────────────────────────────────┘
\`\`\`

With my asymmetric architecture (actor 2x64, critic 2x128), each pass does roughly:

- Forward: 8 cars × 64 steps × (43 → 64 → 64 → 2 actor) + (43 → 128 → 128 → 1 critic)
- Backward: same shape with gradient computation
- Adam step: weight update across every parameter

Multiply by 4 epochs and you get a chunk update that moves a lot of floating point through the CPU. On the wrong layout, every one of those matrix walks misses cache. The update takes 7 to 13 ms depending on the chunk.

> [!warning] **Why "average is fine" is not fine.**
> 7 to 13 ms is fine if it happens during a frame that has nothing else to do. It is catastrophic if it happens during a frame that already has 9 ms of physics, 3 ms of rendering, and 2 ms of analytics work queued up.

So the question became: *how do we make the PPO update small enough that it fits inside a frame, on the worst frame, every time?*

---

## Six things in one commit

Commit \`3c512f9\` is the one that fixed it. Six changes landed together, each addressing a different cost class.

### Map of where the cost was

\`\`\`
chunk update breakdown (before optimisation, ~10 ms total):

  ┌───────────────────────────────────────────────────────┐
  │ matrix multiply (cache-hostile)         ████████████░ │ 6.5ms
  │ heap allocations (per-pass scratch)     █████░░░░░░░░ │ 1.8ms
  │ buffer clone (PreparedUpdate)           ██░░░░░░░░░░░ │ 1.0ms
  │ per-sample iteration (not batched)      ██░░░░░░░░░░░ │ 0.7ms
  │ Adam bias correction (per-param)        ░░░░░░░░░░░░░ │ 0.05ms
  │ everything else                          ░░░░░░░░░░░░ │ 0.05ms
  └───────────────────────────────────────────────────────┘

after optimisation, ~3.5 ms total:

  ┌───────────────────────────────────────────────────────┐
  │ matrix multiply (cache-friendly + AMX)  ████████░░░░░ │ 2.6ms
  │ batched forward/backward overhead       █░░░░░░░░░░░░ │ 0.5ms
  │ buffer swap (zero copy)                 ░░░░░░░░░░░░░ │ ~0
  │ Adam bias precomp                       ░░░░░░░░░░░░░ │ ~0
  │ everything else                          ░░░░░░░░░░░░ │ 0.4ms
  └───────────────────────────────────────────────────────┘
\`\`\`

In rough order of impact, the six changes:

### 1. Flat weight storage

Replaced \`Vec<Vec<f32>>\` for every weight matrix with a single flat \`Vec<f32>\` plus dimensions. This is the change that produces the 43x cache locality improvement that gets quoted everywhere.

The reason it works: \`Vec<Vec<f32>>\` puts every row on a separate heap allocation, and the CPU's prefetcher cannot predict where the next row lives. Flat storage puts all rows in one contiguous buffer, and the prefetcher sails through it.

\`\`\`rust
// Before
struct Layer { weights: Vec<Vec<f32>> }

// After
struct Layer { weights: Vec<f32>, in_dim: usize, out_dim: usize }
\`\`\`

(Full story in [the 43x cache locality article](/?article=neurodrive-43x-cache-speedup).)

### 2. BatchScratch

Forward and backward passes used to allocate fresh \`Vec\`s for intermediate results on every call. With a chunk update doing thousands of forward passes, that is thousands of small allocations and frees per update, all hammering the allocator.

\`\`\`rust
struct BatchScratch {
    activations: Vec<f32>,   // pre-allocated for max batch
    grad_inputs: Vec<f32>,
    grad_weights: Vec<f32>,
}

impl BatchScratch {
    fn new(max_batch: usize, max_dim: usize) -> Self {
        Self {
            activations: vec![0.0; max_batch * max_dim],
            grad_inputs: vec![0.0; max_batch * max_dim],
            grad_weights: vec![0.0; max_dim * max_dim],
        }
    }
}
\`\`\`

Allocate once at construction, reuse forever. Zero allocations on the hot path.

### 3. Batched forward and backward

The original implementation processed each sample in the chunk one at a time. 64 forward passes, 64 backward passes. With batching, the entire chunk goes through in one pass.

| Before              | After                |
|---------------------|----------------------|
| 64 mat-vec products | 1 mat-mat product    |
| 64 function calls   | 1 function call      |
| LLVM unsure         | LLVM auto-vectorises |
| ILP poor            | ILP good             |

Mat-vec multiplies become mat-mat multiplies. LLVM has more room to auto-vectorise. Function call overhead disappears. Instruction-level parallelism improves.

### 4. Iterator-based inner loops

This is the kind of thing that should not matter and does. Hand-written index loops are hard for the compiler to auto-vectorise reliably.

\`\`\`rust
// Hand-written index loop (LLVM struggles to vectorise)
let mut result = 0.0;
for i in 0..n {
    result += weights[i] * input[i];
}

// Iterator chain (LLVM auto-vectorises cleanly)
let result: f32 = weights.iter()
    .zip(input)
    .map(|(w, x)| w * x)
    .sum();
\`\`\`

Iterator chains expressing the same computation are easier. The generated assembly is meaningfully different. No SIMD intrinsics involved, just compiler-friendly idioms.

### 5. Swap instead of clone

\`PreparedUpdate\` used to be constructed with a clone of the rollout buffer.

\`\`\`rust
// Before — O(n) memory and time, every chunk
let prepared = PreparedUpdate::from(self.buffer.clone());

// After — O(1), atomic swap
let mut local = RolloutBuffer::default();
std::mem::swap(&mut self.buffer, &mut local);
let prepared = PreparedUpdate::from(local);
\`\`\`

The buffer is large. The clone was \`O(buffer_size)\` time and memory, every chunk. \`std::mem::swap\` takes the buffer's place: ownership transfers, the original site gets a fresh empty buffer back, no allocation, no copy.

### 6. Adam bias correction precomputation

Adam corrects for moment estimate bias on every parameter using \`1 / (1 - β^t)\` terms. The naive implementation computes those per parameter. Precomputing them once per step using \`f32::powi\` is a small win on its own and a genuine win when combined with the per-parameter Adam loop running through hundreds of thousands of parameters per chunk.

\`\`\`rust
// Per step (NOT per parameter)
let bias_corr_1 = 1.0 - beta1.powi(step);
let bias_corr_2 = 1.0 - beta2.powi(step);

// Inner loop reuses these
for p in &mut params {
    let m_hat = p.m / bias_corr_1;
    let v_hat = p.v / bias_corr_2;
    p.value -= lr * m_hat / (v_hat.sqrt() + epsilon);
}
\`\`\`

---

### How they compose

Five of these are decent optimisations. The flat layout is the one that makes the others land cleanly. With cache-hostile storage, batching does not help (you still miss on every row). With cache-friendly storage, batching, scratch buffers, and iterator loops compound on each other and the kernel ends up running at something close to peak FLOPs for the chip.

> [!note] **The compounding effect**
>
> Optimisation 1 alone: ~3x speedup on the kernel.
> Optimisation 1 + 3 (flat + batched): ~6x speedup.
> Optimisation 1 + 3 + 4 (flat + batched + iterators): ~10x.
> All six combined: ~21x on the chunk update wall-clock.
>
> Without the flat layout, none of the others would have moved the needle meaningfully.

---

## What the numbers say

| Metric                  | Before  | After   | Delta            |
|-------------------------|--------:|--------:|------------------|
| Mean frame time         | 17.3 ms | 9.0 ms  | **48% faster**   |
| Stutters per run        | 426     | 2       | **99.5% drop**   |
| PPO chunk update cost   | 7-13 ms | < 4 ms  | **2-3x faster**  |
| PPO update wall-clock   | 1.0x    | 21x     | **21x faster**   |
| Cache locality factor   | 1.0x    | ~43x    | **headline**     |

Mean frame time dropped from 17.3 ms to 9.0 ms. That is a 48 percent improvement on the simulator's overall budget.

Stutter count dropped from 426 to 2 per run. That is the more important number. Once mean frame time has headroom, the worst-case frames stop landing over budget. The simulator stopped feeling janky.

The PPO update itself dropped from 7 to 13 ms per chunk to consistently under 4 ms, which slots comfortably into a frame even when other systems are busy.

## What this did not solve

The other half of the milestone 4 work was the dual GEMM backend. Once the layout was right, it was time to actually get fast at the matrix multiply itself.

\`\`\`
              before M4              after M4 layout       after M4 + AMX
              (Vec<Vec>)             (flat Vec)            (dual GEMM)
                  │                       │                       │
   matrix         │ ░░░░░░░░░░░░░░░░░░░  │ ████████░░░░░░░░░░  │ ████░░░░░░░░░░░░░░░░
   kernel         │  ~1% of FLOPs        │  ~25% of FLOPs       │  ~85% of FLOPs
   utilisation    │                      │                      │

   strategy:        cache-hostile          cache-friendly,        cache-friendly,
                    pure Rust              auto-vectorised        AMX when sized for it
\`\`\`

The optimisations above made the kernel cache-friendly. Dual GEMM made it bandwidth-friendly: the inner loop now picks between a pure SIMD fallback (NEON intrinsics on Apple Silicon) and Apple's Accelerate AMX instructions when available. AMX is the part of the M-series chips that Apple does not advertise but that exists for matrix workloads. The from-scratch PPO learner uses it through the Accelerate framework.

Combined with the layout fix, the M4 work hit a 21x frame-time improvement on the PPO update itself, measured against the original implementation. That is the number that gets quoted in the project README. The 17.3 ms to 9.0 ms mean frame time figure is the simulator-wide effect, which is smaller because so much of the simulator was already under budget.

> [!important] **Three numbers, three measurements.**
>
> | Number | What it measures |
> |--------|--------------------------------------|
> | **43x** | Cache locality on the matrix kernel |
> | **21x** | Wall-clock speedup on the PPO update |
> | **48%** | Mean frame time across the simulator |
>
> They are all consistent because they measure different layers of the same investigation.

(Full AMX backend story in [the dual GEMM article](/?article=neurodrive-dual-gemm-amx).)

---

## What this changed about how I write Rust

A small set of habits I now reach for first, calibrated against this experience:

### What I changed about defaults

| Habit                  | Before                | After                                       |
|------------------------|-----------------------|---------------------------------------------|
| Matrix storage         | \`Vec<Vec<f32>>\`     | \`Vec<f32>\` + explicit dims                |
| Hot-path scratch       | Allocate per call     | Pre-allocate, reuse                         |
| Hot-path clones        | Default to clone      | Default to swap or borrow                   |
| Inner loop style       | Index-based           | Iterator-based                              |
| Mental model for perf  | "compiler is good"    | "data layout dominates, profile to confirm" |

### The general rule I extracted

> [!important] **The hardware was always going to win the argument.**
>
> The borrow checker does not predict cache misses. The compiler does what you let it do. The only way to know whether a kernel is fast is to profile it and look at the assembly the compiler produced. If you do not, you will ship Rust code that is slower than the equivalent C, not because Rust is slower than C (it is not), but because you wrote the Rust the way the type system wanted and the type system is not the cache.

The simulator runs at 60 Hz with eight cars on a MacBook Air now. The brain-inspired learner from milestone 6 inherits all of these patterns. When milestone 7's brain visualiser ships, it will run alongside the existing learners with budget to spare.

The hardware was the right constraint. It was always going to win the argument.

---

## Reproduction notes

If you want to walk through this for yourself on similar hardware:

\`\`\`bash
# Clone and build with profiling on
git clone https://github.com/Capataina/NeuroDrive
cd NeuroDrive
cargo build --release

# Run the side-by-side trainer with profiling on
./target/release/neurodrive --profile --layout side-by-side --cars 8

# Frame-time histogram lands at:
#   <data_dir>/exports/perf-<timestamp>/report.md
\`\`\`

The profiling system writes a markdown report on exit with the frame-time histogram, the per-system breakdown, and the stutter analysis. That report is how I generated every number in this article.

The full performance arc lives at \`context/notes/performance-tuning-lessons.md\` in the repo. Each optimisation has its commit linked. The reasoning at every step is documented at the time it landed, not retrofitted afterward, which is the only way performance archaeology stays honest.
`,
};
