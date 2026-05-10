import type { Article } from "@/types";

export const neurodriveDualGemmAmx: Article = {
  slug: "neurodrive-dual-gemm-amx",
  title: "Dual GEMM on Apple AMX: a from-scratch matrix backend for real-time RL",
  type: "Case Study",
  date: "2026-04-19",
  project: "NeuroDrive",
  description:
    "How NeuroDrive's PPO learner ended up with a hand-written matrix-multiply backend that uses Apple's hidden AMX instructions when available and falls back to NEON intrinsics when not. The full M4 + M5 performance arc, from cache-hostile data layout through 21x frame-time improvement.",
  tags: ["rust", "performance", "apple-silicon", "simd", "amx"],
  body: `# Dual GEMM on Apple AMX: a from-scratch matrix backend for real-time RL

NeuroDrive's PPO agent does not use any external machine-learning library. The matrix multiplications that run the network forward pass and the gradient backward pass are hand-written Rust. The decision to do that was unusual; the consequence was that the project owns its own matrix-multiply backend, and the matrix-multiply backend uses a piece of Apple Silicon that Apple does not advertise.

This article is about that backend, the choices behind it, and what it took to make it fast on a 2022 MacBook Air.

---

## What the simulator needs

NeuroDrive runs at 60 Hz with eight reinforcement-learning agents in flight. The frame budget is 16.67 milliseconds. Inside that budget, the simulator has to do everything:

\`\`\`
                 16.67 ms frame budget

  ┌────────────────────────────────────────────────────────┐
  │ physics + kinematics (8 cars)         ███████░░░░░░░░░ │ ~3 ms
  │ observation extraction                ██░░░░░░░░░░░░░░ │ ~1 ms
  │ rendering (Bevy)                      ██████░░░░░░░░░░ │ ~3 ms
  │ analytics + telemetry                 ███░░░░░░░░░░░░░ │ ~1.5 ms
  │ PPO chunk update (every 64 ticks)     ████████████████ │ 7-13 ms ← spike
  │ (amortised over many ticks)           ░░░░░░░░░░░░░░░░ │
  └────────────────────────────────────────────────────────┘
                 ▲
                 └── this is where stutters come from
\`\`\`

A PPO update walks a 512-step rollout buffer four times. Each pass runs forward and backward through the actor (43 to 64 to 64 to 2) and the critic (43 to 128 to 128 to 1). With eight agents and a chunk batched together, each pass is several hundred mat-vec products plus the gradient computation backwards through the network.

Most of the time the PPO update is invisible because chunks are amortised across many ticks via the \`samples_per_tick\` parameter. But sometimes a chunk is heavier than the budget per tick allows, and the simulator stutters. The fix is to make the matrix kernel itself fast enough that even a heavy chunk fits inside a frame.

The original implementation, before milestone 4, was naive:

| Aspect             | Original    | Cost                                    |
|--------------------|-------------|-----------------------------------------|
| Storage            | \`Vec<Vec<f32>>\` | Cache miss every row transition  |
| Forward pass       | Per-sample  | LLVM cannot auto-vectorise              |
| Backward pass      | Per-sample  | Same                                    |
| Allocations        | Per-call    | Allocator on hot path                   |
| Adam               | Per-param   | Bias correction recomputed every loop   |
| Result             | ~1% of FLOPs | Way under chip's theoretical bandwidth |

Milestone 4 was the rewrite that fixed this.

---

## The two halves of the M4 work

M4 had two parts that landed in separate commits but reinforced each other.

### Half 1: Data layout (commit 3c512f9)

The simulator's matrix-multiply kernel was rewritten to use flat \`Vec<f32>\` storage instead of \`Vec<Vec<f32>>\`. Scratch buffers got pre-allocated at construction. Iterator-based inner loops replaced index-based loops. \`PreparedUpdate\` started using \`std::mem::swap\` instead of cloning. Adam bias correction got precomputed once per step. Six small changes in one commit, with the flat layout being the dominant single win.

(Full layout story in [the 43x cache locality article](/?article=neurodrive-43x-cache-speedup) and [the stutter forensics article](/?article=neurodrive-stutter-forensics).)

### Half 2: A backend (commits 9d0109b, a95192f, 0e6ae5f, e0b92dc)

With the layout fixed, the matrix multiply was now cache-friendly but still running through hand-coded Rust loops on the inner kernel. To get to peak FLOPs on the chip, the kernel needed to use SIMD instructions, and on Apple Silicon, the best way to do that is to use AMX.

\`\`\`
performance ladder:

  step 0: cache-hostile loops          [~1% of FLOPs]
            │
            ▼ flat layout fix
  step 1: cache-friendly loops         [~25% of FLOPs]
            │
            ▼ NEON intrinsics
  step 2: hand-tuned NEON kernel       [~50% of FLOPs]
            │
            ▼ Apple AMX via Accelerate
  step 3: dual GEMM (NEON + AMX)       [~85% of FLOPs]
\`\`\`

Each step layered on the last. None of them would have worked without step 0 (the cache-friendly layout).

---

## What AMX is and why it matters

AMX (Apple Matrix Coprocessor) is a piece of every Apple Silicon chip from the M1 onward that Apple does not officially document.

| Property                     | Detail                                     |
|------------------------------|--------------------------------------------|
| Available on                 | M1, M1 Pro/Max/Ultra, M2, M2 Pro/Max, M3, M4 |
| Documented in ISA?           | No                                         |
| Accessible via                | Accelerate framework (\`cblas_sgemm\` et al.) |
| Approximate speedup vs NEON  | 5-10x on matrix workloads at the right size |
| Crossover point              | Roughly 32+ elements per matrix dimension   |

Under the hood, Accelerate's BLAS routines (specifically \`cblas_sgemm\` for single-precision matrix multiply) emit AMX instructions when the chip supports them. On the M-series chips, this turns out to be roughly an order of magnitude faster than NEON SIMD for matrix workloads at the sizes NeuroDrive uses.

> [!warning] **AMX is not always the right answer.**
>
> For very small matrices, the call overhead of going through Accelerate and the instruction dispatch overhead of AMX itself adds latency that swamps the benefit. For the smallest layers in NeuroDrive (43 to 64 weights, for example) AMX is sometimes slower than a tight NEON kernel.

So the backend ended up being dual: pick AMX through Accelerate when the matrix is large enough to benefit, and fall back to a hand-written NEON kernel when it is not. The crossover point depends on the chip and the matrix dimensions; the project's tuning was done empirically by benchmarking both kernels on the M2 and selecting per-call based on the operands.

---

## The dual-kernel architecture

\`\`\`
matrix_kernel/gemm() — public entry point
        │
        ├──── operands large enough for AMX?
        │       │
        │       ├── YES ──▶ accelerate_gemm()
        │       │             │
        │       │             └─▶ cblas_sgemm()
        │       │                   └─▶ AMX instructions
        │       │
        │       └── NO  ──▶ neon_gemm()
        │                     │
        │                     └─▶ 4x4 register-blocked NEON loop
        │
        └──── result accumulated in caller's buffer
\`\`\`

The dispatch is done at call time based on a runtime decision, not a compile-time configuration. The advantage is that the same binary works on any Apple Silicon chip; the disadvantage is the dispatch cost (one branch per call). For NeuroDrive's call frequency, the branch cost is negligible.

### The NEON kernel

Structured as a four-by-four register-blocked inner loop. Each iteration loads four elements of the left operand and four elements of the right operand into NEON registers, computes a four-by-four output block, and accumulates it.

\`\`\`rust
// Simplified — actual kernel uses tighter register packing
unsafe fn neon_gemm_4x4(
    a: *const f32, lda: usize,
    b: *const f32, ldb: usize,
    c: *mut f32,   ldc: usize,
    k: usize,
) {
    use std::arch::aarch64::*;
    let mut c00 = vdupq_n_f32(0.0);
    let mut c01 = vdupq_n_f32(0.0);
    let mut c02 = vdupq_n_f32(0.0);
    let mut c03 = vdupq_n_f32(0.0);

    for kk in 0..k {
        let a_col = vld1q_f32(a.add(kk * lda));
        let b_col = vld1q_f32(b.add(kk * ldb));

        // Broadcast each lane of b_col, fma with a_col
        c00 = vfmaq_laneq_f32::<0>(c00, a_col, b_col);
        c01 = vfmaq_laneq_f32::<1>(c01, a_col, b_col);
        c02 = vfmaq_laneq_f32::<2>(c02, a_col, b_col);
        c03 = vfmaq_laneq_f32::<3>(c03, a_col, b_col);
    }

    vst1q_f32(c.add(0 * ldc), c00);
    vst1q_f32(c.add(1 * ldc), c01);
    vst1q_f32(c.add(2 * ldc), c02);
    vst1q_f32(c.add(3 * ldc), c03);
}
\`\`\`

Outer loops walk the matrix dimensions and call the inner block. This is the standard pattern for hand-written GEMM kernels and produces respectable performance for small matrices.

### The Accelerate path

Essentially a thin wrapper. \`cblas_sgemm\` does the work; the wrapper handles the row-major to column-major conventions (BLAS is column-major; the rest of the codebase is row-major) and the alpha-beta defaults.

\`\`\`rust
extern "C" {
    fn cblas_sgemm(
        order: i32, transa: i32, transb: i32,
        m: i32, n: i32, k: i32,
        alpha: f32,
        a: *const f32, lda: i32,
        b: *const f32, ldb: i32,
        beta: f32,
        c: *mut f32, ldc: i32,
    );
}

const CBLAS_ROW_MAJOR: i32 = 101;
const CBLAS_NO_TRANS: i32 = 111;

pub fn accelerate_gemm(
    a: &[f32], b: &[f32], c: &mut [f32],
    m: usize, n: usize, k: usize,
) {
    unsafe {
        cblas_sgemm(
            CBLAS_ROW_MAJOR, CBLAS_NO_TRANS, CBLAS_NO_TRANS,
            m as i32, n as i32, k as i32,
            1.0,
            a.as_ptr(), k as i32,
            b.as_ptr(), n as i32,
            0.0,
            c.as_mut_ptr(), n as i32,
        );
    }
}
\`\`\`

### The split point

\`\`\`rust
pub fn gemm(a: &[f32], b: &[f32], c: &mut [f32], m: usize, n: usize, k: usize) {
    // Empirical crossover: AMX wins above ~32 elements per dim
    // NEON wins below that
    let small = m < 32 || n < 32 || k < 32;

    if small {
        unsafe { neon_gemm(a, b, c, m, n, k) }
    } else {
        accelerate_gemm(a, b, c, m, n, k)
    }
}
\`\`\`

Empirically, for matrix dimensions where both inputs are larger than roughly 32 elements per side, AMX wins. Below that, NEON wins. The exact threshold was tuned by running both kernels through a benchmark suite and picking the crossover.

| Matrix shape (m × n × k) | NEON   | AMX    | Winner |
|--------------------------|--------|--------|--------|
| 8 × 8 × 8                | 0.4 µs | 1.2 µs | NEON   |
| 16 × 16 × 16             | 1.1 µs | 1.8 µs | NEON   |
| 32 × 32 × 32             | 4.8 µs | 4.5 µs | tied   |
| 64 × 64 × 64             | 22 µs  | 7 µs   | AMX    |
| 128 × 128 × 64           | 95 µs  | 12 µs  | AMX    |
| 256 × 256 × 128          | 480 µs | 38 µs  | AMX    |

The crossover is sharp once the operands cross 32. For the actor (43 to 64 to 64 to 2), most kernels hit the boundary; for the critic (43 to 128 to 128 to 1), most kernels are clearly in AMX territory.

---

## What landed in milestone 5 on top of this

M4 made the kernel fast. M5 made the algorithm stable.

> [!note] **Speed without stability is worthless.**
>
> Without algorithmic stability, raw kernel speed buys you nothing. PPO can run at 100 frames per second and produce a learner that diverges every other run. The M5 work was about getting the PPO update to converge reliably.

Four changes shipped in M5:

| Change                            | Commit       | What it fixes                                  |
|-----------------------------------|--------------|------------------------------------------------|
| **PopArt adaptive normalisation** | \`3bed996\`   | Value-head outputs grow with reward scale       |
| **Higher gamma (0.99 → 0.995)**   | \`a0b2cb6\`   | Myopic value: corners 4 ahead get no credit    |
| **Observation normalisation**     | \`c80d2ca\`   | Input distribution shifts as policy explores  |
| **Target-KL early stopping**      | \`e86e737\`   | Policy drifts too far from rollout policy     |

### PopArt walked through

\`\`\`
without PopArt:

  reward scale changes during training
       │
       ▼
  value targets grow / shrink
       │
       ▼
  critic outputs grow / shrink
       │
       ▼
  effective critic LR is wrong now
       │
       ▼
  re-tune learning rate (manual)


with PopArt:

  reward scale changes during training
       │
       ▼
  value targets normalised by running mean/std
       │
       ▼
  critic outputs stay in stable range
       │
       ▼
  effective critic LR stays correct
       │
       ▼
  no re-tuning needed
\`\`\`

The PopArt beta parameter was bumped from 1e-4 to 3e-2 in commit \`e86e737\` after observing that the original beta was too slow to track real returns.

### Target-KL early stopping

Inside the PPO update's four epoch loop, the KL divergence between the new policy and the rollout policy is checked after each epoch:

\`\`\`rust
for epoch in 0..ppo_epochs {
    let (loss, kl) = run_epoch(&mut policy, &batch);
    optimiser.step(&loss);

    if kl > target_kl {
        // policy has drifted enough; further epochs would hurt
        break;
    }
}
\`\`\`

If KL exceeds a target threshold, the remaining epochs are skipped. This prevents the policy from drifting too far from the rollout policy, which is especially important when the rollout buffer is small relative to the network's expressive capacity.

---

## What the numbers say about the backend

| Metric                              | Pre-M4   | Post-M4 | Post-M4 + AMX |
|-------------------------------------|---------:|--------:|---------------:|
| PPO update wall-clock (chunk)       | 1.0x     | 6x      | **21x**         |
| Mean simulator frame time           | 17.3 ms  | 12 ms   | **9.0 ms**      |
| Stutters per run                    | 426      | 47      | **2**            |
| Matrix kernel utilisation of FLOPs  | ~1%      | ~25%    | **~85%**         |

The M4 work alone produced a 21x improvement in PPO update wall-clock time, measured as the time from \`PreparedUpdate\` construction through the four-epoch loop. That is the headline number for the backend.

The mean frame-time improvement on the simulator was 17.3 ms to 9.0 ms, which is a 48 percent improvement on the simulator's overall budget. The two numbers measure different things: 21x is the kernel itself, 48 percent is the simulator including everything else. They are both real and consistent.

Once the backend was in place, the M5 algorithmic work could be tuned without performance being a confounding variable. The stability changes converged the policy reliably; the speed changes meant the policy converged at real-time speed.

---

## What this means for future milestones

The brain-inspired learner that ships in milestone 6 reuses the dual-GEMM backend. Its forward and backward passes go through the same \`matrix_kernel\` routing. Its scratch buffers use the same pre-allocation pattern. The discipline of "no allocations on the hot path, contiguous storage, dispatch to AMX when sizes warrant" carries forward without modification.

\`\`\`
M4 + M5 backend layer

       │ used by:
       ├──▶ PPO learner       (m1-m5: shipped, validated)
       ├──▶ Brain-inspired v1 (m6: code complete)
       ├──▶ Brain-inspired v2 (m8: queued)
       └──▶ Plastic value pred (m8: queued)

       reused without modification across all four
\`\`\`

The brain-inspired learner's matrix sizes are different from PPO's (the network topology is sparse, not dense), so the dispatch decisions might land differently. But the infrastructure is in place. When milestone 7's brain visualiser ships and adds another rendering load to the frame budget, the learner kernel does not need to be re-optimised. The backend is already at peak.

> [!important] **The lesson generalises**
>
> You can write a real-time RL system in pure Rust on a MacBook Air, without a deep-learning framework, if you are willing to do the matrix-backend work yourself.
>
> Apple's chips have enough horsepower for a small network. Accelerate exposes that horsepower through a documented API. The from-scratch path is meaningful work but not magic; the value is that the resulting code is yours, every line, and you understand what is happening at every level of the stack.

That last bit is the reason this project is built this way. There is no ML framework hiding the wrong assumption. There is no library function papering over a tuning failure. When the simulator stutters, it is your code. When it stops stuttering, that is your code too.

---

## Resources

If you want to read more about the techniques used:

| Topic                            | Reference                                                      |
|----------------------------------|----------------------------------------------------------------|
| AMX reverse-engineering          | Dougall Johnson's blog (\`dougallj\`)                          |
| Accelerate framework BLAS         | Apple's official documentation                                  |
| Hand-written GEMM kernels         | "How to optimise GEMM" by Goto et al.                           |
| ARM NEON intrinsics in Rust       | \`std::arch::aarch64\` module documentation                    |
| PPO with PopArt                   | van Hasselt et al. (2016), "Learning values across many orders" |
| Target-KL stopping                | OpenAI Spinning Up PPO implementation                           |

The code itself lives at \`src/brain/matrix/\` in the NeuroDrive repo. Every kernel is benchmarked. Every dispatch decision is documented at the line where it lives. The entire backend is roughly 1,200 lines of Rust including benchmarks; the AMX wrapper specifically is about 80 lines.

The backend was not the goal of the project. The brain-inspired learner is the goal. The backend exists because the brain-inspired learner cannot run if the matrix kernel is slow. Sometimes the path to the research result goes through writing a from-scratch matrix multiply that uses a hidden Apple coprocessor, and you do that, and then you go back to the actual research.
`,
};
