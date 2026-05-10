import type { Article } from "@/types";

export const ossAiPolicySpectrum: Article = {
  slug: "oss-ai-policy-spectrum",
  title: "The AI-policy spectrum across the Rust ML ecosystem",
  type: "Article",
  date: "2026-05-10",
  project: "Open Source Contributions",
  description:
    "Nine Rust ML and systems projects, nine different positions on AI-assisted contributions. Some have explicit pragmatic policies, some have formal CONTRIBUTING.md sections, some have ai-slop labels for rejecting low-quality AI-generated patches. The spectrum from permissive to strict, and what each position implies for contributors using AI tools.",
  tags: ["open-source", "ai-policy", "rust", "contribution-etiquette"],
  body: `# The AI-policy spectrum across the Rust ML ecosystem

Open-source projects have had to develop positions on AI-assisted contributions over the last two years. Some embrace it explicitly. Some accept it implicitly but warn against low-effort submissions. Some have built tooling specifically to reject AI-generated noise. Most are somewhere in the middle.

This article maps the nine Rust ML and systems projects in my OSS portfolio across the spectrum. The positions are documented in their CONTRIBUTING.md files, their issue templates, or (most informatively) in how maintainers react to AI-generated PRs in practice.

---

## TL;DR

| Project    | AI policy stance                              | Tier (in my portfolio) |
|------------|-----------------------------------------------|------------------------|
| Tauri      | Explicit pragmatic, has \`ai-slop\` label       | 1                       |
| Burn        | Permissive (no explicit policy)                | 1                       |
| Tinygrad    | Effectively permissive (sz.py budget is the gate) | 1                   |
| Alloy       | Permissive                                     | 1                       |
| Tract       | Permissive                                     | 2                       |
| Mistral.rs  | Permissive                                     | 2                       |
| Candle      | Silent permissive (no explicit policy)        | 2                       |
| Ratatui     | Formal AI section (added 2026-05)              | 3                       |
| Tokio       | Permissive (high prestige)                    | 3                       |

> [!important] **The pattern across these nine**
>
> No project on this list bans AI assistance outright. The spectrum is from "explicit pragmatic policy" (Tauri) to "implicit permissive" (Burn, alloy, others). Even the strictest projects accept AI-assisted contributions when they are correct and clean.
>
> What gets rejected: AI-generated patches that are wrong, low-effort, or that introduce code style violations the contributor would have caught themselves if they had read the code.

---

## The four positions

\`\`\`
                  AI-policy positions (with examples)

   ┌────────────────────────────────────────────────────────┐
   │ Position A: EXPLICIT PRAGMATIC                            │
   │   CONTRIBUTING.md says: "AI assistance is fine, but you   │
   │   are responsible for the output. Test it. Read it."     │
   │   Tooling: ai-slop label for poor-quality AI submissions  │
   │   Example: Tauri                                          │
   └────────────────────────────────────────────────────────┘

   ┌────────────────────────────────────────────────────────┐
   │ Position B: FORMAL POLICY                                 │
   │   CONTRIBUTING.md has a dedicated AI section explaining   │
   │   what is acceptable and what is not. Less hostile than    │
   │   tooling-based rejection, but the rules are written.    │
   │   Example: Ratatui (added 2026-05)                       │
   └────────────────────────────────────────────────────────┘

   ┌────────────────────────────────────────────────────────┐
   │ Position C: SILENT PERMISSIVE                             │
   │   No explicit policy. AI-assisted PRs are accepted on    │
   │   merit. Bad AI PRs are rejected on merit (style, tests, │
   │   correctness). The maintainer does not bring up AI.    │
   │   Example: Burn, alloy, tract, candle                    │
   └────────────────────────────────────────────────────────┘

   ┌────────────────────────────────────────────────────────┐
   │ Position D: STRUCTURAL CONSTRAINT                         │
   │   No explicit policy. The project's structural rules     │
   │   (line budgets, mandatory tests, hard review) catch    │
   │   bad PRs regardless of how they were authored.         │
   │   Example: Tinygrad (sz.py budget)                       │
   └────────────────────────────────────────────────────────┘
\`\`\`

---

## Position A: Tauri — explicit pragmatic

Tauri's CONTRIBUTING.md has a section on AI assistance. Paraphrased:

> AI tools can be useful for boilerplate, documentation, and small fixes. They are not a substitute for understanding the code. PRs that show no evidence of the contributor understanding what they submitted will be closed. We use an "ai-slop" label for low-effort AI-generated submissions.

The "ai-slop" label is the interesting bit. Tauri's maintainers built a Process to triage AI-generated PRs that fail their quality bar. Labels do not auto-close, but they signal to the contributor that the submission is below the project's standard.

| Signal in a Tauri PR                          | What it implies                              |
|-----------------------------------------------|----------------------------------------------|
| No tests added                                  | Likely close                                 |
| Tests added but trivial                         | "ai-slop" label, request real tests           |
| Comments that explain obvious code              | Style feedback, but mergeable                |
| Comments that paraphrase the code               | "ai-slop" label                              |
| Tests + non-trivial change + clean code         | Merges normally regardless of AI use         |

The policy is honest. It does not pretend AI assistance is forbidden. It states the bar explicitly and uses labels to enforce it.

> [!note] **Why Tauri's position is defensible**
>
> Tauri has a large active user base and a maintainer team that has dealt with low-effort AI PRs. The explicit policy + tooling combination is a response to the volume problem; the policy filters obvious low-effort submissions without burning maintainer review time.
>
> For a contributor using AI tools responsibly, the policy is not hostile. It is "do the work; do not submit unverified output."

---

## Position B: Ratatui — formal policy

Ratatui added an AI section to CONTRIBUTING.md in May 2026. The section reads (paraphrased):

> We welcome contributions that use AI tools as part of the development process. We require that:
> 1. The contributor understands the code they are submitting
> 2. The PR includes the contributor's own testing
> 3. AI-generated documentation should match the codebase's existing tone
> 4. Hallucinated APIs (calls to functions that do not exist) will result in rejection
> 5. The contributor should be able to discuss the PR's design decisions

This is the formal-policy position. Less aggressive than Tauri's tooling (no "ai-slop" label), but the expectations are written down.

| Ratatui's CONTRIBUTING.md AI section adds              |
|--------------------------------------------------------|
| Explicit understanding requirement                      |
| Mandatory contributor testing                            |
| Tone-matching for documentation                          |
| Zero tolerance for hallucinated APIs                     |
| Discussability requirement                               |

The discussability requirement is the operational test. If the contributor cannot defend their PR's design decisions in review, the submission is below the bar regardless of where the code came from.

---

## Position C: Silent permissive (Burn, alloy, tract, candle)

The majority of my portfolio projects have no explicit AI policy. The interactions follow normal review process:

| What the contributor submits          | What the maintainer cares about                |
|---------------------------------------|------------------------------------------------|
| PR with code                           | Is the code correct?                            |
| PR with tests                          | Do the tests cover the change?                  |
| PR description                          | Is the design clear?                            |
| PR conversation                          | Does the contributor respond to feedback?     |

The maintainer does not bring up AI at any point. The judgement is on the work, not on the tools used.

> [!important] **Why silent permissive works**
>
> The structural facts of OSS review (correctness, tests, style, communication) are AI-agnostic. A PR that passes the project's review process is mergeable; one that fails is not. Whether AI was involved is invisible to the gate.
>
> This position is implicitly the default for most projects. Explicit policies appear when the project has been overwhelmed by low-effort AI PRs to the point where review time becomes scarce.

For Burn specifically, my own engagement (PR #4894 A-FINE, the various issues I have scoped) has not surfaced AI policy as a topic in any conversation. The maintainer reviews on merit. The work either lands or it does not, on those terms.

### What "no explicit policy" looks like in practice

For my Burn engagements, the per-repo culture notes say:

\`\`\`
                  Notes/burn/contribution-culture.md (excerpt)

   AI policy: not explicitly addressed in CONTRIBUTING.md as of 2026-05.

   Observed maintainer behaviour:
     - laggui reviews on merit; no questions about tools used
     - antimora similarly merit-based
     - PRs that have obvious AI tells (generic comments, no testing context)
       get standard "please add tests" / "please match codebase style"
       feedback, not anti-AI feedback

   Practical implication: AI assistance is fine as long as the PR
   meets the same quality bar as any other PR. Mention AI use only
   if asked. Do not lead with it; do not hide it.
\`\`\`

The practical guideline is: do the work, submit the PR on merit, let the work speak for itself.

---

## Position D: Tinygrad — structural constraint

Tinygrad's policy is implicit but enforced by code: the \`sz.py\` line budget gates every PR regardless of provenance.

| Property                                  | How sz.py enforces                              |
|-------------------------------------------|-------------------------------------------------|
| Verbose AI-generated docstrings            | Add lines; fail budget                          |
| AI-generated repetitive boilerplate        | Add lines; fail budget                          |
| Defensive checks AI tends to add           | Add lines; fail budget                          |
| Minimum sufficient implementation          | Fits in budget; passes                          |

AI-generated code tends to be more verbose than tinygrad's preferred style. The line budget creates structural pressure to produce tight code. AI contributors who do not edit their output aggressively get rejected by the budget rather than by an explicit policy.

This is an elegant design: no policy needed because the structural rule does the work.

---

## Where the maintainers actually push back

Across all nine projects in the portfolio, the rejected-PR pattern looks similar regardless of AI policy:

\`\`\`
                  Common rejection reasons (across all projects)

   most common:
     ─ no tests added
     ─ tests added are trivial / don't cover the change
     ─ code style does not match the codebase
     ─ description does not explain the design

   second tier:
     ─ duplicate of an existing issue / PR
     ─ depends on changes the project has not agreed to
     ─ extends the API surface unnecessarily
     ─ exceeds the project's complexity budget

   third tier (rarely the explicit reason, but informs the call):
     ─ generic comments that explain the obvious
     ─ paraphrasing rather than clarifying
     ─ hallucinated function references in commit messages
\`\`\`

None of these are AI-specific. They are quality issues that AI-assisted PRs are more likely to exhibit if the contributor did not review the output. A human-only PR with the same issues is rejected for the same reasons.

> [!important] **The actual maintainer concern**
>
> Maintainers do not care if you used AI. They care if you submitted code you did not understand, that does not work, or that they have to spend review time fixing on your behalf.
>
> Using AI to draft a PR you then read carefully, test thoroughly, and refine to match the codebase's style is fine. Using AI to draft a PR you submit unchecked is the failure mode.

---

## What this means for contributors

Across the spectrum, the practical guidelines for AI-assisted contribution are remarkably uniform:

| Practice                                                | All positions |
|---------------------------------------------------------|---------------|
| Test your code yourself before submitting                 | required      |
| Read the code your AI tool produced                        | required      |
| Verify any API references against the actual codebase     | required      |
| Match the project's code style (read existing files)     | required      |
| Engage substantively in review (do not just accept changes) | required    |
| Disclose AI use if asked, but do not lead with it          | recommended   |

For a contributor who does these things, the AI-policy position of the target project mostly does not matter. The PR meets the bar regardless.

For a contributor who does not do these things, no AI policy will save the PR. It will be rejected by the project's quality gates whether AI policy is explicit or not.

---

## The two corrections surfaced 2026-05-10

The scout-issues run on 2026-05-10 surfaced two corrections to my per-repo notes:

### Correction 1: Ratatui added a formal AI section

Pre-2026-05, my ratatui notes said "no explicit AI policy." This was correct at the time of writing but became wrong when ratatui added the formal section in May 2026. The scout caught it; the notes got updated.

### Correction 2: Tract Claude-trailer commits are by external contributor

I had written down "tract has Claude-trailer commits from a maintainer (kali)." Looking more carefully at the commit attributions, the trailers were actually from an external contributor (czoli1976), not the maintainer. My note had inferred maintainer endorsement from contributor activity, which was wrong.

The scout's parallel-agent design caught this because the sub-agent looking at tract specifically checks attribution patterns and reported the correction.

> [!note] **Why getting the policy right matters per project**
>
> If you misread a project's AI position, you either:
>   - Over-disclose AI use to a project that does not care (mild noise)
>   - Under-disclose AI use to a project that has an explicit policy (mild risk)
>   - Submit a PR that is over- or under-scoped relative to the project's expectations (real cost)
>
> The third case is the one that wastes review time. Per-project culture notes are the corrective.

---

## What this teaches about open-source ecosystem health

The fact that no project on my list bans AI outright is a useful signal. The fact that even the most explicit policies (Tauri) are pragmatic rather than prohibitive is another useful signal.

The OSS ecosystem is converging on: **AI tools are fine; submitting work you do not understand is not.**

This is the same standard the ecosystem has always had for human contributions. The standard is unchanged; only the tools have changed.

> [!important] **The general principle**
>
> Treat AI as a productivity tool, not a substitute for judgement. Read what it produces. Test it. Defend it in review. If you cannot defend the PR's design decisions in review, do not submit it regardless of where the code came from.
>
> This is the contract that makes OSS contribution work, with or without AI assistance.

---

## What the umbrella repo records per project

\`Capataina/OpenSourceContributions/Notes/<project>/\` contains for each:

| File                              | Content                                    |
|-----------------------------------|--------------------------------------------|
| \`contribution-culture.md\`        | Maintainer behaviour, review etiquette     |
| \`repo-conventions.md\`            | Code style, commit format                  |
| \`ai-policy.md\` (where applicable)| The project's explicit position             |
| \`_issue-triage-<date>.md\`        | Recent scout output                         |

Per-project AI policy notes are kept current because the policies change. Ratatui's formal section in May 2026 was a recent addition; before that, ratatui was in the "silent permissive" bucket. The notes track the change.

---

## Closing

The AI-policy spectrum across the Rust ML ecosystem is wider in stance than it is in practical effect. From explicit pragmatic (Tauri) to silent permissive (Burn) to structural (Tinygrad), every position lands at the same operational answer: **do the work, test it, defend it, and the PR will land on merit.**

For contributors using AI tools responsibly, the spectrum does not change the contract. For contributors using AI tools as a substitute for understanding, no position will save them; the quality gates will catch the submission regardless.

The healthy version of AI-assisted OSS contribution is the boring version: AI helps draft, the contributor reviews and refines, the maintainer reviews on merit, the PR lands or does not on the same criteria as any other PR. That is what the spectrum converges to across all nine projects in my portfolio.

The next iteration on the umbrella repo is to track these policies over time. When a project adds or changes its position, the notes get updated, and the engagement queue adjusts accordingly. The contributor relationship to AI tools is going to keep evolving, and the per-project notes are how I stay current.
`,
};
