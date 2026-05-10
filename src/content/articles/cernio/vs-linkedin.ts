import type { Article } from "@/types";

export const cernioVsLinkedin: Article = {
  slug: "cernio-vs-linkedin",
  title: "Why Cernio finds better jobs than LinkedIn, Welcome to the Jungle, and the rest",
  type: "Dev Log",
  date: "2026-02-05",
  project: "Cernio",
  description:
    "After two months of using Cernio for my own job search, I have a pretty clear picture of why a local-first system with 9 specialised AI skills out-performs the major job boards for personalised opportunity discovery. The short version: scripts handle volume, AI handles judgement, and neither company nor algorithm gets in the way of either job.",
  tags: ["job-search", "ai-tools", "rust", "tui"],
  body: `# Why Cernio finds better jobs than LinkedIn, Welcome to the Jungle, and the rest

Cernio is a job-discovery system I built for myself. It is a Rust application with a SQLite database, a terminal-based user interface, and a layer of AI skills that read job descriptions and grade them against a candidate profile.

## State of the database (session 9, 2026-04-21)

| Metric                         | Value                                          |
|--------------------------------|-----------------------------------------------:|
| Companies                      | 456 (408 + 48 from a triaged "dad-list" batch) |
| Jobs                           | 1,184 graded                                   |
| ATS provider integrations      | 6 in code + Eightfold bespoke                  |
| Pipeline scripts               | 6 mainline + 3 utility                          |
| AI skills                      | 9 — all skill-creator-audited                  |
| Rust source                    | ~14,000 lines, 56 files, 494 KB                |
| Test count                     | 325 passing                                    |
| TUI views                      | 5                                               |

I built Cernio because the major job boards were terrible at the actual problem. After two months of using it side-by-side with LinkedIn, Welcome to the Jungle, Indeed, and Otta (now Welcome to the Jungle), I have a clear picture of what is broken about the major boards and why a local system can do better.

This article is honest about both. Cernio is not magic. It does some things well and some things poorly. The point is to be specific about what those things are.

---

## What the major boards do badly, and why

### LinkedIn

\`\`\`
                       LinkedIn discovery loop

   you ─▶ search ─▶ algorithm picks results ─▶ feed of jobs
                       ▲                            │
                       │                            ▼
                paid placement                 you click some
                engagement signals             algorithm learns
\`\`\`

LinkedIn shows you jobs based on a recommendation algorithm. The recommendation algorithm is optimised for two things, and neither of them is "the right job for you":

| Optimisation target           | Problem                                              |
|-------------------------------|------------------------------------------------------|
| Engagement (clicks, applies)  | Punchy titles attract clicks; relevance does not      |
| Paid promotion                | Companies that pay LinkedIn rank higher              |

The first problem with this is that engagement is a poor proxy for fit; a job description with a punchy title and a remote-friendly tag will get clicks even if the actual role is wrong for you. The second problem is that the ranking is opaque. You cannot inspect why a job appeared in your feed, you cannot tune the ranking, and you cannot turn the algorithm off.

### Welcome to the Jungle

Nicer company pages, more curated postings. The discovery problem is similar though:

- The platform decides which jobs you see
- The platform's filters are limited (job category, location, contract type, remote-or-not)
- The platform makes its money from companies paying for visibility

The candidate is not the user. The candidate is the funnel.

### Indeed

Volume but no curation. The signal-to-noise ratio is bad:

- Hundreds of results for any reasonable role term
- Many duplicates posted by recruiting agencies
- A meaningful fraction of outright scams

### Otta (RIP)

Otta was the closest to what Cernio does. A curated feed of mostly-startup jobs with structured filters and decent tagging. Got bought by Welcome to the Jungle. Curation quality dropped after acquisition.

### The pattern across all four

| Platform               | Algorithm-driven | Paid placement | Open to all companies | Inspectable ranking |
|------------------------|:----------------:|:--------------:|:---------------------:|:-------------------:|
| LinkedIn               | yes              | yes            | yes                   | no                  |
| Welcome to the Jungle  | yes              | yes            | curated               | no                  |
| Indeed                 | yes              | yes            | yes                   | no                  |
| Otta (pre-acquisition) | curated          | minimal         | curated              | partial             |
| **Cernio**             | **no**           | **never**      | **all you add**       | **fully**           |

The discovery system is a service the platform owns, optimised for the platform's economics, and the candidate has to take what the algorithm gives them.

Cernio is built on the opposite assumption. The candidate is the user. The candidate's profile is the ranking criterion. The platform does not exist; there are just companies and their public ATS endpoints.

---

## How Cernio actually works

The architecture is "scripts for volume, AI for judgement." That phrase shows up in the project notes a lot because it is the actual operating principle.

\`\`\`
                          Cernio pipeline

  ┌──────────────────────────────────────────────────────────────┐
  │                    SCRIPTS (deterministic Rust)              │
  │                                                              │
  │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐   │
  │  │ resolve │ ─▶ │ search  │ ─▶ │  clean  │ ─▶ │  check  │   │
  │  └─────────┘    └─────────┘    └─────────┘    └─────────┘   │
  │     ATS API     pull jobs       strip HTML     dedupe       │
  │     check       per company     normalise      filter       │
  └──────────────────────────────┬───────────────────────────────┘
                                 │ filtered candidate jobs
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                AI LAYER (9 specialised skills)               │
  │                                                              │
  │   grade-job  ─▶  reads description, applies rubric,          │
  │                  assigns SS / S / A / B / C / F + reasoning   │
  └──────────────────────────────┬───────────────────────────────┘
                                 │ graded jobs
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                       SQLite database                        │
  │                                                              │
  │  companies  jobs  grades  history  pipeline_state           │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
                          Ratatui TUI (5 views)
\`\`\`

### Scripts handle volume

Cernio knows about 456 companies, and each of those companies has at least one ATS (Applicant Tracking System) that exposes job listings via a public API:

| ATS provider     | Status      | Coverage                            |
|------------------|-------------|-------------------------------------|
| Greenhouse       | full        | most YC + tech startups              |
| Lever            | full        | mid-stage tech                       |
| Ashby            | full        | newer YC + recent founders           |
| Workable         | full        | Europe-heavy SMBs                    |
| SmartRecruiters  | full        | enterprise + retail                  |
| Workday          | full        | F500 + universities                  |
| Eightfold        | bespoke     | custom integration per company       |

A single command (\`cernio search\`) walks every enabled company, hits its ATS endpoint, and pulls every active job. This takes seconds for hundreds of companies. No human is in the loop yet.

### Then the scripts filter

\`\`\`bash
cernio search          # pull from all ATSes
  → cernio clean       # strip HTML, normalise whitespace, dedupe
    → cernio check     # filter against candidate preferences
      → cernio import  # write to database, mark for grading
\`\`\`

What is left after \`check\` is a much smaller set of jobs that are in scope.

### AI handles judgement

Now the AI takes over. The AI layer is nine specialised Claude Code skills, each with a narrow job. The most important is the grading skill. It reads each job description in full, with the candidate's profile loaded as context, and assigns a grade.

The grading rubric was tuned across four major iterations based on production failures (early versions were too lenient, later versions too strict, the calibrated version uses anchored examples to keep judgement consistent).

### The grade scale

| Grade | Meaning                                | Action                |
|-------|----------------------------------------|-----------------------|
| **SS** | Perfect match — rare, every box ticked | Apply, follow up       |
| **S**  | Excellent match                        | Apply, prepare well    |
| **A**  | Strong match                           | Apply if bandwidth     |
| **B**  | Okay match                             | Read; consider         |
| **C**  | Weak match                             | Skip unless bored      |
| **F**  | Don't waste anyone's time              | Skip                   |

After the grading run, I look at the SS, S, and A grades. That is roughly 110 jobs out of 1,184. I read those. I apply to the ones I want.

---

## What this changes about the actual experience

### Signal-to-noise

| Source                  | Approximate signal-to-noise ratio for me      |
|-------------------------|-----------------------------------------------|
| LinkedIn feed           | ~1 in 20 genuinely relevant                    |
| Welcome to the Jungle   | ~1 in 10                                       |
| Indeed                  | < 1 in 50                                      |
| **Cernio (SS/S grades)**| **~9 in 10** (the rare misses are calibration drift) |

The ratio is dramatically different. Cernio's SS-and-S grades are roughly 40 jobs out of 1,184, and almost all of them are real. The "almost" is important; the grading skill is not infallible. But the signal-to-noise is in a different league.

### Depth

\`\`\`
LinkedIn job card:
   ┌──────────────────────────────────────┐
   │ Senior Software Engineer              │
   │ SomeCompany · London · 2 days ago    │
   │ "Full-stack engineer to join our..."  │
   │ [Easy Apply]                          │
   └──────────────────────────────────────┘
   ↓ click through to read full description ↓


Cernio job entry:
   ┌──────────────────────────────────────────────────────────────────┐
   │ Senior Systems Engineer @ AnthropicLabs               GRADE: S   │
   │ Remote (UK) · posted 2026-05-08 · Greenhouse                     │
   │                                                                  │
   │ Why S: Rust + distributed systems + research-grade work          │
   │ matches the candidate profile's "low-level systems" axis;        │
   │ remote OK; mid-senior level matches; minor concern around        │
   │ on-call rotation requirement.                                     │
   │                                                                  │
   │ [press Enter for full description, t to tag, a to mark applied]  │
   └──────────────────────────────────────────────────────────────────┘
\`\`\`

Cernio reads the full description (the same one you would click through to), pulls out specific things you said you cared about (specific languages, specific kinds of work, specific scale), and tells you why the grade is what it is. Inspecting an individual grading is a one-keystroke action in the TUI.

### No algorithm in the way

| Property of LinkedIn       | Cernio equivalent                          |
|----------------------------|---------------------------------------------|
| Recommendation algorithm   | Your candidate profile (you wrote it)       |
| Engagement metrics tracked | None                                        |
| Paid placement             | Not a concept                               |
| Shadow-banned companies    | Not a concept                               |
| Why job X appeared         | Read the grader's reasoning                 |

Every job that hits the ATS endpoint gets evaluated. No platform layer between you and the data.

### Access

Major job boards rely on companies posting their jobs to the board. Companies vary wildly in how comprehensively they do this:

- Some serious tech companies post all roles to LinkedIn
- Some post only the high-volume ones
- Some rely on their own careers page

Cernio talks to the careers page directly via the ATS API. If a job is on the company's careers page, Cernio sees it.

---

## Where the major boards still win

There are real things the major boards do that Cernio cannot.

> [!note] **The honest list of what Cernio does not do**
>
> | Capability                | LinkedIn | Cernio | Notes                                       |
> |---------------------------|:--------:|:------:|---------------------------------------------|
> | Find jobs at known companies| ✓ | ✓✓ | Cernio wins by quality                  |
> | Discover unknown companies | ✓ | partial | Cernio limited by curated company list   |
> | Inbound recruiter messages | ✓✓ | ✗ | Major asymmetry                          |
> | Social-graph job tips      | ✓✓ | ✗ | "X joined Y" surfaced automatically      |
> | Company culture content    | ✓ | ✗ | WTTJ has profiles, interviews            |
> | Long-tail geographies      | ✓ | partial | Indeed has wider raw coverage           |
> | Cost                       | free | sweat | Cernio takes engineering effort          |

LinkedIn has the social graph. If a recruiter at a company you are interested in messages you, that is useful, and Cernio cannot replicate it. LinkedIn is also where the "people you know" overlap shows up; if a former colleague joined a company you are now interested in, LinkedIn will tell you. Cernio will not.

Welcome to the Jungle has actual editorial content. They write profiles of companies, do interviews with founders, and produce a quality of "what is this company like to work at" content that Cernio's grading does not approach. If you care about culture beyond what a job description says, that material is useful.

Indeed has the long tail. If you are looking for jobs in a specific city outside the major tech hubs, Indeed often has listings the boutique boards do not. Cernio's coverage is bound by the 456 companies in its database; jobs at companies outside that set do not exist as far as Cernio is concerned.

Recruiter outreach is where the major boards genuinely beat any local system. Cernio is a discovery tool for me-finding-jobs; it is not a discovery tool for jobs-finding-me. That second axis is where LinkedIn's reach matters.

---

## What the database looks like in practice

The current state of session 9 (April 21, 2026):

\`\`\`
Distribution snapshot — 1,184 jobs graded:

  SS  ▍                              13   (1.1%)   ← apply, prepare
  S   ▊                              27   (2.3%)   ← apply
  A   ██                             70   (5.9%)   ← apply if bandwidth
  B   ████                           142  (12.0%)  ← maybe
  C   ▍                              20   (1.7%)   ← skip
  F   █████░                         212  (17.9%)  ← skip
  ░   ██████████░                    700  (59.1%)  ← not yet graded

Distribution snapshot — 456 companies, company-level grades:

  S   ▎                              26   (5.7%)
  A   ████                           124  (27.2%)
  B   ██████                         182  (39.9%)
  C   ███                            99   (21.7%)
  ?   █                              25   (5.5%)   ← pending
\`\`\`

The grade distribution is the interesting bit. The SS / S / A tier is 110 jobs combined, which is roughly 9 percent of the total. That is the high-signal set I would actually consider applying to.

> [!important] **The headline number**
>
> Out of every hundred jobs the platform-level boards would have shown me, roughly nine of them would have been worth a closer look. Cernio identifies those nine without me reading the other ninety-one.

---

## What this article is and is not

This is **not** a pitch to convince you to use Cernio for your own job search. The system is built for me, calibrated to my profile, and tuned to my preferences. The grading rubric encodes what I care about (specific kinds of systems work, specific languages, specific employer characteristics). It is not a generic tool.

This **is** a description of why a focused, local, AI-augmented system can outperform platform-mediated job discovery for the specific problem of "find me roles that match my actual profile." The major boards have a structural reason to do this badly: they are advertising platforms, and the candidate is not the customer. A local system has a structural reason to do it well: the candidate is the only user.

If you are considering building something similar for yourself, the costs are non-trivial:

| Cost component                | Estimate                                |
|-------------------------------|-----------------------------------------|
| Initial build                 | ~3 weeks of focused work                 |
| Skill calibration (grading)    | 4 major rounds, ~20 hours total          |
| Per-week maintenance          | 1-2 hours (new companies, profile drift) |
| Hosting / inference           | $0 (local-first) or Claude API tokens    |
| Lines of code (Rust)          | ~14,000                                  |
| Skill markdown documentation  | ~5,000 lines across 9 skills              |

This is real engineering effort. It is also engineering effort that compounds. Once a skill is calibrated, it works on every new job description without further attention. The grading distribution stays stable across runs. Adding new companies to the database does not require re-tuning anything; the skills handle them automatically.

---

## The lesson worth keeping

The general lesson is the one in the project's tagline:

> [!important] **Scripts for volume, AI for judgement.**
>
> A Rust script can check 5,000 ATS endpoints in seconds. Claude can read 50 job descriptions in detail and assess them against a profile that captures what matters to you.
>
> Neither tool can do the other tool's job economically. Together, they replace the major job boards for one specific use case, and they do it better, and the candidate stays in the loop the whole time.

That pattern generalises beyond job search. Any time you have a discovery problem where the data is plentiful but the judgement is bespoke, the same architecture works:

- **Volume layer**: deterministic script scrapes / queries / ingests at scale
- **Filter layer**: deterministic rules eliminate the obvious noise
- **Judgement layer**: AI applies a calibrated rubric to the survivors
- **Human layer**: human reviews the high-signal set and decides

The trade-off, compared to "use a hosted platform," is that the platform works for everyone (badly) and your local system works for one person (well). For my use case, that is the right trade. For other use cases, it might not be.

Cernio is the working version of this architecture for personal job search. It runs in my terminal. It costs nothing per query. It tells me, every morning, the new SS and S grades from overnight. I have applied to better jobs because of it.

The major boards still exist. They will continue to exist. They will continue to be terrible at the actual problem. That is the structural fact, and it is why the local-first version wins for the specific use case it is built for.
`,
};
