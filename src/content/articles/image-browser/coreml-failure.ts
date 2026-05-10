import type { Article } from "@/types";

export const imageBrowserCoremlFailure: Article = {
  slug: "image-browser-coreml-failure",
  title: "Why CoreML produced runtime errors for these graphs",
  type: "Dev Log",
  date: "2025-12-08",
  project: "Image Browser",
  description:
    "Apple's Neural Engine should accelerate ONNX inference on M-series chips. The reality on Image Browser's three encoders was different: CLIP failed with operator-not-supported, DINOv2 produced silently wrong outputs, and SigLIP-2 crashed at session creation. The investigation, the workarounds tried, and why CPU-only is the right call.",
  tags: ["apple-silicon", "coreml", "onnx", "machine-learning", "rust"],
  body: `# Why CoreML produced runtime errors for these graphs

Image Browser runs three deep-learning models on the user's machine: CLIP ViT-B/32, DINOv2-Base, and SigLIP-2 Base 256. The runtime is ONNX Runtime via the Rust \`ort\` crate. The execution provider, in production, is the CPU backend.

That last part is unusual. Apple Silicon Macs have a Neural Engine (ANE), and ONNX Runtime supports CoreML as an execution provider that should route operators to the ANE. In theory, this provides 5-10x speedup on inference workloads.

In practice, every one of Image Browser's three image encoders failed differently when CoreML was enabled. This article is the dev log of those failures, the workarounds attempted, and the eventual decision to ship with CPU-only inference on macOS.

---

## TL;DR

| Encoder           | CoreML status                          | Failure mode                            |
|-------------------|----------------------------------------|------------------------------------------|
| CLIP ViT-B/32      | broken                                 | "operator type not supported"            |
| DINOv2-Base         | broken                                 | model loaded; outputs silently wrong     |
| SigLIP-2 Base 256   | broken                                 | crash at session creation                 |
| **Decision**       | **CPU-only on macOS**                  | acceptable performance, correct outputs  |

CPU inference on the M2 takes ~5 ms per encoder per image. CoreML's correctness issues are not worth chasing for this workload.

---

## What CoreML is supposed to do

\`\`\`
                  Apple Silicon execution targets

   ┌────────────────────────────────────────────────────────┐
   │ Neural Engine (ANE)                                      │
   │   - Fixed-function ML accelerator                          │
   │   - 16 TOPS on M2 (more on M-series Pro/Max)              │
   │   - Best for static-shape, well-known operator graphs      │
   │   - Used by: Siri, Photos, FaceID, etc.                    │
   └────────────────────────────────────────────────────────┘

   ┌────────────────────────────────────────────────────────┐
   │ GPU                                                       │
   │   - General-purpose Metal compute                          │
   │   - 3.6 TFLOPS on M2                                       │
   │   - Falls back here when ANE cannot run an operator        │
   └────────────────────────────────────────────────────────┘

   ┌────────────────────────────────────────────────────────┐
   │ CPU                                                       │
   │   - 8 cores (4P + 4E) on M2                                │
   │   - NEON SIMD, AMX matrix coprocessor                      │
   │   - The fallback fallback                                   │
   └────────────────────────────────────────────────────────┘
\`\`\`

CoreML is Apple's framework for running ML models. ONNX Runtime's CoreML execution provider translates ONNX operators into CoreML operators, which CoreML then routes to ANE / GPU / CPU based on which accelerator can run each operator best.

The path is:

\`\`\`
   ONNX model → ort SessionBuilder → CoreML EP → CoreML graph → ANE / GPU / CPU
\`\`\`

When it works, CoreML produces dramatic speedups. When it doesn't, the failure modes are diverse.

---

## Failure 1: CLIP — operator not supported

The first attempt was straightforward:

\`\`\`rust
let session = SessionBuilder::new(&env)?
    .with_optimization_level(GraphOptimizationLevel::Level3)?
    .with_execution_providers([ExecutionProvider::CoreML(Default::default())])?
    .with_intra_threads(4)?
    .build_from_file(model_dir.join("clip_vision.onnx"))?;
\`\`\`

Session creation succeeded. The first inference call panicked with:

\`\`\`
Error: ONNX Runtime error
  caused by: CoreMLExecutionProvider: operator type not supported by CoreML
  details: ConvTranspose with dilations attribute not supported
\`\`\`

CLIP's vision encoder uses transposed convolutions (\`ConvTranspose\`) with non-trivial dilation attributes. CoreML's operator coverage does not include this combination.

### Workaround attempt 1: graph rewriting

ONNX Runtime can fall back to CPU for unsupported operators if you set the appropriate flag:

\`\`\`rust
.with_execution_providers([
    ExecutionProvider::CoreML(CoreMLExecutionProviderOptions {
        use_cpu_only: false,
        enable_on_subgraph: true,
        only_enable_device_with_ane: false,
    }),
])?
\`\`\`

\`enable_on_subgraph: true\` tells the provider to route only the subgraphs CoreML supports, falling back to CPU for unsupported ones.

Result: the graph got partitioned. CoreML ran the parts it could. CPU ran the parts it couldn't. Wall-clock time was actually slower than pure CPU (the partition overhead exceeded the speedup on the CoreML-capable subgraph).

### Workaround attempt 2: a different CLIP export

Maybe the issue was the specific ONNX export. I tried three different CLIP exports:

| Export source                                | Result                          |
|---------------------------------------------|---------------------------------|
| HuggingFace official ONNX                    | same operator-not-supported     |
| OpenAI CLIP repo's ONNX export                | same                            |
| Manual export from clip-vit-base-patch32     | same (same operators)            |

The problem is the model architecture, not the export tooling. CLIP ViT-B/32 cannot be expressed in CoreML's operator set without breaking its semantics.

### Verdict on CLIP

CPU-only. Inference takes ~4 ms per image, which is well within budget for indexing.

---

## Failure 2: DINOv2 — silent wrong outputs

The second model was harder to diagnose. CoreML loaded the DINOv2 graph successfully:

\`\`\`rust
let session = SessionBuilder::new(&env)?
    .with_execution_providers([ExecutionProvider::CoreML(Default::default())])?
    .build_from_file(model_dir.join("dinov2_base_image.onnx"))?;

// session loaded, no errors
let outputs = session.run(inputs)?;   // also no errors
\`\`\`

The inference call returned outputs. The output shape was correct. The output values looked like an embedding (similar magnitudes to expected, similar variance per dimension).

The cosine similarities to known reference embeddings were wrong.

\`\`\`
                  CoreML vs CPU output for the same image

   reference image: a striped tabby cat photo

   CPU output cosines (vs known references):
     - same cat photo:                    0.998   ← correct (near-identical)
     - different photo of same cat:        0.842
     - different cat:                       0.612
     - dog photo:                          0.387
     - landscape:                          0.123

   CoreML output cosines (vs same references):
     - same cat photo:                    0.811   ← wrong (should be ~1.0)
     - different photo of same cat:        0.658
     - different cat:                       0.601
     - dog photo:                          0.587
     - landscape:                          0.498
\`\`\`

The CoreML embeddings preserved some signal (cat photos were closer to each other than to landscapes), but the magnitudes were compressed. Cosine similarities clustered in a narrow band where CPU's spread the full range.

### Diagnosis: precision loss in the conversion

DINOv2's transformer architecture has accumulation patterns that lose precision when the operators are converted from FP32 to CoreML's internal mixed-precision representation. CoreML uses FP16 by default for ANE-routed operators; the accumulated error across the full graph (12 transformer blocks) is large enough to corrupt the output distribution.

### Workaround attempt: force FP32 throughout

\`\`\`rust
.with_execution_providers([
    ExecutionProvider::CoreML(CoreMLExecutionProviderOptions {
        require_static_input_shapes: true,
        // ... no FP16 option exposed
    }),
])?
\`\`\`

CoreML's FP16 routing is not configurable from ONNX Runtime's binding. The choice is binary: use CoreML (FP16 risk) or use CPU (FP32 always).

### Verdict on DINOv2

CPU-only. The silent-correctness failure mode is the worst kind. A 5x speedup with subtly wrong outputs is much worse than a slower-but-correct backend.

> [!warning] **Why silent failures are the worst class**
>
> A loud failure (operator not supported) is annoying but obvious. You see the error. You know to fall back.
>
> A silent failure (graph runs, outputs look reasonable, semantics are wrong) is invisible. The application appears to work. The retrieval results look "okay" but actually return the wrong nearest neighbours. The user has no signal that anything is broken.
>
> If you cannot detect the failure programmatically, the backend is unsafe to use in production regardless of how fast it is.

---

## Failure 3: SigLIP-2 — session creation crash

The third model failed earlier and louder:

\`\`\`
Error: ONNX Runtime error
  caused by: SIGSEGV in libcoreml.dylib at 0x7fff60d12b54
  details: invalid memory access during graph compilation

  stack trace:
    libcoreml.dylib::_compile_graph_for_ane
    libcoreml.dylib::_optimise_for_ane
    libcoreml.dylib::_load_model_from_proto
    libonnxruntime.dylib::CoreMLExecutionProvider::Compile
\`\`\`

The crash happened inside CoreML's graph compilation phase, before any inference ran. Something about the SigLIP-2 graph triggered a segfault in CoreML's compilation path.

### Diagnosis: unknown

Without access to CoreML's internals (which are not open source), the root cause is opaque. The crash is reproducible (same model + same inputs always crashes the same way), which rules out timing or memory-pressure issues. Beyond that, I cannot diagnose it.

### Workaround attempt: simplify the graph

ONNX Runtime has graph optimisation passes that can simplify a model before passing it to a downstream EP. Maybe the issue was a specific optimisation pass that confused CoreML.

\`\`\`rust
.with_optimization_level(GraphOptimizationLevel::Level0)?  // no optimisations
\`\`\`

Same crash. The crash is not optimisation-related; it is something about the SigLIP-2 graph structure that CoreML's compiler cannot handle.

### Workaround attempt: only-enable-device-with-ane false

\`\`\`rust
ExecutionProvider::CoreML(CoreMLExecutionProviderOptions {
    only_enable_device_with_ane: false,
    // ... default
})
\`\`\`

This routes operators to GPU instead of ANE. Same crash. The crash is in CoreML's compilation, regardless of which device the result targets.

### Verdict on SigLIP-2

CPU-only. There is no workaround.

---

## The decision matrix

After roughly two days of attempted workarounds:

| Backend                | CLIP          | DINOv2        | SigLIP-2      |
|------------------------|---------------|---------------|---------------|
| CoreML default          | error          | wrong output  | crash          |
| CoreML + subgraph      | slow           | wrong output  | crash          |
| CoreML + Level0 opt    | error          | wrong output  | crash          |
| CoreML + GPU only      | error          | wrong output  | crash          |
| **CPU**                | **works**      | **works**      | **works**      |

The decision was clear: CPU-only on macOS for all three encoders. Configuration:

\`\`\`rust
let session = SessionBuilder::new(&env)?
    .with_optimization_level(GraphOptimizationLevel::Level3)?
    // No CoreML EP added; falls through to CPU
    .with_intra_threads(4)?
    .with_inter_threads(1)?
    .build_from_file(model_path)?;
\`\`\`

The session builder is identical across all three encoders. The CoreML provider is not added.

---

## What this costs in performance

Per-encoder inference on a single 224×224 image (256×256 for SigLIP-2):

| Encoder           | CPU (M2)   | CoreML (where it worked) | Loss                |
|-------------------|-----------:|-------------------------:|---------------------|
| CLIP ViT-B/32      | 4 ms       | n/a (errors)              | n/a                  |
| DINOv2-Base         | 6 ms       | 1.8 ms                    | ~3.3x slower (but correct) |
| SigLIP-2 Base 256   | 5 ms       | n/a (crashes)             | n/a                  |

For DINOv2 specifically, CPU is 3.3x slower than CoreML's broken-but-fast path. The 6 ms per image is fine; indexing 1000 images takes 12 seconds parallel-encoded across all three encoders.

---

## Why CPU is enough

The user-perceived performance gating factor is not raw inference speed. It is the indexing pipeline's wall-clock time, which is dominated by:

\`\`\`
                  Indexing wall-clock breakdown (per image)

   image read + decode    ████░░░░░░░░░░░░░░░░░░░░░░░░░  3 ms
   thumbnail generate     ████░░░░░░░░░░░░░░░░░░░░░░░░░  3 ms
   preprocessing × 3      ███░░░░░░░░░░░░░░░░░░░░░░░░░░  2 ms
   inference (parallel)   ██████░░░░░░░░░░░░░░░░░░░░░░░  6 ms (max of three)
   DB write (batched)     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0.5 ms (amortised)
                          ───────────
                          ~14 ms per image, end to end
\`\`\`

A 3x speedup on inference would reduce wall-clock by ~4 ms per image, taking total from 14 ms to 10 ms. That is meaningful but not transformative. The user-visible difference between "indexing 1000 images takes 14 seconds" and "indexing 1000 images takes 10 seconds" is essentially invisible; both feel fast.

> [!important] **The honest framing**
>
> CoreML's potential 3x speedup on DINOv2 (the only encoder where it ran) would have shaved a few seconds off the indexing pipeline. It is not worth the silent-correctness risk for a user-facing application.

If Image Browser were running real-time inference on a video stream (where 4 ms per frame matters), the calculation would be different. For an indexing pipeline that runs once per image library refresh, the answer is unambiguous: CPU is right.

---

## What is in the project notes

The full investigation lives at \`context/notes/coreml-investigation.md\` in the Image Browser repo. It contains:

- The exact error messages from each failure mode
- Per-architecture analysis of which CoreML operators are missing for each encoder
- Test fixtures that reproduce the silent-output failure on DINOv2
- The crash dump from SigLIP-2's session creation
- The decision matrix and rationale

Three things from the notes are worth surfacing here:

| Note section                                  | Takeaway                                              |
|-----------------------------------------------|-------------------------------------------------------|
| "FP16 precision loss in transformers"         | DINOv2's wrong outputs trace to FP16 accumulation     |
| "ConvTranspose dilation gap"                   | CLIP's ConvTranspose attributes not in CoreML's set    |
| "SigLIP-2 graph compilation crash"            | Unknown; reproducible; not in scope to debug          |

---

## What this changes about how I evaluate ML backends

> [!important] **The two-part test for any new ML backend**
>
> 1. **Does it run the model without errors?** (Loud failure check)
> 2. **Are the outputs identical to the reference within numerical precision?** (Silent failure check)
>
> Both tests have to pass. The first test is easy. The second test requires test fixtures with known reference outputs.

Image Browser now has a test suite that exercises all three encoders against fixed reference images and asserts cosine similarity to known reference embeddings is > 0.99. This catches silent backend failures regardless of which backend is in use.

If a future ONNX Runtime version fixes CoreML's issues with these models, the change to enable CoreML is one line. The reference test suite will catch any regression. The decision can be revisited honestly when the underlying tooling improves.

---

## What this generalises to

The lesson beyond Image Browser:

| Backend choice                                | Test required to ship                                  |
|-----------------------------------------------|-------------------------------------------------------|
| Any GPU backend (CUDA, ROCm, Metal)            | Reference output equality, every model                 |
| Any accelerator backend (TPU, ANE, NPU)        | Reference output equality + perf measurement            |
| Quantised inference (INT8 / FP16 / FP8)         | Reference output equality with looser tolerance         |
| New version of any of the above                 | Re-run reference output tests                          |

Silent failures are the dangerous class. The fix is making them detectable through your CI. Without that, every backend swap is a roll of the dice.

---

## Closing

Apple's Neural Engine is impressive hardware. The CoreML provider for ONNX Runtime is real software. The combination, for these specific models, does not work today. That is a fact about the current state of the tooling, not a verdict on either Apple Silicon or ONNX Runtime.

The right response is to use what works (CPU on macOS, ~5 ms per image per encoder) and to leave the door open for future improvement. The CoreML pathway can be re-enabled with a one-line change once the underlying issues are resolved.

For now, Image Browser ships with CPU-only inference on macOS. The performance is acceptable. The correctness is verified. The decision is documented. That is what you get when you do the boring testing work; you can ship with confidence even when the exciting backend does not work yet.

Sometimes the right engineering decision is "do not use the fast path." That is not a failure. That is the discipline.
`,
};
