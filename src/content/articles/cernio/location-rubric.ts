import type { Article } from "@/types";

export const cernioLocationRubric: Article = {
  slug: "cernio-location-rubric",
  title: "A 22-factor location-evaluation rubric for engineering relocation",
  type: "White Paper",
  date: "2026-04-17",
  project: "Cernio",
  description:
    "Cernio's session 8 added a structured framework for evaluating cities and locations as relocation candidates for engineering work. Three tiers, 22 factors, a 10-agent synthesis pass, and a lifestyle modulator that adjusts scoring against personal weights. This is the methodology, the failure modes it was built to avoid, and the scoring math.",
  tags: ["methodology", "decision-frameworks", "relocation", "claude"],
  body: `# A 22-factor location-evaluation rubric for engineering relocation

Cernio's session 8 (2026-04-15) added a substantial new piece: a structured framework for evaluating cities and locations as relocation candidates. The work was prompted by the realisation that "Remote OK" filters in job listings hide an enormous amount of practical information. A "Remote (UK)" job in a company headquartered in Brighton is not the same as a "Remote (UK)" job in a company headquartered in Edinburgh, even though both are technically remote-friendly with UK eligibility.

The 22-factor rubric exists to make those differences explicit, to evaluate them consistently across cities, and to combine them into a single comparable score that the job-grading skill can use as input.

This document describes the methodology, the three-tier framework, the 22 factors, the 10-agent synthesis pass, and the lifestyle modulator that adjusts scoring against personal preferences.

---

## The problem this is solving

Relocation decisions are usually made on a small number of factors that are easy to reason about (cost of living, taxes, weather) plus a much larger set of factors that are intuitively important but hard to compare across cities (commute friction, social fit, healthcare access, recreational adjacency, civic stability).

The naive approach is to score cities on the easy factors and decide based on those. This produces obvious failure modes:

| Failure mode                          | Example                                              |
|---------------------------------------|------------------------------------------------------|
| Cost-of-living trap                   | "Lisbon is cheap" — until you need international healthcare |
| Tax-rate trap                         | "Estonia has low taxes" — until you discover what is taxable |
| Weather trap                          | "Barcelona has good weather" — until July             |
| English-speaking trap                 | "They all speak English" — until you need a tradesperson |
| Visa trap                             | "Easy work visa" — but no path to permanent residence |

The 22-factor rubric was built to avoid this class of trap by forcing every dimension of the decision to be scored explicitly, with reasoning, against city-by-city evidence.

---

## The three-tier framework

The 22 factors are organised into three tiers. Each tier represents a different time horizon and a different kind of reversibility.

\`\`\`
                   The three-tier framework

    ┌─────────────────────────────────────────────────────┐
    │ Tier 1: Hard floors (10 factors)                    │
    │   What must be true for this city to be possible?   │
    │   Time horizon: weeks                                │
    │   Reversibility: high (you find out fast)           │
    └─────────────────────────────────────────────────────┘
                              │
                              ▼ if all Tier 1 pass
    ┌─────────────────────────────────────────────────────┐
    │ Tier 2: Soft factors (8 factors)                    │
    │   What makes day-to-day life good or bad?           │
    │   Time horizon: months                               │
    │   Reversibility: medium                              │
    └─────────────────────────────────────────────────────┘
                              │
                              ▼ scored as multipliers
    ┌─────────────────────────────────────────────────────┐
    │ Tier 3: Lifestyle modulators (4 factors)            │
    │   What matters to YOU specifically?                 │
    │   Time horizon: years                                │
    │   Reversibility: low (changes outlook entirely)     │
    └─────────────────────────────────────────────────────┘
\`\`\`

> [!important] **The structural reason for tiers**
>
> Tier 1 is binary: pass or fail. A city that fails any Tier 1 factor is dropped from consideration regardless of how good the other tiers look.
>
> Tier 2 is graded: each factor scores 0-100, weighted, summed.
>
> Tier 3 is personal: the same city scores differently for different people, depending on lifestyle priorities.
>
> Mixing these together produces nonsense scores. Separating them makes the trade-offs explicit.

---

## Tier 1: hard floors (10 factors)

These are the dealbreakers. If any one of these fails, the city scores zero overall.

| # | Factor                          | What "pass" looks like                                |
|---|---------------------------------|-------------------------------------------------------|
| 1 | Visa pathway exists             | Either citizen, EU/UK rights, or feasible work visa    |
| 2 | English usable for daily life   | Not necessarily official, but functionally widespread  |
| 3 | Banking + financial infrastructure | Open accounts as a foreigner, modern banking app    |
| 4 | Healthcare accessible            | Public or affordable private; emergency response      |
| 5 | Internet reliable                | 100+ Mbps fibre available residentially                |
| 6 | Power grid stable                | < 5 outages per year for normal residential supply    |
| 7 | Personal safety baseline         | Walkable evenings, low violent crime, functional police |
| 8 | Legal system functional          | Property contracts enforceable, courts accessible      |
| 9 | Tax situation legible             | Clear residency rules, no surprise double-taxation   |
| 10 | International airport ≤ 2h     | Getting out is feasible without driving across country |

### Why these specifically

| Factor                      | Failure-mode example without it                                  |
|-----------------------------|-----------------------------------------------------------------|
| Visa pathway                | Tourist visa runs and you cannot get residency                   |
| English usable              | Three-day frustration over a plumbing repair                     |
| Banking infrastructure       | Cannot pay rent, cannot get paid, cannot transfer money          |
| Healthcare                  | Emergency care is months away from where you live               |
| Internet                    | Remote work becomes infeasible                                   |
| Power grid                  | Daily 4-hour outages destroy productivity and food storage       |
| Personal safety             | Constant background risk eats every other quality-of-life win    |
| Legal system                | Landlord disputes, contract disputes, asset protection all fail |
| Tax situation                | Year 2 of residency: a $40K tax bill nobody mentioned            |
| Airport access               | Family emergencies become 14-hour journeys                       |

These are not preferences. They are floor conditions for a sustainable engineering-and-life situation in a city. Failing any of them turns the city into a permanent low-grade stress generator.

---

## Tier 2: soft factors (8 factors)

These are the day-to-day quality-of-life factors. Each is scored 0-100 with a weight (default weights shown; lifestyle modulator can adjust).

| # | Factor                          | Default weight | What "100" looks like                       |
|---|---------------------------------|---------------:|---------------------------------------------|
| 11 | Cost of living vs salary        | 15             | Strong margin after rent, food, transport   |
| 12 | Public transit quality           | 12             | Frequent, clean, late-night, integrated     |
| 13 | Walkability of typical neighbourhoods | 10        | Daily errands without a car                 |
| 14 | Quality of indoor spaces (cafés, libraries, coworking) | 8 | Plentiful, affordable, well-equipped     |
| 15 | Recreational adjacency (mountains, sea, forests) | 8 | < 1 hour by transit                       |
| 16 | Cultural depth (museums, music, theatre) | 7      | World-class events without travelling       |
| 17 | Food culture (markets, restaurants, groceries) | 7 | Diverse, fresh, accessible                  |
| 18 | Bureaucratic friction (residency, taxes, paperwork) | 8 | Online, fast, English-supported           |
| **Total** | | **75** |                                                  |

### Default weight rationale

\`\`\`
                    Default weight breakdown

  Cost of living      ████████████████░ 15  (20% of soft total)
  Public transit      █████████████░░░░ 12  (16%)
  Walkability         ███████████░░░░░░ 10  (13%)
  Bureaucratic        ████████░░░░░░░░░  8  (11%)
  Indoor spaces       ████████░░░░░░░░░  8  (11%)
  Recreation          ████████░░░░░░░░░  8  (11%)
  Cultural            ███████░░░░░░░░░░  7  (9%)
  Food                ███████░░░░░░░░░░  7  (9%)

  Total weight: 75 (sum of all Tier 2 factor weights)
\`\`\`

The weights encode "what matters at the day-to-day frequency the factor is felt." Cost of living is felt every day; cultural depth is felt every weekend or so. The weights are not symmetric, and that is by design.

### Scoring example: London on Tier 2

| Factor                   | Weight | Score (0-100) | Weighted |
|--------------------------|-------:|--------------:|---------:|
| Cost of living vs salary | 15     | 35            | 5.25     |
| Public transit           | 12     | 92            | 11.04    |
| Walkability              | 10     | 75            | 7.50     |
| Indoor spaces            | 8      | 90            | 7.20     |
| Recreation               | 8      | 55            | 4.40     |
| Cultural                 | 7      | 95            | 6.65     |
| Food                     | 7      | 85            | 5.95     |
| Bureaucratic             | 8      | 70            | 5.60     |
| **Tier 2 total**         | **75** |               | **53.59** |

Out of a possible 75. London scores ~71% on Tier 2 (with cost of living dragging the score down sharply).

---

## Tier 3: lifestyle modulators (4 factors)

These are the personal-priority factors. They adjust the Tier 2 score upward or downward by up to 30 percent based on how well the city matches the candidate's stated lifestyle preferences.

| # | Factor                  | What it asks                                              |
|---|-------------------------|-----------------------------------------------------------|
| 19 | Activity profile        | Outdoor recreation? Gym/fitness? Indoor only?              |
| 20 | Social density           | High-energy nightlife? Quiet community? Mix?              |
| 21 | Housing form preference  | Apartment? House? Garden? Sea view?                       |
| 22 | Climate tolerance        | Heat? Cold? Humidity? Dry?                                |

### Lifestyle modulator math

\`\`\`
                Lifestyle modulator calculation

  for each Tier 3 factor:
      city_score   = how well the city matches the factor (0-100)
      personal_weight = how much you care about the factor (0-1)
      contribution = (city_score - 50) × personal_weight × 0.0075
      // 0.0075 is the per-factor cap of ±3.75%
      // four factors → ±15% total

  total_modifier = sum of contributions
                 = bounded to [-30%, +30%]

  final_score = tier_2_score × (1 + total_modifier)
\`\`\`

> [!note] **Why ±30% and not ±100%?**
>
> The lifestyle modulator is designed to express preference, not to override fundamentals. A city that fails on Tier 1 is gone regardless. A city that scores low on Tier 2 stays low even if it lines up with personal preferences.
>
> ±30% is enough to flip the order of two cities that are close on Tier 2. It is not enough to promote a poor city above a strong one.

### Lifestyle modulator example (mine)

\`\`\`
                  Caner's lifestyle weights

  Activity profile:    high outdoor + gym = 0.9
  Social density:      moderate nightlife = 0.5
  Housing preference:  apartment ok      = 0.3
  Climate tolerance:   prefer cold/dry   = 0.7

  Applied to London:
    Activity: London outdoor = 60 → (60-50) × 0.9 × 0.0075 = +0.0675
    Social:   London social  = 80 → (80-50) × 0.5 × 0.0075 = +0.1125
    Housing:  London housing = 65 → (65-50) × 0.3 × 0.0075 = +0.0338
    Climate:  London climate = 55 → (55-50) × 0.7 × 0.0075 = +0.0263

    Total modifier: +0.2400 (+24%)

  Final London score = 53.59 × 1.24 = 66.45 / 75 = ~89%
\`\`\`

The lifestyle modulator pushed London from a ~71% raw Tier 2 score to a ~89% lifestyle-adjusted score. The factors that helped: London matches my social and outdoor preferences well. The factors that hurt: cost of living is rough and the climate is mild rather than the cold/dry I prefer.

---

## The 10-agent synthesis pass

Scoring a city across 22 factors is not a one-pass operation. The actual workflow uses a 10-agent synthesis pass to gather and cross-check information before producing the final score.

### Why 10 agents

\`\`\`
                       Agent specialisation

  agent 1: visa-and-residency      ─▶ Tier 1 #1, #9
  agent 2: language-and-daily       ─▶ Tier 1 #2, partial #5
  agent 3: financial-infrastructure ─▶ Tier 1 #3, #11
  agent 4: healthcare-access        ─▶ Tier 1 #4
  agent 5: civic-stability          ─▶ Tier 1 #6, #7, #8
  agent 6: connectivity              ─▶ Tier 1 #5, #10, partial #18
  agent 7: transit-and-walkability   ─▶ Tier 2 #12, #13
  agent 8: cultural-and-food         ─▶ Tier 2 #14, #16, #17
  agent 9: recreation-and-climate    ─▶ Tier 2 #15, Tier 3 #22
  agent 10: bureaucracy-and-paper    ─▶ Tier 1 #9, Tier 2 #18

  → each agent runs independently, produces structured output
  → synthesis step combines outputs, resolves conflicts, produces final scores
\`\`\`

Each agent's job is narrow and specific. Each produces a structured output (score per factor, with reasoning, with sources). The synthesis step then combines them, resolves disagreements, and produces the final 22-factor scoresheet.

### Why parallel agents work better than one big pass

| Property                  | One big pass             | 10 parallel agents          |
|---------------------------|--------------------------|------------------------------|
| Information per topic     | Shallow (token budget)    | Deep (each gets full budget) |
| Cross-pollination of bias | High                      | Isolated per topic           |
| Speed                     | Slow (sequential)         | Fast (parallel API calls)    |
| Structured output         | Hard to enforce           | Easy (each has narrow scope) |
| Disagreement detection    | Invisible                 | Surfaces in synthesis        |

The agents do not see each other's output during their initial runs. They each ground their assessment in their own research. The synthesis step then looks for disagreements and either reconciles them or flags them as uncertain.

### Sample synthesis output (Lisbon)

\`\`\`
City: Lisbon, Portugal

Tier 1: Hard floors
  ✓ visa-and-residency       — D7 visa pathway exists, NHR confirmed (agent 1)
  ✓ language-and-daily        — English widespread in Lisbon proper (agent 2)
  ✓ financial-infrastructure  — Modern banking, EUR, online (agent 3)
  ✓ healthcare-access         — Both public + private accessible (agent 4)
  ✓ civic-stability           — Stable, low crime by EU standards (agent 5)
  ✓ connectivity              — 1Gbps fibre common, airport 25 min (agent 6)
  ✓ tax-situation             — Clear, NHR programme + complications (agent 1+10)
  → All Tier 1 factors pass

Tier 2: Soft factors
  Cost of living vs salary    : 65 (vs London 35) ────────────── higher
  Public transit              : 55 ─────────────────────────────  lower
  Walkability                 : 75 ──────────────────────────── similar
  Indoor spaces               : 60 ─────────────────────────────  lower
  Recreation                  : 80 (sea immediately, sintra 40min)─ higher
  Cultural                    : 65 ─────────────────────────────  lower
  Food                        : 80 ────────────────────────────── higher
  Bureaucratic                : 50 ─────────────────────────────  lower

  Tier 2 raw score: 49.6 / 75 = 66.1%

Tier 3: Lifestyle (using my weights)
  Activity                    : 75 → +0.169
  Social density              : 60 → +0.038
  Housing                     : 80 → +0.068
  Climate                     : 65 → +0.079
  Total modifier              : +0.354 → bounded to +0.30 (cap)

Final lifestyle-adjusted score: 49.6 × 1.30 = 64.5 / 75 = 86.0%
\`\`\`

Lisbon scores comparably to London for me, but for different reasons. The synthesis report makes those reasons inspectable.

---

## How it integrates with the job grader

The location score does not replace the job-grading skill. It feeds into it as one of several inputs.

\`\`\`
              Job grading inputs (post-session-8):

   ┌────────────────────────────────────┐
   │ Job description                      │
   └──────────────┬───────────────────────┘
                  ▼
   ┌────────────────────────────────────┐
   │ Candidate profile                   │
   └──────────────┬───────────────────────┘
                  ▼
   ┌────────────────────────────────────┐    ← NEW in session 8
   │ Location rubric: city evaluation    │
   │ - Tier 1 pass/fail                   │
   │ - Tier 2 weighted score              │
   │ - Tier 3 lifestyle-adjusted          │
   └──────────────┬───────────────────────┘
                  ▼
              grade-job skill
                  │
                  ▼
              SS / S / A / B / C / F + reasoning
\`\`\`

The grading skill now considers the location score when grading a remote-with-eligibility-restriction job. A "Remote (UK)" job at a company in a city with a Tier 1 fail is graded down. A "Remote (Worldwide)" job from a company in a high-Tier-2 city near my preferences gets a small upward adjustment.

The location rubric is also independently useful. The "where could I move" question is now answerable by running the synthesis pass on candidate cities and comparing their final scores side by side.

---

## What the rubric does NOT capture

> [!warning] **Limitations explicit**
>
> | What the rubric misses                                | Why                                                    |
> |-------------------------------------------------------|--------------------------------------------------------|
> | Personal relationships in specific cities              | Ground-truth specific to your social graph              |
> | Job market depth in specific cities                    | Captured separately by Cernio's company database       |
> | Exchange rate trajectory                                | Predictive, not measurable                              |
> | Climate change projections                              | Inherently uncertain                                    |
> | "Vibes" or "feel" of the city                          | Requires actually visiting                              |
> | Religious / cultural specifics                          | Requires personal context                               |

The rubric is a structured first-pass filter, not a final answer. It eliminates obviously poor candidates (failed Tier 1), it ranks the remaining set on observable factors, and it adjusts for stated preferences. The final decision still includes information the rubric cannot capture.

---

## What the methodology was designed to avoid

The rubric was built specifically to avoid four failure modes that location-comparison threads online tend to produce:

| Failure mode                          | How the rubric guards against it                          |
|---------------------------------------|-----------------------------------------------------------|
| Anchor bias                           | All factors scored independently; cumulative cross-check  |
| Recency bias                          | Reasoning grounded in concrete sources, not memory        |
| Personal-anecdote dominance           | Lifestyle modulator separated from city-objective scoring |
| "Cost of living trap"                 | 22 factors, not one; CoL weighted at 20% of Tier 2 max    |

> [!note] **The honest scope**
>
> This rubric is calibrated for engineering work specifically. The Tier 2 weights would be different for a parent of school-age children (school quality is not a Tier 2 factor here), for an elderly retiree (healthcare access is Tier 1, not Tier 2 graded), or for a remote-only freelancer (visa pathway differs entirely).
>
> The framework is portable. The weights are mine.

---

## What landed in session 8

| Component                              | Output                                                  |
|----------------------------------------|---------------------------------------------------------|
| 22-factor schema in code                | \`location_evaluation\` table in SQLite                  |
| 10-agent synthesis pass                 | Local skill: \`scout-location\`                          |
| Lifestyle modulator implementation      | \`profile_lifestyle.toml\`                               |
| Location-aware grading integration       | grade-job reads location score for remote-eligible roles |
| First evaluations (5 cities)             | London, Lisbon, Berlin, Edinburgh, Cluj-Napoca           |

The first five cities scored were the ones I was actually considering. Each took about 30 minutes of agent time plus 15 minutes of synthesis review.

\`\`\`
                  My current shortlist (sorted by lifestyle-adjusted)

  1. London          ████████████████████░░░░ 89%   [home]
  2. Lisbon          █████████████████░░░░░░░ 86%   [tourist]
  3. Cluj-Napoca     ███████████████░░░░░░░░░ 78%   [unfamiliar]
  4. Edinburgh       ██████████████░░░░░░░░░░ 73%   [visited]
  5. Berlin          █████████████░░░░░░░░░░░ 70%   [visited]
\`\`\`

Cluj-Napoca is the surprise on the list. It scored higher than expected because it cleared every Tier 1 floor (visa, English, banking, internet, power, safety, legal, tax, airport access) and produced unexpectedly strong Tier 2 numbers on cost-of-living and walkability.

---

## What this generalises to

The 22-factor approach is overkill for "what should I have for lunch" but underkill for "should I move my entire life to a different country."

The methodology is portable to any decision with these properties:

| Property of the decision                          | Why this approach helps                          |
|---------------------------------------------------|--------------------------------------------------|
| High reversibility cost                            | Tier 1 hard floors avoid catastrophic failures   |
| Many dimensions, not all comparable                | Factor weighting makes trade-offs explicit       |
| Personal preference plays a real role              | Lifestyle modulator separates objective from personal |
| Information has to be gathered, not just recalled | Multi-agent synthesis grounds claims in research |
| Decisions get made under uncertainty               | Confidence intervals per factor honest about uncertainty |

For decisions with these properties, the cost of building a structured rubric is repaid in better decisions and in being able to communicate the reasoning to others.

---

## Closing

The rubric is now part of Cernio. Every remote-eligible job gets graded with the location score in context. New cities get added to the database when I am considering them, scored once, and re-scored periodically.

The framework itself is the deliverable. The 22 factors are mine, the weights are mine, the lifestyle modulator is mine. The structure (Tier 1 / Tier 2 / Tier 3 / multi-agent synthesis / explicit weights) is portable.

If you are facing a high-stakes location decision and want a starting framework, the 22 factors above are a solid first draft. If you are facing a different class of decision (which job offer to take, which house to buy, which medical specialty to enter), the same three-tier structure will translate with different factors and different weights.

The structure is not a guarantee of a good decision. It is a guarantee that the decision is made deliberately, against explicit criteria, with the trade-offs visible. That is the floor for any decision that you cannot easily reverse.
`,
};
