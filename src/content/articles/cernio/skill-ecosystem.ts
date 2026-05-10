import type { Article } from "@/types";

export const cernioSkillEcosystem: Article = {
  slug: "cernio-skill-ecosystem",
  title: "Nine specialised AI skills, one job-search agent: how Cernio's skill ecosystem works",
  type: "Case Study",
  date: "2026-02-22",
  project: "Cernio",
  description:
    "Why Cernio runs nine narrow Claude Code skills instead of one big general-purpose prompt, what each skill does, and what four iterations of the grading rubric taught me about getting consistent judgement out of an LLM.",
  tags: ["ai-tools", "claude-code", "prompt-engineering", "skill-design"],
  body: `# Nine specialised AI skills, one job-search agent: how Cernio's skill ecosystem works

Cernio combines deterministic Rust scripts with an AI judgement layer to filter and grade job postings. The AI layer is not a single prompt. It is nine specialised skills, each of them a Claude Code skill in the formal sense.

This article is about why nine narrow skills work better than one big prompt, what each one does, and what I learned from four major rounds of calibration on the grading rubric specifically.

---

## TL;DR

| Approach                                  | Grade-vs-mine agreement | Maintenance |
|-------------------------------------------|------------------------:|-------------|
| One big prompt (round 1)                  | ~60%                    | "tweak the prompt"        |
| Anchored examples (round 3)               | ~85%                    | Add anchor jobs           |
| Anchors + failure-mode anchors (round 4)  | **~90%**                | Add new failure anchors   |

Nine narrow skills run reliably. One big prompt does not. The difference is not language; it is examples.

---

## The argument for narrow skills

The naive design for Cernio's AI layer would be one prompt:

\`\`\`
Here is a job description.
Here is the candidate profile.
Give it a grade from SS to F and explain why.
\`\`\`

This is roughly what I started with. It does not work.

> [!warning] **The failure mode is consistency.**
>
> The same job description on Monday and Wednesday produces different grades. The same candidate profile applied to two near-identical jobs produces different grades.
>
> The grader is doing the right kind of work, but the work is unreliable enough that aggregating across hundreds of grades produces noise that dominates signal.

The fix is to do less, and do it more carefully. Each Cernio skill has one job. Each skill has the smallest possible prompt that does that job. Each skill has worked examples (real jobs that were graded with reasoning shown) that calibrate the model's judgement. Each skill has reference files that the model must read before it acts.

\`\`\`
              Naive: one big prompt              Cernio: nine narrow skills

         ┌─────────────────────────┐             ┌──────────────────────────┐
         │ "grade this, choose a   │             │  extract-profile         │
         │  candidate, write a     │             │  scout-companies         │
         │  letter, do everything" │             │  check-fit               │
         │                         │             │  grade-job               │
         │  10,000-word prompt     │             │  calibrate-grades        │
         │  60% reliable           │             │  resolve-ats             │
         │                         │             │  clean-listing           │
         │                         │             │  write-application       │
         │                         │             │  session-coach           │
         │                         │             │                          │
         │                         │             │  90% reliable            │
         └─────────────────────────┘             └──────────────────────────┘
\`\`\`

This is a lot of upfront effort. It also produces dramatically more consistent output.

---

## The nine skills

### Skill catalogue

| # | Skill                | Type        | Trigger        | Output                                       |
|---|----------------------|-------------|----------------|----------------------------------------------|
| 1 | extract-profile      | Foundation  | Manual         | \`profile.md\`                               |
| 2 | scout-companies      | Pipeline    | Search request | New \`companies.csv\` rows                   |
| 3 | check-fit            | Pipeline    | New company    | Company-level S/A/B/C grade                  |
| 4 | **grade-job**        | Pipeline    | Each new job   | SS/S/A/B/C/F + reasoning                     |
| 5 | calibrate-grades     | Maintenance | Periodic       | Drift report + rubric updates                 |
| 6 | resolve-ats          | Auxiliary   | ATS change      | Updated \`ats_endpoint\` field                |
| 7 | clean-listing        | Auxiliary   | Malformed feed  | Repaired job description                      |
| 8 | write-application    | On-demand   | Manual          | Cover letter draft + tailored CV summary      |
| 9 | session-coach        | Meta         | End of session  | Summary + next-steps + open threads           |

Each skill has a SKILL.md, a reference folder, and worked examples. Each skill is self-contained: it can be invoked on its own, with its own input, without needing the rest of Cernio to be loaded.

### How they fit together

\`\`\`
                       Cernio AI flow

     ┌─────────────┐
     │ My CV, etc. │
     └──────┬──────┘
            ▼
   ┌──────────────────┐
   │ extract-profile  │ ───▶ profile.md (read by every other skill)
   └──────────────────┘
            │
            ▼ search direction (e.g. "Rust systems, EU/UK")
   ┌──────────────────┐
   │ scout-companies  │ ───▶ new company rows
   └────────┬─────────┘
            │
            ▼ per new company
   ┌──────────────────┐
   │ resolve-ats      │ ───▶ ats_endpoint set on row
   └──────────────────┘
            │
            ▼ deterministic Rust scrape
   ┌──────────────────┐
   │ check-fit        │ ───▶ company-level grade (S/A/B/C)
   └──────────────────┘
            │
            ▼ for jobs at company
   ┌──────────────────┐
   │ clean-listing    │ ───▶ normalised description
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │ grade-job        │ ───▶ SS/S/A/B/C/F + reasoning
   └────────┬─────────┘
            │
            ▼ for jobs I want to apply to
   ┌──────────────────┐
   │ write-application│ ───▶ cover letter draft + CV summary
   └──────────────────┘

   periodic: calibrate-grades runs on samples
   end of session: session-coach summarises
\`\`\`

### Why this works in Claude Code specifically

Claude Code's skill system loads skills on demand; when \`grade-job\` runs, only \`grade-job\`'s prompt is in the model's context window, not the other eight. This matters because:

| Property                | Single big prompt | Nine narrow skills          |
|-------------------------|-------------------|------------------------------|
| Tokens per call         | ~10,000           | ~2,000 (just relevant skill) |
| Distraction risk        | high              | low                          |
| Calibration scope       | everything at once| one skill at a time          |
| Failure isolation       | mysterious        | pinpointed                   |
| Cost per grade          | high              | low                          |

---

## The grading skill, in detail

The grading skill is the most important of the nine and the one I rebuilt the most.

### What the prompt looks like (skeleton)

\`\`\`markdown
# grade-job

Read the job description below. Compare it to:
1. The candidate profile (loaded from profile.md)
2. The five canonical anchor grades (SS, S, A, B, F)
3. The four failure-mode anchors

Assign a grade from SS to F.

For each grade, explain in 2-3 sentences:
- Which axes of the candidate profile this job hits
- Which axes it misses
- The specific phrase / requirement that drove the grade

Output format:
GRADE: <SS|S|A|B|C|F>
REASONING: <2-3 sentences>
\`\`\`

That is roughly 200 lines of skill body. The references (anchor jobs, profile schema, rubric definitions) add another 2,000 lines. Total skill weight: ~5 KB of markdown.

---

## What four iterations of the grading rubric taught me

Four major rounds of work landed before the grading skill stabilised.

### Round 1: too lenient

The first rubric described the grade tiers in general terms.

\`\`\`
SS — perfect match
S  — excellent match
A  — strong match
B  — okay match
C  — weak match
F  — not worth applying
\`\`\`

Without anchored examples, the model interpreted "perfect match" as "decent match," and the grade distribution skewed badly toward S and A.

\`\`\`
Round 1 distribution (200 jobs, single batch):

  SS  ████████░░░░░░░░░░░░░░░░░░░  16  (8%)
  S   ████████████████████░░░░░░░  78  (39%)
  A   ████████████░░░░░░░░░░░░░░░  56  (28%)
  B   ███░░░░░░░░░░░░░░░░░░░░░░░░  31  (15.5%)
  C   ░░░░░░░░░░░░░░░░░░░░░░░░░░░  9   (4.5%)
  F   ███░░░░░░░░░░░░░░░░░░░░░░░░  10  (5%)
\`\`\`

Almost no jobs landed in C or F. The high-signal SS/S/A tier became 75 percent of all jobs, which is the same problem as having no grading at all.

### Round 2: too strict

I tightened the rubric language ("SS requires every preference to be exactly met," "F is anything that misses any criterion"). The distribution flipped:

\`\`\`
Round 2 distribution (same 200 jobs):

  SS  ░░░░░░░░░░░░░░░░░░░░░░░░░░░  2   (1%)
  S   █░░░░░░░░░░░░░░░░░░░░░░░░░░  4   (2%)
  A   ██░░░░░░░░░░░░░░░░░░░░░░░░░  9   (4.5%)
  B   ████░░░░░░░░░░░░░░░░░░░░░░░  18  (9%)
  C   ███████░░░░░░░░░░░░░░░░░░░░  27  (13.5%)
  F   ████████████████████████░░░ 140  (70%)
\`\`\`

Real opportunities got graded down because they missed one bullet on the candidate profile. The grader had become a checklist.

### Round 3: anchored examples

The fix was to stop describing grades in language and start showing them.

\`\`\`
Round 3 rubric structure:

   ─── SS anchor ───
   Job: Senior Systems Engineer @ FictionalSystems
   Description: [400 words of actual JD]
   Candidate profile axes: [matches all 8 of the candidate's primary axes]
   Why SS: [reasoning showing which axes hit and how]

   ─── S anchor ───
   Job: ...

   ─── A anchor ───
   Job: ...

   ─── B anchor ───
   Job: ...

   ─── F anchor ───
   Job: ...

   --- end anchors ---

   Now grade THIS new job against those five anchors:
   [new job description]
\`\`\`

The skill's job became "grade this new job against these five anchors." That is a much more concrete task than "apply this rubric." Distribution stabilised:

\`\`\`
Round 3 distribution (same 200 jobs):

  SS  █░░░░░░░░░░░░░░░░░░░░░░░░░░  3   (1.5%)
  S   ██░░░░░░░░░░░░░░░░░░░░░░░░░  6   (3%)
  A   █████░░░░░░░░░░░░░░░░░░░░░░  13  (6.5%)
  B   ████████░░░░░░░░░░░░░░░░░░░  22  (11%)
  C   ███░░░░░░░░░░░░░░░░░░░░░░░░  11  (5.5%)
  F   ████████████████████████░░░ 145  (72.5%)
\`\`\`

Grades agreed with my own ~85 percent of the time on a sample.

### Round 4: failure modes as anchors

The remaining 15 percent disagreement clustered around specific failure modes:

| Failure mode                           | What was happening                                    |
|----------------------------------------|-------------------------------------------------------|
| Senior-title bias                      | Title cue dominated everything; "Senior" → A by default |
| Vague-description handling             | Could not tell what the actual work was; defaulted to B |
| Strong-preference companies            | Graded around the company instead of the job           |
| Grandfathered keywords                 | "Rust" implied great fit even when role was admin       |

I added anchors for each of these failure modes:

\`\`\`
Round 4 rubric structure:

   --- standard anchors ---
   SS anchor [...]
   S anchor [...]
   A anchor [...]
   B anchor [...]
   F anchor [...]

   --- failure-mode anchors ---
   senior-title bias anchor:
     "Senior Engineer" titles where actual work is
     not what the candidate wants → grade should reflect the work,
     not the title.

   vague-description anchor:
     Descriptions that say nothing concrete →
     grade B by default; do not over-extrapolate.

   strong-preference-company anchor:
     If the candidate has expressed preferences about a
     company, do not let that override the job's actual axes.

   grandfathered-keyword anchor:
     Keywords on the candidate profile (Rust, ML, etc.)
     are necessary but not sufficient; check what the job
     actually does with that keyword.

   --- now grade the new job ---
\`\`\`

The rubric now has nine anchors covering the canonical good cases and the recurring bad cases. Agreement with my own grades is ~90 percent across the sample.

### Round 4 distribution (1,184 jobs, full database)

\`\`\`
  SS  ▍                              13   (1.1%)
  S   ▊                              27   (2.3%)
  A   ██                             70   (5.9%)
  B   ████                           142  (12.0%)
  C   ▍                              20   (1.7%)
  F   █████░                         212  (17.9%)
  ░   ██████████░                    700  (59.1%)  ← pending grades
\`\`\`

The C tier is small because C is a narrow band; jobs are usually clearly above or below it. The F tier dominates because most jobs at most companies are not what I am looking for, and that is fine. The grader's job is to identify the 110 jobs in SS / S / A that are actually worth my time.

---

## Why this approach generalises

> [!important] **The general principle**
>
> When you want consistent judgement out of an LLM at scale, do not try to capture the judgement in language. Capture it in examples.
>
> The model is much better at "this new thing is similar to these anchors and dissimilar to these other anchors" than it is at "apply this rule." Examples ground the judgement; language describes it.

This does not just apply to job grading. The same pattern holds for any classification or grading task at scale.

| Use case                       | Anchor strategy                                |
|--------------------------------|------------------------------------------------|
| Code review                    | One PR per quality tier with annotated reasoning|
| Customer support triage        | One ticket per priority tier                    |
| Article fact-checking          | One claim per truth-value tier                  |
| Lead scoring                   | One profile per fit tier                        |
| Bug-report severity             | One bug per severity tier                       |

The Claude Code skill framework was built around this idea: skills have references (examples and reusable material), worked examples (the canonical demonstration of the skill in action), and obligations (things the skill must do regardless of the input). All three exist because pure prose prompts are not enough for consistent behaviour at volume.

---

## What it costs to build this

| Cost component                                | Estimate                          |
|-----------------------------------------------|-----------------------------------|
| Cernio Rust source                            | ~14,000 lines, 56 files            |
| Skill markdown (9 skills, refs, examples)     | ~5,000 lines total                 |
| Per-skill calibration time (typical)          | 4-12 hours                         |
| grade-job calibration (4 rounds)              | ~30 hours total                    |
| Runtime cost per grade (Claude Sonnet 4.6)    | < $0.001                           |
| Cost for full grading run (1,184 jobs)        | ~ $1                                |

This is real engineering effort. It is also engineering effort that compounds. Once a skill is calibrated, it works on every new job description without further attention. The grading distribution stays stable across runs. Adding new companies to the database does not require re-tuning anything; the skills handle them automatically.

> [!note] **The trade-offs explicit**
>
> | Approach              | Upfront cost | Per-call cost | Consistency at scale |
> |-----------------------|--------------|---------------|----------------------|
> | One big prompt        | low          | high          | poor                 |
> | Nine narrow skills    | high         | low           | excellent            |
>
> If the system has to grade 10 jobs, the difference does not matter. If it has to grade 1,184, it does.

---

## The lesson worth keeping

The Cernio skill architecture works because each skill has one job and the system makes that job small enough to do consistently. The nine skills together do the whole task of running a personal job search, and they do it with judgement that aggregates honestly across a thousand calls.

If I were starting a similar AI-augmented system today, the rule I would apply from the first day is:

> [!important] **Do not let any prompt do more than one thing.**
>
> Break tasks down until each piece is small enough that the model gets it right almost always. Then compose the pieces. The composition is your system.

The model is your component. The system is what you build around it. Same engineering discipline as any other production code.

---

## Reference list

If you want to read more about skill design and structured prompting:

- **Anthropic's prompt engineering guide** — covers chain-of-thought, few-shot, and structured output
- **OpenAI's structured outputs documentation** — for cases where you need machine-parseable output
- **Constitutional AI papers** — the underlying technique for tuning model behaviour through examples
- **The Claude Code skill spec** — \`~/.claude/skills/skill-creator/\` if you have it; otherwise the public docs

The Cernio skill files themselves are not public, but the patterns are: anchor your judgement with examples, narrow your prompts ruthlessly, calibrate against your own ground-truth grades, and let failure modes become new anchors. That is the whole methodology.
`,
};
