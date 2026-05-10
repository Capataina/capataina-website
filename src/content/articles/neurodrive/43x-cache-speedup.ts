import type { Article } from "@/types";

export const neurodrive43xCacheSpeedup: Article = {
  slug: "neurodrive-43x-cache-speedup",
  title: "43x cache locality from one data layout change",
  type: "Case Study",
  date: "2026-04-15",
  project: "NeuroDrive",
  description:
    "The single change that took NeuroDrive from 426 stutters per run down to 2, and the lesson it surfaced about idiomatic Rust collections: Vec<Vec<f32>> is honest about the data, terrible about the cache.",
  tags: ["rust", "performance", "ppo", "cache locality"],
  body: `# 43x cache locality from one data layout change

NeuroDrive runs on a 2022 MacBook Air with 8 GB of unified memory and a 60 Hz display. The frame budget is 16.67 milliseconds. Eight reinforcement-learning agents share that budget with the simulator's physics, the renderer, the analytics pipeline, and a from-scratch PPO learner that updates every chunk of rollout data the agents collect.

For the first few weeks of the project the simulator stuttered. Hard.

A typical run logged 426 frame-time spikes against a fleet of 8 cars, with mean frame time at 17.3 ms (over budget), and the source of every spike traced back to the PPO learner's matrix operations.

Then I changed one data structure and everything got better.

## TL;DR

| Metric                  | Before  | After   | Delta            |
|-------------------------|--------:|--------:|------------------|
| Stutters per run        | 426     | 2       | **99.5% drop**   |
| Mean frame time         | 17.3 ms | 9.0 ms  | **48% faster**   |
| PPO update cost / chunk | 7-13 ms | < 4 ms  | **2-3x faster**  |
| Cache locality factor   | 1x      | ~43x    | **headline win** |

The headline change was a switch from \`Vec<Vec<f32>>\` to a flat \`Vec<f32>\` for every weight matrix in the network. Five other optimisations stacked on top of it. The flat layout is the one that made the others land.

> [!important] The 43x is cache locality on the matrix kernel itself.
> The wall-clock improvement on the simulator (the 48 percent figure) is smaller because so much of the simulator was already under budget. Both numbers are real; they measure different layers of the same investigation.

---

## What the network looks like

NeuroDrive's PPO agent uses a from-scratch Rust implementation. No \`tch\`, no \`candle\`, no PyTorch. Every component (the network, the optimiser, the gradient computation, the matrix multiply backend) is written by hand.

\`\`\`
                   Actor (policy)              Critic (value)
                   ╭──────────╮                ╭──────────╮
   obs[43] ──────▶ │  43→64   │     obs[43] ──▶│  43→128  │
                   │   tanh   │                │   tanh   │
                   ╰──────────╯                ╰──────────╯
                        │                            │
                        ▼                            ▼
                   ╭──────────╮                ╭──────────╮
                   │  64→64   │                │ 128→128  │
                   │   tanh   │                │   tanh   │
                   ╰──────────╯                ╰──────────╯
                        │                            │
                        ▼                            ▼
                   ╭──────────╮                ╭──────────╮
                   │  64→2    │                │ 128→1    │
                   ╰──────────╯                ╰──────────╯
                        │                            │
                  μ_steer μ_throttle              V(s)
\`\`\`

The interesting part is not the architecture. It is the math the architecture demands. Every PPO update walks the rollout buffer, runs forward passes, computes gradients, and updates weights.

With 8 cars and a rollout horizon of 512 steps, every update is a large batch of small matrix multiplies and the network is touched repeatedly across each one. When the kernel is slow, the simulator stutters. When the kernel is in the cache, it flies.

---

## Why \`Vec<Vec<f32>>\` is the natural choice and the wrong one

A 64 by 43 weight matrix in Rust seems obviously like \`Vec<Vec<f32>>\`. Each row is a vector. The matrix is a vector of rows. You index with \`weights[i][j]\`. The type system knows the shape. Iterating across rows is a plain \`for row in &weights\`. It looks the way matrices are written in textbooks.

\`\`\`rust
// The "obvious" representation
struct Layer {
    weights: Vec<Vec<f32>>,  // [out_dim][in_dim]
}

impl Layer {
    fn forward(&self, input: &[f32]) -> Vec<f32> {
        self.weights.iter()
            .map(|row| row.iter().zip(input).map(|(w, x)| w * x).sum())
            .collect()
    }
}
\`\`\`

This compiles. It runs. It produces correct output. It is also a small disaster for cache locality.

### What \`Vec<Vec<T>>\` looks like in memory

\`Vec<T>\` in Rust holds a heap-allocated buffer. \`Vec<Vec<T>>\` is a heap-allocated buffer of \`Vec<T>\` headers. Each row's data lives in a separate heap allocation, and those allocations land wherever the allocator can fit them. Two rows of weights might be 4 KB apart, or 4 MB apart, or anywhere in between.

\`\`\`
Vec<Vec<f32>> on the heap:

  outer Vec ──▶ ╭─────╮ ╭─────╮ ╭─────╮ ╭─────╮ ...
                │ ptr │ │ ptr │ │ ptr │ │ ptr │
                │ len │ │ len │ │ len │ │ len │
                │ cap │ │ cap │ │ cap │ │ cap │
                ╰──┬──╯ ╰──┬──╯ ╰──┬──╯ ╰──┬──╯
                   │       │       │       │
                   ▼       ▼       ▼       ▼
               ╭───────╮  ╭───────╮  ╭───────╮  ╭───────╮
               │ row 0 │  │ row 1 │  │ row 2 │  │ row 3 │
               │  data │  │  data │  │  data │  │  data │
               ╰───────╯  ╰───────╯  ╰───────╯  ╰───────╯
                  page A    page F    page C    page Q
\`\`\`

When the matrix multiply walks across rows, the CPU prefetcher tries to do its job. It reads the current row, predicts the next one, and starts pulling that into L1 cache before the loop reaches it. With \`Vec<Vec<f32>>\`, the next row is on a different page. The prefetcher's prediction is wrong every time. Every row transition is a fresh cache miss.

A 64 by 43 row scan with random heap layout looks roughly like this in cycle counts:

| Operation              | L1 hit | L2 hit | L3 hit | RAM miss |
|------------------------|-------:|-------:|-------:|---------:|
| Cycles                 | ~4     | ~12    | ~35    | ~80-100  |
| Cost per row (good)    | ~250   | ~750   | ~2.2k  | ~5k      |
| Cost per row (bad)     | always | almost | rarely | every    |

With \`Vec<Vec<f32>>\`, the row layout is unpredictable enough that even L2 prefetching does not help reliably. You pay close to the RAM-miss cost on every row transition.

### What flat layout looks like in memory

Compare to a flat layout where every row is contiguous in one buffer:

\`\`\`
Vec<f32>, [out_dim * in_dim] in row-major:

  ╭──────────────────────────────────────────────────────╮
  │ row 0 │ row 1 │ row 2 │ row 3 │ row 4 │ row 5 │ ... │
  ╰──────────────────────────────────────────────────────╯
   page A   page A+1                            page A+N

  prefetcher: "next address is current + stride" ✓ always right
\`\`\`

The CPU's load latency does not change. The architecture does. With contiguous storage, the prefetcher predicts the next load correctly. The pipeline stays full. The matrix multiply runs at something close to the theoretical FLOPs of the chip.

---

## The change

The fix is conceptually one line of code per layer:

\`\`\`rust
// Before
struct Layer {
    weights: Vec<Vec<f32>>,
}

// After
struct Layer {
    weights: Vec<f32>,
    in_dim: usize,
    out_dim: usize,
}

// Indexing changes from weights[i][j] to weights[i * in_dim + j]
\`\`\`

Every read and write to the matrix changes. Every helper that operates on a row changes. The size of the change in the codebase is meaningful (every layer touches it), but the size of the change in behaviour is one decision: store the matrix in one buffer instead of one buffer per row.

The forward pass becomes:

\`\`\`rust
impl Layer {
    fn forward(&self, input: &[f32], output: &mut [f32]) {
        debug_assert_eq!(input.len(), self.in_dim);
        debug_assert_eq!(output.len(), self.out_dim);

        // Row-major: weights[i * in_dim + j] = W[i][j]
        for i in 0..self.out_dim {
            let row_start = i * self.in_dim;
            let row_end = row_start + self.in_dim;
            output[i] = self.weights[row_start..row_end]
                .iter()
                .zip(input)
                .map(|(w, x)| w * x)
                .sum();
        }
    }
}
\`\`\`

Two things to notice:

1. **Output is a parameter, not a return value.** The caller pre-allocates the output buffer. No \`Vec\` allocation per call. This is the BatchScratch pattern that landed alongside the layout change.
2. **The inner loop is a slice iterator chain.** LLVM auto-vectorises this on Apple Silicon's NEON, generating tight SIMD code that processes multiple weights per cycle.

---

## Why "43x cache locality" is the right framing

The project notes call this a 43x improvement in cache locality. That phrase needs unpacking.

> [!note] **Reading the 43x correctly**
>
> A cache miss costs roughly 80 to 100 CPU cycles. A cache hit costs roughly 4 cycles for L1, 12 for L2, 35 for L3. Going from "miss every row" to "hit every row" is a 20 to 25x improvement in load cost on the matrix walk itself, and the prefetcher can do better than that when the layout is friendly.
>
> The 43x figure is consistent with the kind of factor improvement you see when you go from random-page row layout to fully contiguous, and it lines up with the time spent in matrix kernels for a network this size.

It is not a 43x speedup of the whole simulator. NeuroDrive's PPO update was already amortised across many ticks (the \`samples_per_tick\` parameter spreads the work), so the wall-clock improvement on the simulator is the 17.3 ms to 9.0 ms drop in mean frame time.

| Number you see  | What it actually measures             | Where to find it       |
|-----------------|---------------------------------------|------------------------|
| **43x**         | Cache locality on the matrix kernel   | Performance notes      |
| **21x**         | Wall-clock speedup on PPO update      | Project README         |
| **48%**         | Mean simulator frame-time improvement | Profiling reports      |
| **426 → 2**     | Stutters per run (frames over budget) | Frame-time histogram   |

All of these are consistent. They measure different layers of the same investigation. If you go telling people you got a 43x speedup, they will assume your simulator runs 43x faster, and you will sound like you are exaggerating. The truth is more nuanced and more interesting: the kernel is dramatically more cache-friendly, which lets the rest of the optimisations actually land, which produces the wall-clock improvement everyone can see.

---

## Five other things landed alongside it

The flat weight storage was the biggest single win. Five other optimisations stacked on top of it in the same commit (\`3c512f9\`):

\`\`\`
commit 3c512f9 — PPO performance overhaul

  ┌── flat weight storage             [biggest single win]
  ├── pre-allocated BatchScratch      [zero allocations on hot path]
  ├── batched forward + backward      [mat-mat instead of mat-vec]
  ├── iterator-based inner loops      [LLVM auto-vectorises]
  ├── std::mem::swap not clone        [zero-copy buffer transfer]
  └── precomputed Adam bias correction [tiny but real]
\`\`\`

### BatchScratch buffers

Every forward and backward pass used to allocate fresh \`Vec\`s for intermediate results. Now \`BatchScratch\` allocates everything once at construction, sized for a maximum batch of 512, and the training loop reuses the buffers. Zero heap allocations on the hot path.

\`\`\`rust
struct BatchScratch {
    activations: Vec<f32>,    // sized for max batch x widest layer
    grad_inputs: Vec<f32>,    // pre-allocated for backward
    grad_weights: Vec<f32>,   // accumulated gradients
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

### Batched forward and backward

Instead of processing samples one by one in a loop, \`forward_batch\` and \`backward_batch\` process the whole chunk in one pass. The matrix-vector multiplications become matrix-matrix multiplications. LLVM auto-vectorises better. Function call overhead disappears. Instruction-level parallelism improves.

### Iterator-based inner loops

This is the kind of thing that should not matter and does. Hand-written index loops like \`for i in 0..n { result += weights[i] * input[i]; }\` are hard for the compiler to auto-vectorise reliably. Iterator chains expressing the same computation are easier. The generated assembly is meaningfully different. No SIMD intrinsics involved, just compiler-friendly idioms.

### Swap instead of clone

The PPO update used to clone the entire rollout buffer when constructing a \`PreparedUpdate\`. With \`std::mem::swap\`, the update takes ownership of the buffer with zero copies.

\`\`\`rust
// Before: O(n) memory and time, every chunk
let prepared = PreparedUpdate::from(self.buffer.clone());

// After: O(1), atomic swap
let mut local = RolloutBuffer::default();
std::mem::swap(&mut self.buffer, &mut local);
let prepared = PreparedUpdate::from(local);
\`\`\`

### Adam bias correction precomputation

The Adam optimiser's bias correction terms (\`1 / (1 - β^t)\`) used to be computed per parameter. Now they are computed once per step using \`f32::powi\` and reused across every parameter.

| Optimisation                  | Standalone effect | When it matters         |
|-------------------------------|------------------:|--------------------------|
| Flat weight storage           | huge              | always                   |
| BatchScratch                  | meaningful        | every forward/backward   |
| Batched f/b passes            | meaningful        | per-chunk update         |
| Iterator inner loops          | small but real    | every kernel call        |
| swap not clone                | meaningful        | every chunk              |
| Adam bias precomp             | tiny              | every Adam step          |

Five of these are micro-optimisations with measurable but modest effects. The flat weight storage is the one that opens the door to the others. With \`Vec<Vec<f32>>\` you can batch your forward pass all you want, but the cache misses on the row pointers will still drown out the gains.

---

## What I now reach for first

The lesson I took from this is harder than "use flat arrays for matrices." That part is obvious in retrospect. The lesson is about which idiomatic Rust patterns are honest about the data and which are honest about the cache, and which one matters when.

> [!important] The two layouts each tell the truth, about different things.
>
> \`Vec<Vec<T>>\` is honest about the *shape*. The type system tells you "this is a vector of vectors." The code that operates on it is straightforward.
>
> \`Vec<T>\` with explicit dimensions is honest about the *cache*. The hardware can prefetch. The matrix multiply runs at theoretical bandwidth. The code that operates on it has to do the index arithmetic by hand.

For a one-off prototype, the first form is right. For a kernel that runs thousands of times per second on the hot path of a real-time simulator, the second form is the only one that works. The cost of switching after the fact is meaningful (every accessor changes), so the time to make this decision is when the kernel first goes into the hot path. Not after the simulator starts stuttering.

### A decision tree I now use

\`\`\`
                    "I have a matrix in Rust"
                            │
                            ▼
              ┌─────────────────────────────┐
              │ Is this in a hot loop?      │
              │ (called > 100 times/sec)    │
              └──────────────┬──────────────┘
                  ┌──────────┴──────────┐
                  │ NO                  │ YES
                  ▼                     ▼
          ┌──────────────┐      ┌──────────────────┐
          │ Vec<Vec<T>>  │      │ Do rows resize?  │
          │ is fine      │      └────────┬─────────┘
          └──────────────┘     ┌─────────┴─────────┐
                               │ YES               │ NO
                               ▼                   ▼
                       ┌──────────────┐    ┌──────────────────┐
                       │ Vec<Vec<T>>  │    │ Vec<T> + dims    │
                       │ (no choice)  │    │ row-major flat   │
                       └──────────────┘    └──────────────────┘
\`\`\`

The matrix in NeuroDrive's PPO learner is a fixed-shape weight matrix. Rows do not resize independently. There is exactly zero reason to use \`Vec<Vec<T>>\` for it.

---

## The reading list

The deeper-context references for this kind of work:

- **What every programmer should know about memory** — Ulrich Drepper's classic paper. Section 3 (CPU caches) and section 6 (what programmers can do) are the relevant ones.
- **Performance Analysis and Tuning on Modern CPUs** — Denis Bakhvalov. Chapter 8 covers cache-friendly data layout in detail.
- **Algorithmica: HPC** — Sergey Slotin's free book. The chapter on memory hierarchy is excellent.
- **The Rust Performance Book** — chapter on heap allocations and the chapter on iterators are both relevant.

The Rust-specific resources rarely talk about cache locality at this level. The C and C++ literature has decades of head start on this kind of thing, and the lessons all carry over directly.

---

## Closing

NeuroDrive's PPO learner now sits at 9.0 ms mean frame time on a MacBook Air with eight cars in flight. The brain-inspired learner that ships in milestone 6 reuses every one of these layout decisions. The same flat-buffer pattern, the same scratch buffers, the same iterator-friendly inner loops. The lesson generalises.

If your Rust matrix kernel is slow and you are looking at the hot loop wondering where the cycles go, look at how the data is laid out before you look at anything else. The hardware was always going to win that argument.

The 43x is in the cache. The 48 percent is in the simulator. The lesson is in the layout.
`,
};
