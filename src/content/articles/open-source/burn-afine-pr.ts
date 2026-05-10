import type { Article } from "@/types";

export const burnAfinePr: Article = {
  slug: "burn-afine-pr",
  title: "A-FINE for Burn: 1,864 lines, an inlined CLIP ViT backbone, and surviving review",
  type: "Dev Log",
  date: "2026-04-29",
  project: "Burn (OSS)",
  description:
    "PR #4894 to tracel-ai/burn implements A-FINE, a no-reference image-quality metric, in the Rust ML framework. It is 1,864 lines across 10 files, includes an inlined CLIP ViT backbone with a PyTorch-weight loader, and is currently in active review with the maintainer. The technical decisions, the review feedback, and what landing in a serious Rust ML project looks like.",
  tags: ["rust", "burn", "open-source", "machine-learning", "computer-vision"],
  body: `# A-FINE for Burn: 1,864 lines, an inlined CLIP ViT backbone, and surviving review

A-FINE (Aesthetic, Fidelity, INtegrity, no-reference Evaluation) is an image-quality metric that scores images without needing a reference. It is published in Yang et al. (2024) and the reference PyTorch implementation lives in the FINE project.

Burn is the Rust-native deep learning framework (tracel-ai/burn). It has implementations of common architectures and training utilities, but its image-quality-metric coverage was incomplete. The Rust ML ecosystem in general has fewer no-reference metrics than the Python one.

PR #4894 to Burn adds A-FINE: 1,864 lines across 10 files, including an inlined CLIP ViT backbone (because Burn does not have a stock CLIP and depending on an external crate would have been the wrong call) and a PyTorch-weight loader so users can load the official A-FINE weights without re-training.

This article is the dev log of building it, getting feedback from the maintainer, and what is in scope for the next iteration.

---

## TL;DR

| Metric                              | Value                                         |
|-------------------------------------|-----------------------------------------------|
| PR number                            | [#4894](https://github.com/tracel-ai/burn/pull/4894) |
| Total lines added                    | 1,864                                          |
| Files added                          | 10                                             |
| Status                               | Open, in active review with maintainer (laggui) |
| Outstanding work                     | \`forward_with_features\` refactor             |
| Reference paper                      | Yang et al. (2024), A-FINE                     |
| Reference Python implementation       | Available; ported as part of the PR             |

---

## What A-FINE does

\`\`\`
                  A-FINE pipeline (illustrative)

   input image (256×256 RGB)
        │
        ▼
   ┌────────────────────────────────────────┐
   │ CLIP ViT vision backbone                 │
   │   (used as a frozen feature extractor)   │
   └────────────────┬───────────────────────┘
                    │ image features
                    ▼
   ┌────────────────────────────────────────┐
   │ A-FINE head (4-layer MLP)                │
   │   - aesthetic score                      │
   │   - fidelity score                       │
   │   - integrity score                      │
   └────────────────┬───────────────────────┘
                    │
                    ▼
                final A-FINE score (scalar)
\`\`\`

The interesting bits:

| Component             | Source                                          |
|-----------------------|-------------------------------------------------|
| CLIP ViT backbone      | Inlined into the Burn PR (no external crate)    |
| A-FINE head            | New, ported from the paper's reference Python    |
| PyTorch weight loader  | New, in Burn's \`burn-store\` crate              |
| Calibration weights    | From the official A-FINE release                  |

---

## The first decision: do not depend on an external CLIP crate

The obvious shortcut would be to depend on an existing Rust CLIP crate, write A-FINE's head, and call it done. I did not.

| Approach                             | Pro                                | Con                              |
|--------------------------------------|------------------------------------|----------------------------------|
| Depend on external CLIP crate         | Less code                          | Dependency on an unmaintained crate; weight format mismatch |
| Inline CLIP into Burn                 | Self-contained; clean              | More code; need to port the ViT  |
| Use Burn's existing transformer       | Less code                          | Burn's transformer is not exactly CLIP-ViT |

The inline-CLIP-ViT approach won because:

1. **No external dependency surface**. Burn's PR can be reviewed against the paper's reference without me having to also vouch for some other Rust crate.
2. **Burn's transformer module is general; CLIP-ViT is specific**. The paper's reference uses CLIP-ViT with specific norm placement, specific positional embedding, specific layer-norm-vs-batch-norm choices. Adapting Burn's general transformer would have meant either (a) parameterising it heavily or (b) producing a transformer that does not match the paper's reference. Inlining a CLIP-specific implementation is cleaner.
3. **Future-proofing**. Inlined into Burn's contrib tree, the CLIP ViT can be used by other metrics later. Subsequent contributions can rely on it.

The maintainer (laggui) confirmed this was the right call during the initial design discussion.

---

## The PR structure

\`\`\`
PR #4894 file list:

  crates/burn-metric/
  ├── src/
  │   ├── afine/
  │   │   ├── backbone.rs        ─ CLIP ViT vision encoder (inlined)
  │   │   ├── head.rs             ─ A-FINE head (MLP + scoring)
  │   │   ├── mod.rs              ─ public API + forward
  │   │   ├── preprocessing.rs   ─ resize + normalise
  │   │   └── weights.rs          ─ PyTorch weight loader (uses burn-store)
  │   └── lib.rs                  ─ register A-FINE in burn-metric exports

  examples/
  └── afine-cli/
      ├── Cargo.toml              ─ standalone example crate
      ├── src/main.rs              ─ CLI: image → A-FINE score
      └── README.md                ─ usage instructions

  tests/
  └── afine_e2e.rs                 ─ end-to-end against reference scores
\`\`\`

Roughly 1,000 lines of the 1,864 are the CLIP ViT implementation; the rest is A-FINE head, preprocessing, weight loading, tests, and the example crate.

### The CLIP ViT inlining

\`\`\`rust
// crates/burn-metric/src/afine/backbone.rs (excerpt)

use burn::module::{Module, Param};
use burn::nn::{Linear, LayerNorm, Gelu};
use burn::tensor::{Tensor, backend::Backend};

#[derive(Module, Debug)]
pub struct ClipViTBlock<B: Backend> {
    attn_norm: LayerNorm<B>,
    qkv: Linear<B>,
    proj: Linear<B>,
    mlp_norm: LayerNorm<B>,
    mlp_fc1: Linear<B>,
    mlp_act: Gelu,
    mlp_fc2: Linear<B>,
    num_heads: usize,
    head_dim: usize,
}

impl<B: Backend> ClipViTBlock<B> {
    pub fn forward(&self, x: Tensor<B, 3>) -> Tensor<B, 3> {
        // pre-norm transformer block (CLIP style)
        let normed = self.attn_norm.forward(x.clone());
        let attn = self.self_attention(normed);
        let x = x + attn;

        let normed = self.mlp_norm.forward(x.clone());
        let mlp = self.mlp_fc2.forward(
            self.mlp_act.forward(self.mlp_fc1.forward(normed))
        );
        x + mlp
    }

    fn self_attention(&self, x: Tensor<B, 3>) -> Tensor<B, 3> {
        // ... QKV split, scaled dot-product attention, output projection
    }
}
\`\`\`

The full block plus the patch embedding, positional embedding, and class token gives a working CLIP ViT vision encoder in Burn. ~600 LoC for the backbone.

---

## The PyTorch weight loader

The A-FINE paper ships with PyTorch weights. To use those weights in Burn, the PR adds a converter:

\`\`\`rust
// crates/burn-metric/src/afine/weights.rs (excerpt)

use burn_store::{PyTorchWeights, NamedTensor};

pub fn load_afine_weights<B: Backend>(
    path: &Path,
    device: &B::Device,
) -> Result<AFineModule<B>> {
    let weights = PyTorchWeights::open(path)?;
    let mut module = AFineModule::<B>::new(device);

    // CLIP ViT weights
    for block_idx in 0..12 {
        let prefix = format!("backbone.blocks.{block_idx}");
        module.backbone.blocks[block_idx].attn_norm = LayerNorm::load(
            weights.get(&format!("{prefix}.attn_norm.weight"))?,
            weights.get(&format!("{prefix}.attn_norm.bias"))?,
            device,
        )?;
        module.backbone.blocks[block_idx].qkv = Linear::load(
            weights.get(&format!("{prefix}.qkv.weight"))?,
            weights.get(&format!("{prefix}.qkv.bias"))?,
            device,
        )?;
        // ... etc.
    }

    // A-FINE head weights
    module.head.fc1 = Linear::load(/* ... */)?;
    module.head.fc2 = Linear::load(/* ... */)?;
    // ...

    Ok(module)
}
\`\`\`

\`burn-store\` is Burn's PyTorch-compatibility layer. It can read \`.pt\` and \`.pth\` files. The weight-loading code is roughly 200 LoC and handles every layer in the A-FINE model.

---

## The review process

The PR was opened on a clear-design pass. The maintainer (laggui) reviewed in two rounds:

### Round 1: high-level architecture

| Comment topic                                       | Resolution                                       |
|-----------------------------------------------------|--------------------------------------------------|
| Should CLIP be inlined or external?                  | Confirmed: inline (this was the right call)       |
| Should A-FINE go in burn-metric or its own crate?    | burn-metric is right                              |
| Should the example be in-tree or external?            | In-tree (\`examples/afine-cli\`)                  |
| Test data inclusion?                                  | Use small known-public test images only           |

These were design-level questions answered before code review proper began. None required code changes; they validated the structure.

### Round 2: code review

| Finding                                              | Status        |
|------------------------------------------------------|---------------|
| Inconsistent doc-comment style across modules         | ✓ fixed       |
| Some Linear::load calls had no error context          | ✓ fixed (added .with_context) |
| Preprocessing constants belong in a single module     | ✓ fixed (\`preprocessing.rs\`) |
| Test fixture file paths use relative paths             | ✓ fixed (absolute via \`CARGO_MANIFEST_DIR\`) |
| **\`forward_with_features\` refactor**                | **outstanding** |

The outstanding item is the largest. The current API is:

\`\`\`rust
// current API
let score = afine.forward(image);
\`\`\`

The maintainer wants:

\`\`\`rust
// requested API
let (score, features) = afine.forward_with_features(image);
// where features is the CLIP intermediate, useful for other metrics
\`\`\`

This is the right call (it lets future metrics reuse the CLIP backbone activations), but it requires restructuring the forward pass. That work is the next thing I owe the PR.

---

## What the review taught me about Rust ML PRs

> [!important] **The maintainer's feedback shape**
>
> Round 1 was about "is the design right" — the kind of thing where the maintainer's experience with the codebase is the value. Round 2 was about "does the code match the codebase's conventions" — naming, error handling, documentation.
>
> Neither round caught any correctness bugs. The PR was correct at the math level when it was submitted. The review caught style and architecture issues.
>
> The lesson: write the math correctly the first time, by testing against the reference Python implementation. Once it is correct, the review is about fitting the codebase's conventions, which is much easier work to do.

A few specific things that made the PR review-able:

| Practice                                                | Why                                          |
|---------------------------------------------------------|----------------------------------------------|
| Self-contained: no new external dependencies             | Reviewer does not need to vet other crates    |
| End-to-end test against reference scores                 | Correctness is proven in CI                   |
| Each commit on a logical chunk                            | Reviewer can cherry-pick understanding         |
| Reference paper cited in module-level docs                | Reviewer can verify against the paper          |
| README in the example explains how to run end to end     | Reviewer can run it locally                    |

The PR's signals are designed to make the reviewer's job easier. The reviewer (laggui) is a Burn maintainer, busy, with limited time per PR. The PR's job is to land cleanly, not to require maintainer effort.

---

## The end-to-end test

The most important file is the e2e test:

\`\`\`rust
// tests/afine_e2e.rs

#[test]
fn afine_score_matches_reference_within_tolerance() {
    let device = Default::default();
    let afine = AFine::<NdArray>::load_default_weights(&device).unwrap();

    // Three test images from public datasets
    let test_cases = vec![
        ("test_data/landscape.jpg", 6.42),       // reference score from Python
        ("test_data/portrait.jpg", 7.18),
        ("test_data/screenshot.jpg", 3.95),
    ];

    for (path, expected) in test_cases {
        let image = load_test_image(path).unwrap();
        let score = afine.forward(image);
        let score_f32 = score.into_scalar();
        // Tolerance is 1e-3 — float math is allowed to drift
        assert!(
            (score_f32 - expected).abs() < 1e-3,
            "image {} scored {} vs reference {}",
            path, score_f32, expected
        );
    }
}
\`\`\`

Three images, three reference scores from the Python implementation. The Rust port has to match within 1e-3. If a future change breaks this, the test catches it immediately.

The reference scores were captured by running the Python implementation against the same images with a small Python script (\`capture_afine_fixtures.py\` in the OSS umbrella repo) that records the exact scores to disk. Capturing them once means the test does not require running Python in CI.

---

## What the PR is teaching me about open-source contribution

| Lesson                                                  | Application                                   |
|---------------------------------------------------------|-----------------------------------------------|
| Match the project's contributor conventions              | Read CONTRIBUTING.md before any code           |
| Make the maintainer's review job easy                    | Logical commits, clear docs, end-to-end tests |
| Cite the reference paper                                  | Maintainer can verify against the paper       |
| Self-contained PRs                                        | No "this depends on me also landing X"        |
| Address feedback in the same conversation                  | Reviewer's time is the bottleneck             |
| Be patient                                                 | Multi-week review cycles are normal             |

The PR is approaching three weeks of review time. That is fine. Maintainers have day jobs. The work is on me to make each review round productive, and on the timeline to be what it is.

---

## What is in the OSS umbrella repo

The deeper work for this PR lives in \`Capataina/OpenSourceContributions/Notes/burn/\` (private repo). It contains:

- 24+ markdown files on Burn's culture, conventions, and per-issue research
- The \`capture_afine_fixtures.py\` script
- The full PR design document
- Per-round review notes (what feedback came back, how I addressed it)
- The \`forward_with_features\` refactor design (in progress)

The umbrella repo treats every OSS engagement as a small research project. Per-repo culture is documented separately from per-issue work. New engagements start by reading the per-repo notes; in-flight engagements update the per-issue notes.

This is the kind of organisation that scales. The next Burn PR will benefit from the existing \`burn/\` notes. The next maintainer interaction will benefit from the lessons in the comms templates.

---

## What this is worth on a portfolio

For someone evaluating engineering work, a 1,864-line PR to a serious Rust ML framework signals:

| Signal                                              | What it indicates                            |
|-----------------------------------------------------|----------------------------------------------|
| 1,864 lines, 10 files, in-tree example crate          | Substantial deliverable, not a typo fix       |
| End-to-end tests against published reference           | Correctness work, not "looks reasonable"       |
| Inlined CLIP ViT from scratch                          | Real ML implementation work, not glue code   |
| PyTorch weight compatibility                            | Cross-framework engineering                   |
| Surviving two rounds of maintainer review              | Communication + code quality + iteration discipline |
| Outstanding refactor on the maintainer's request        | Currently active, not a finished story       |

The PR is one piece of a multi-engagement OSS effort with Burn. The full Burn engagement also includes fold4d (Col2Im operator), tensor-container-panic dual-fix, and PytorchStore non-contiguous handling. (Other articles cover those.)

---

## Closing

A-FINE for Burn is the kind of OSS work I want to be doing: substantial, correct, well-tested, and aligned with where the project's maintainers want the codebase to go. The 1,864 lines are not a humblebrag; they are the cost of doing the work correctly without shortcuts.

The PR will land when the \`forward_with_features\` refactor is done. The refactor is in progress. The remaining work is bounded.

If you are considering contributing to a serious open-source project, the lessons from this PR generalise:

| Generalised lesson                                        |
|-----------------------------------------------------------|
| Verify correctness against the reference before opening    |
| Inline rather than depend, where dependency would create risk |
| Make the maintainer's review job as easy as possible       |
| Cite the paper / spec in code comments                      |
| Self-contained PRs are mergeable PRs                        |
| Multi-round review is the norm; budget for it               |

The work is the point. Landing the PR is a deliverable. Doing the work in a way that benefits the project's future is the actual goal.
`,
};
