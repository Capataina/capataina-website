import type { Article } from "@/types";

export const burnFold4dImplementation: Article = {
  slug: "burn-fold4d-implementation",
  title: "fold4d (Col2Im) for Burn: backward is free",
  type: "Dev Log",
  date: "2026-05-10",
  project: "Burn (OSS)",
  description:
    "Burn issue #4519 asks for fold4d, which is the ONNX Col2Im-18 operator. Implementing it in Burn is roughly 460 lines across 11 files, and the interesting trick is that the backward pass is free: fold4d's backward is unfold4d, which Burn already has. Why this matters, what the implementation looks like, and the queue position behind A-FINE.",
  tags: ["rust", "burn", "open-source", "onnx", "automatic-differentiation"],
  body: `# fold4d (Col2Im) for Burn: backward is free

Burn issue [#4519](https://github.com/tracel-ai/burn/issues/4519) asks for support for the ONNX \`Col2Im\` operator (specifically version 18). The natural Rust name for this is \`fold4d\`. It is the inverse of \`unfold4d\`, which Burn already has.

This work is queued behind A-FINE (PR #4894). It is informally claimed via antimora's thumbs-up on the issue (2026-05-10). The implementation design is done; the implementation is the next thing in the Burn engagement queue.

This article is the design walkthrough: what fold4d is, why its backward is free, and why this is a fast-to-land contribution despite touching 11 files.

---

## TL;DR

| Property                                  | Value                                          |
|-------------------------------------------|------------------------------------------------|
| Issue                                      | [#4519](https://github.com/tracel-ai/burn/issues/4519) |
| ONNX operator                              | Col2Im-18                                       |
| Burn name                                  | fold4d                                          |
| Estimated LoC                              | ~460 lines across 11 files                      |
| Backward pass                              | reuses existing unfold4d (free)                  |
| Status                                     | informally claimed; queued behind A-FINE         |
| Maintainer                                  | antimora (👍 acknowledged)                      |

---

## What Col2Im (fold4d) does

\`\`\`
                  Col2Im / fold4d, illustrated

   input shape:  (N, C × kH × kW, L)
                  ─── batch
                       ─── kernel-flattened channels
                                   ─── spatial locations

   output shape: (N, C, H, W)
                  reconstructed image

   intuition: Col2Im takes a "columnar" intermediate representation and
   folds it back into spatial image shape, summing contributions from
   overlapping kernel positions.

   This is the inverse of unfold4d / Im2Col, which extracts patches.
\`\`\`

The use case: convolutions in some backends are implemented as Im2Col → matrix multiply → Col2Im. Many ONNX models exported from PyTorch contain explicit Col2Im operators as part of unrolled convolution chains, decoders, or transposed convolutions that the exporter chose to lower this way.

Without fold4d in Burn, those models do not load. With fold4d, they do.

---

## What "backward is free" means

The backward pass of any differentiable operator is the gradient flow. For fold4d:

\`\`\`
                  fold4d backward derivation

   forward:  y = fold4d(x, kernel_size, stride, padding, dilation)
             y has shape (N, C, H_out, W_out)
             x has shape (N, C × kH × kW, L)

   backward: dx = unfold4d(dy, kernel_size, stride, padding, dilation)

   the gradient with respect to x is exactly unfold4d of the
   incoming gradient dy. unfold4d already exists in Burn.

   the backward pass for fold4d is therefore zero new lines of math.
\`\`\`

This is a happy mathematical fact about Col2Im / Im2Col. The two operators are duals (in the linear-algebra sense); the forward of one is the backward of the other. Implementing one for free unlocks the gradient of the other.

> [!important] **Why this matters for the PR**
>
> A typical operator PR for a deep-learning framework includes:
>   - forward implementation
>   - backward implementation
>   - tests for forward
>   - tests for backward
>   - backend-specific kernels (CPU, GPU, etc.)
>
> For fold4d in Burn, the backward implementation is one line: \`unfold4d(grad)\`. The backward tests are minimal because they reduce to "does unfold4d's existing tests already verify this composition?" (Yes, with one new combined test.)
>
> This collapses the PR's surface area significantly.

---

## Implementation plan: 6 commits

The 460-LoC estimate splits into 6 commits, each one a logical chunk:

\`\`\`
commit 1: type signature + ONNX operator dispatcher entry
  - register Col2Im-18 in burn-import-onnx's operator table
  - add the operator function signature in burn-tensor's API
  - no implementation yet; just the surface

commit 2: forward implementation (CPU)
  - core fold4d math in burn-core
  - handles padding, stride, dilation
  - NdArray backend uses ndarray's stride patterns

commit 3: forward tests
  - against PyTorch's reference outputs
  - covers single-channel, multi-channel
  - covers no-padding, padding, dilation
  - covers stride > 1

commit 4: backward integration
  - register unfold4d as the gradient function
  - no new math; just wire it up

commit 5: backward tests
  - gradient check vs autograd reference
  - verify fold4d(x).backward() == unfold4d(grad)

commit 6: ONNX importer integration test
  - load a small ONNX model that uses Col2Im-18
  - verify outputs match reference
\`\`\`

Each commit is reviewable in isolation. The maintainer can land them in batches or all at once.

---

## File touch list

\`\`\`
                       Files to touch

   crates/burn-tensor/src/tensor/api/
     ├── fold4d.rs           (new file: public API)
     └── mod.rs              (re-export fold4d)

   crates/burn-core/src/tensor/
     ├── fold4d.rs           (new file: forward math + backward link)
     └── mod.rs              (register operator)

   crates/burn-import/src/onnx/
     ├── op_col2im.rs        (new file: ONNX operator dispatcher)
     └── op_registry.rs      (register Col2Im-18)

   crates/burn-ndarray/src/ops/
     └── fold4d.rs           (new file: NdArray backend kernel)

   crates/burn-wgpu/src/ops/
     └── fold4d.rs           (new file: WGPU backend kernel — optional v1)

   crates/burn-tch/src/ops/
     └── fold4d.rs           (new file: tch backend kernel — optional v1)

   tests/
     ├── fold4d_forward_test.rs  (new file)
     └── fold4d_backward_test.rs (new file)

   examples/
     └── (no new examples in v1)
\`\`\`

11 files touched, of which 9 are new files. Total LoC across all files: ~460. The actual fold4d math is ~80 lines; the rest is the surface area (dispatcher registration, tests, per-backend kernels for the immediate-need backends).

---

## The core forward math

The forward pass is a straightforward implementation of Col2Im:

\`\`\`rust
pub fn fold4d<B: Backend>(
    cols: Tensor<B, 3>,
    output_size: (usize, usize),
    kernel_size: (usize, usize),
    stride: (usize, usize),
    padding: (usize, usize),
    dilation: (usize, usize),
) -> Tensor<B, 4> {
    let (n, c_times_kh_times_kw, l) = cols.shape().dims;
    let (kh, kw) = kernel_size;
    let c = c_times_kh_times_kw / (kh * kw);
    let (h_out, w_out) = output_size;

    let mut result = Tensor::<B, 4>::zeros([n, c, h_out, w_out]);

    // For each spatial location in the cols, accumulate into the output
    // at the corresponding (potentially overlapping) kernel positions.
    // This is the "summing contributions from overlapping kernel positions" part.

    let cols_reshaped = cols.reshape([n, c, kh, kw, l]);

    for (h_out_idx, w_out_idx) in iproduct!(0..h_out, 0..w_out) {
        for (kh_idx, kw_idx) in iproduct!(0..kh, 0..kw) {
            let h_in = h_out_idx * stride.0 + kh_idx * dilation.0 - padding.0;
            let w_in = w_out_idx * stride.1 + kw_idx * dilation.1 - padding.1;
            // skip out-of-bounds positions
            if h_in >= h_out || w_in >= w_out { continue; }

            // ... accumulate into result[:, :, h_in, w_in]
        }
    }

    result
}
\`\`\`

The actual implementation uses Burn's tensor primitives (no manual indexing in safe Rust), but the math is the same.

> [!note] **Performance considerations for v1**
>
> The naive implementation above is O(N × C × H × W × kH × kW). For large kernel sizes this gets expensive.
>
> v1 of the PR uses the naive implementation. A future optimisation could use Burn's existing batched primitives more aggressively, but v1 prioritises correctness over speed.

---

## The backward registration

Burn's autograd system requires backward functions to be registered explicitly:

\`\`\`rust
// in burn-core/src/tensor/fold4d.rs

impl<B: Backend> Tensor<B, 4> {
    pub fn fold4d_with_grad(
        cols: Tensor<B, 3>,
        output_size: (usize, usize),
        kernel_size: (usize, usize),
        stride: (usize, usize),
        padding: (usize, usize),
        dilation: (usize, usize),
    ) -> Self {
        let result = fold4d_forward(&cols, output_size, kernel_size, stride, padding, dilation);

        // Register backward: dx = unfold4d(dy, ...)
        let backward = move |grad: Tensor<B, 4>| -> Tensor<B, 3> {
            unfold4d(grad, kernel_size, stride, padding, dilation)
        };

        result.with_backward(backward, &[cols])
    }
}
\`\`\`

That is the whole backward wiring. unfold4d already exists in Burn with its own tests; reusing it here is free.

---

## The integration test

The PR's integration test loads a small ONNX model that uses Col2Im:

\`\`\`rust
#[test]
fn loads_onnx_model_with_col2im() {
    let model_path = test_data_dir().join("simple_decoder_with_col2im.onnx");
    let model = BurnGraphFromOnnx::load(&model_path).unwrap();

    let input = Tensor::<NdArray, 4>::ones([1, 3, 8, 8]);
    let output = model.forward(input);

    // Reference output from running the same model through onnxruntime
    let reference = load_reference_output(&test_data_dir().join("simple_decoder_reference.npy"));

    let output_arr = output.into_data().convert::<f32>().value;
    let ref_arr = reference.into_data().convert::<f32>().value;

    for (a, b) in output_arr.iter().zip(ref_arr.iter()) {
        assert!((a - b).abs() < 1e-5, "{} vs {}", a, b);
    }
}
\`\`\`

The test asserts that loading and running a real ONNX model with fold4d in the graph produces the same output as the ONNX reference runtime. End-to-end correctness gating.

---

## Why this PR is fast to review

Compared to A-FINE (PR #4894, 1864 lines, novel architecture), fold4d is a much smaller surface:

| Property                                          | A-FINE PR (#4894) | fold4d PR (queued) |
|---------------------------------------------------|-------------------|-------------------|
| Total lines                                        | 1864               | ~460               |
| New architecture work                              | yes (CLIP ViT)    | no                |
| New math implementation                             | yes               | yes (forward only) |
| Backward pass                                       | not applicable    | free (reuses unfold4d) |
| Integration with Burn's existing ops                 | minimal          | extensive         |
| Maintainer time to review                            | high              | low               |

The fold4d PR is the kind that lands in one review pass. The math is straightforward. The integration is well-scoped. The backward is free.

---

## Queue position

Per [the Burn engagement queue article](#queue-management), three concurrent Burn threads is the current ceiling. The current queue:

\`\`\`
                  Burn engagement queue (post-2026-05-10)

   1. PR #4894 (A-FINE)             — forward_with_features refactor (active)
   2. fold4d #4519                   — queued (informally claimed)
   3. PytorchStore #4716             — top scout pick; not engaged
   4. TensorContainer fix             — scoping comment posted (#3969)

   fold4d will start in earnest once #4894 lands.
\`\`\`

The reason for the ceiling: each PR demands maintainer attention. Saturating a maintainer with concurrent PRs from the same contributor degrades review velocity for everyone. Three is the empirical sweet spot.

---

## What this teaches about operator contributions

| Principle                                                  | Application here                                |
|------------------------------------------------------------|-------------------------------------------------|
| Check if the backward is free before scoping                | Saved ~30% of the PR's surface area              |
| Touch many files but with small changes per file            | 11 files, ~40 lines avg per file                 |
| Use the project's existing primitives in the implementation | unfold4d, Burn's tensor ops, autograd machinery  |
| Verify against the ONNX reference runtime                    | End-to-end test against onnxruntime              |
| Acknowledge the maintainer's informal claim                  | antimora's 👍 is the green light                  |

> [!important] **The "is the backward free" question**
>
> Before scoping any operator PR, check whether the operator's gradient is already implemented as some other operator. If so:
>
>   - The PR's surface area drops by half (no new backward math)
>   - The review is easier (reviewer can rely on the existing backward test suite)
>   - The PR lands faster
>
> This is a very common pattern in deep-learning frameworks. Im2Col / Col2Im, transpose / transpose, sum / broadcast — many forward ops have a dual that already exists.

---

## What is in the umbrella repo

The full design lives in \`Capataina/OpenSourceContributions/Notes/burn/fold4d/\`:

- \`math-spec.md\` — Col2Im definition and the unfold4d duality
- \`onnx-col2im-18.md\` — the ONNX operator spec
- \`reference-implementations.md\` — PyTorch, TensorFlow, ONNX Runtime references
- \`burn-internal-surface.md\` — which Burn modules need to change
- \`6-commit-plan.md\` — the commit-by-commit breakdown
- \`testing-strategy.md\` — what tests cover what

8 files of working memory for this single engagement. When the work starts, the design is already done.

---

## Closing

fold4d is the kind of OSS contribution that signals "I understand the project's architecture deeply." It is small in line count, large in scope (covers an entire ONNX operator family), and it lands cleanly because the backward is free.

The work is queued. The design is documented. The maintainer has acknowledged the informal claim. When A-FINE lands, fold4d is next, and it should be a fast review cycle.

For anyone considering operator contributions to a deep-learning framework: do the design work upfront, check whether the gradient is free, write a clear 6-commit plan, and verify against the reference runtime. That is the formula that lands operator PRs quickly.
`,
};
