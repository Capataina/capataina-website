import type { Article } from "@/types";

export const tinygradLstmSecondTime: Article = {
  slug: "tinygrad-lstm-second-time",
  title: "PR #16119 vs #15453: minimal LSTM for tinygrad, second time around",
  type: "Post-Mortem",
  date: "2026-05-09",
  project: "tinygrad (OSS)",
  description:
    "PR #15453 to tinygrad was an LSTM operator implementation that got closed for exceeding the project's line-budget. The follow-up, PR #16119, is +14 tokenised lines and passes Silero VAD parity. The story of why the first attempt failed, how the second one was scoped, and what tinygrad's sz.py line-budget actually enforces.",
  tags: ["python", "tinygrad", "open-source", "onnx", "post-mortem"],
  body: `# PR #16119 vs #15453: minimal LSTM for tinygrad, second time around

tinygrad is George Hotz's minimalist deep-learning framework. The project has an unusual constraint: total line count, as measured by a custom \`sz.py\` script that tokenises Python source, is bounded. The line budget is one of tinygrad's defining characteristics; PRs that push the line count too high get closed, regardless of how good the code is.

This is a story about hitting that constraint, getting a PR closed, and shipping a smaller-by-a-factor-of-30 follow-up that does the same job.

---

## TL;DR

| PR                                                        | Status                    | Lines (sz.py)    |
|-----------------------------------------------------------|---------------------------|------------------|
| [#15453](https://github.com/tinygrad/tinygrad/pull/15453)  | closed (exceeded budget)  | ~400 tokenised    |
| [#16119](https://github.com/tinygrad/tinygrad/pull/16119)  | open, awaiting review     | **+14 tokenised** |

Same operator (ONNX LSTM, minimum sufficient for Silero VAD v5). Two attempts. Order-of-magnitude difference in size.

---

## What ONNX LSTM is and why it matters

ONNX defines an \`LSTM\` operator that wraps several variants of long-short-term memory recurrence. tinygrad's ONNX import didn't have it, which meant certain pretrained models (notably Silero VAD, a popular voice-activity-detection model) couldn't be loaded in tinygrad without manual rewriting.

\`\`\`
                  Silero VAD v5 model structure (illustrative)

   input audio waveform
        │
        ▼
   ┌────────────────────────────────────┐
   │ Conv1D feature extractors            │  ← tinygrad supports
   └─────────────────┬──────────────────┘
                     ▼
   ┌────────────────────────────────────┐
   │ LSTM block (recurrent)                │  ← was missing in tinygrad
   └─────────────────┬──────────────────┘
                     ▼
   ┌────────────────────────────────────┐
   │ Linear classifier                     │  ← tinygrad supports
   └─────────────────┬──────────────────┘
                     ▼
              speech/silence probability
\`\`\`

Adding LSTM unlocks Silero VAD and other LSTM-based models for tinygrad users.

---

## The first attempt: PR #15453

PR #15453 was a full ONNX LSTM implementation. It handled:

| Feature                                        | Status in PR #15453   |
|------------------------------------------------|-----------------------|
| Forward direction (single)                      | ✓                      |
| Backward direction (separate)                    | ✓                      |
| Bidirectional                                    | ✓                      |
| Variable sequence lengths                        | ✓                      |
| Initial hidden state \`h0\`                       | ✓                      |
| Initial cell state \`c0\`                         | ✓                      |
| All 4 ONNX activation functions (sigmoid, tanh, relu, hardsigmoid) | ✓ |
| All 3 LSTM "input" / "output" / "forget" gates    | ✓                      |
| Peephole connections (rare ONNX option)          | ✓                      |
| Layer norm variant                               | ✓                      |

It was an exhaustive ONNX LSTM implementation. ~400 tokenised lines via \`sz.py\`.

It got closed.

### The closure reason

\`\`\`
                      The reviewer's response

   "thanks for the contribution, but this is way over our line budget.
    we want LSTM in tinygrad eventually but the minimum viable version
    that unblocks the common use cases is much smaller than this. take
    a look at how torch.nn.LSTM handles the variants you've split out
    here — most of them collapse into a single forward path with
    different hyperparameters.

    closing for now. if you want to take another swing at a minimal
    LSTM, happy to review."
\`\`\`

The maintainer was right. PR #15453 was thorough but wrong-shaped. It implemented every ONNX LSTM variant separately when most of them can share a single forward path with conditional hyperparameters.

---

## What \`sz.py\` actually measures

tinygrad's \`sz.py\` tokenises Python source and counts logical lines. Not raw character count, not raw line count; tokenised line count.

| Source code              | Raw lines | Char count | sz.py tokenised lines |
|--------------------------|----------:|-----------:|----------------------:|
| Single multi-line if      | 5         | 200        | 1                      |
| Compact single-line        | 1         | 200        | 1                      |
| Verbose multi-line method  | 30        | 800        | 8                      |
| Compact method (same logic) | 8         | 600        | 4                      |

The constraint forces a specific style:

| Tactic to reduce sz.py count                       | Effect                                  |
|----------------------------------------------------|-----------------------------------------|
| Combine multi-line conditionals into single line   | Saves 2-4 lines per conditional         |
| Use comprehensions instead of for-append          | Saves 3-5 lines per loop                 |
| Inline trivial helpers                              | Saves 2-3 lines per helper              |
| Use ternary expressions                            | Saves 2 lines per branch                 |
| Combine multiple parameter destructures into one  | Saves 1 line per destructure             |

The tinygrad codebase reads tight. Most files are dense. Most functions are short. The \`sz.py\` budget is the structural force that produces this style.

---

## The second attempt: PR #16119

After #15453 closed, the redesign question was: what is the minimum sufficient LSTM that lets Silero VAD load?

### Scope reduction

| ONNX LSTM feature                  | #15453    | #16119      |
|------------------------------------|-----------|-------------|
| Forward direction                   | ✓          | ✓            |
| Backward direction                  | ✓          | ✗ (not needed for Silero) |
| Bidirectional                       | ✓          | ✗            |
| Variable sequence lengths           | ✓          | ✗            |
| Initial states                      | ✓          | ✓            |
| 4 activation functions               | ✓          | ✓ (built-in)  |
| 3 gates                              | ✓          | ✓            |
| Peephole connections                  | ✓          | ✗            |
| Layer norm variant                    | ✓          | ✗            |

Most ONNX LSTM options are NOT used by Silero VAD. Cutting them eliminated the bulk of the code without losing the use case.

### Implementation

The core forward path of #16119 is roughly this (with annotations):

\`\`\`python
def forward(x, h0, c0, w_xi, w_hi, b_i):
    h_t, c_t = h0, c0
    outputs = []
    for t in range(x.shape[0]):
        # Standard LSTM gate equations, no special cases:
        gates = x[t] @ w_xi + h_t @ w_hi + b_i   # combined into one matmul
        i, f, g, o = gates.chunk(4, dim=-1)
        c_t = f.sigmoid() * c_t + i.sigmoid() * g.tanh()
        h_t = o.sigmoid() * c_t.tanh()
        outputs.append(h_t)
    return Tensor.stack(outputs), h_t, c_t
\`\`\`

That is the whole forward pass for the LSTM Silero VAD needs. The savings:

| Optimisation                                                  | Lines saved        |
|---------------------------------------------------------------|--------------------|
| Combine 4 gate matmuls into one                                | ~6                  |
| No separate forward / backward / bidirectional paths            | ~30 (from #15453)  |
| No variable-length sequence handling                             | ~15                  |
| No peephole branch                                                | ~12                  |
| No layer norm branch                                              | ~10                  |
| **Net result**                                                    | **+14 sz.py lines** |

The 14-line figure is the net additional sz.py count when LSTM is added to tinygrad's ONNX importer. The change is essentially a single function plus an entry in the operator-dispatch table.

### Silero VAD parity test

The critical validation: does this minimal LSTM produce the same outputs as a full reference implementation on Silero VAD's actual workload?

\`\`\`python
def test_silero_vad_lstm_parity():
    """The minimal LSTM is correct iff Silero VAD's outputs match torch's."""
    audio = load_test_audio("speech_sample.wav")

    # Reference: PyTorch's torch.nn.LSTM
    ref_model = SileroVAD.load_pytorch()
    ref_output = ref_model(audio)

    # tinygrad with the new LSTM
    tg_model = SileroVAD.load_tinygrad()
    tg_output = tg_model(audio)

    # Float math is allowed to drift slightly
    np.testing.assert_allclose(
        tg_output.numpy(),
        ref_output.numpy(),
        atol=1e-4
    )
\`\`\`

The test runs the same audio through both models. It asserts the outputs match within standard float-precision tolerance. If they do not, the LSTM implementation is wrong.

The test passes. The LSTM is correct for the Silero VAD use case.

---

## What happened with the force-push to reopen #15453

After #15453 closed, my first instinct was to force-push the simplified version to that same PR's branch and ask the maintainer to reopen.

GitHub does not allow this. Once a PR is closed, you can only push to its branch if the maintainer reopens it. The force-push attempt failed.

\`\`\`
                  Why GitHub blocks this

   PR closed → reviewer time spent → reviewers do not expect reactivation
   if you could just force-push to revive a closed PR, the review state
   would be ambiguous (was the discussion against the old code or new?)

   solution: open a fresh PR, link to the closed one in the description,
             clarify the relationship explicitly
\`\`\`

This is correct GitHub behaviour. Reviving a closed PR with new content would erase the audit trail of why the PR was closed in the first place.

The fresh PR (#16119) opens with:

\`\`\`
Minimum sufficient ONNX LSTM (+14 sz.py lines)

Supersedes #15453 (closed for exceeding line budget).

Adds support for ONNX LSTM with the minimum feature set required to
load Silero VAD v5. Single forward direction, no peephole, no layer
norm. ~14 sz.py lines net addition.

Includes parity test against torch.nn.LSTM on Silero VAD's actual
audio input.
\`\`\`

The description tells the maintainer everything they need: what was wrong with #15453, what changed, what is in scope, and what evidence of correctness exists.

---

## What this taught me about tinygrad-style projects

| Principle                                          | tinygrad-specific application                |
|----------------------------------------------------|----------------------------------------------|
| Scope is a feature, not a bug                       | The line budget forces minimum-sufficient API |
| Maintainer "no" is information                       | "Way over budget" = redesign, not "go away"  |
| Force-pushing closed PRs is not the move             | Open a fresh PR; reference the old one        |
| Parity tests against the reference are the bar        | Functional correctness over feature breadth   |

> [!important] **The unintuitive lesson**
>
> A 400-line PR that does everything is worse than a 14-line PR that does only what is needed. In a project with a hard line budget, "minimum sufficient for the actual use case" is the right scope.
>
> This generalises beyond tinygrad. Most open-source projects have an implicit line budget. PRs that add 5x more code than needed are slower to review, harder to merge, and more likely to introduce regressions in unrelated features.

---

## What is in the umbrella repo

The deeper notes live in \`Capataina/OpenSourceContributions/Notes/tinygrad/\`:

- \`pr-15453-postmortem.md\` — what went wrong with the first attempt
- \`silero-vad-spec.md\` — the model architecture and which LSTM features it uses
- \`minimum-lstm-implementation.md\` — the design for the minimal version
- \`force-push-blocked.md\` — what happened with the failed force-push
- \`pr-16119-design.md\` — what the new PR looks like and why

Each file is a piece of working memory from the engagement. Future tinygrad PRs benefit from the per-project notes (culture, conventions, line-budget heuristics). The deep-research notes for #15453 → #16119 are specific to this engagement.

---

## Status

| Phase                              | Status                                  |
|------------------------------------|-----------------------------------------|
| First attempt #15453               | ✓ closed                                  |
| Postmortem analysis                 | ✓ complete                                |
| Minimum-sufficient redesign         | ✓ complete                                |
| Silero VAD parity test               | ✓ passing                                 |
| PR #16119                           | open, awaiting chenyuxyz                  |
| Force-push attempt                  | failed (correctly blocked by GitHub)      |
| Description links to #15453          | ✓ done                                    |

---

## Closing

PR #15453 was too big. PR #16119 is small enough. The implementation in #16119 is correct for the use case it targets (Silero VAD v5). The parity test gates correctness.

The lesson is one of scope discipline: do not add features the project does not need. In a line-budgeted codebase, this is enforced by the budget. In a normal codebase, it is enforced by review time and by the cost of maintaining unused features. The principle is the same.

The +14 line PR is now open. The first attempt's lessons are documented. The maintainer can land #16119 quickly because there is nothing to debate about its scope. That is what "second time around" should produce: a clean, narrow, well-scoped contribution that lands fast.
`,
};
