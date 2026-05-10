import type { Article } from "@/types";

export const aurixVolRegimeClassifier: Article = {
  slug: "aurix-vol-regime-classifier",
  title: "Adaptive-tercile vol regime classifier for LP capital allocation",
  type: "White Paper",
  date: "2026-05-07",
  project: "Aurix",
  description:
    "Aurix M2.8 ships a vol-regime classifier that reads historical realised volatility, divides it into adaptive terciles, and emits a verdict on whether a Uniswap V3 LP strategy is worth deploying capital to. The method, the math, and why this works better than fixed-threshold classification for a metric that has no stable mean.",
  tags: ["defi", "quantitative", "uniswap", "volatility", "rust"],
  body: `# Adaptive-tercile vol regime classifier for LP capital allocation

Aurix Tab 2 is a Uniswap V3 LP backtester. It produces an equity curve for any LP strategy on any historical window. The equity curve is useful but not actionable on its own; an LP needs a verdict, not a chart.

The verdict layer is M2.8: an adaptive-tercile vol regime classifier that reads the historical realised volatility over the backtest window, classifies the regime as low / medium / high, and emits a verdict prose synthesis appropriate to the regime.

This article is about why "vol regime" is the right grouping, why "adaptive tercile" is the right partition, and what the verdict looks like end-to-end.

---

## TL;DR

| Component                       | What it does                                        |
|---------------------------------|-----------------------------------------------------|
| Realised vol calculation         | Computes σ_t for each window of the backtest        |
| Adaptive tercile partition       | Splits the σ distribution into low/med/high bands   |
| Per-regime backtest analysis     | Computes LP P/L vs benchmarks within each regime    |
| Verdict synthesis                | Generates a regime-aware capital-allocation verdict |

The output:

\`\`\`
Vector A verdict — USDC/ETH 0.05% pool, 90-day window:

  Vol regime distribution: 31% low / 42% medium / 27% high

  In LOW vol: V3 LP outperforms HODL by 2.1% (annualised), positive alpha
  In MED vol: V3 LP outperforms HODL by 0.4% (annualised), borderline
  In HIGH vol: V3 LP underperforms HODL by 5.7% (annualised), LVR dominates

  Capital allocation verdict:
    "Tight-band V3 LP strategy is profitable in the lower 73% of vol
     conditions. Above the 73rd percentile of historical vol, capital
     should be in HODL or a less-active strategy."
\`\`\`

---

## Why "vol regime" and not something else

LP performance on Uniswap V3 is not stationary. The same strategy that produces +5% over a quiet month produces -8% over a volatile month. Aggregating across the whole window hides that signal.

\`\`\`
                  LP performance vs market vol (illustrative)

   LP P/L (%)
        │
       +5│       ╲                          ╱
        │     ╲       ╲                  ╱
        │   ╲              ╲          ╱
       0 ────────────────────╲    ╱──────────────── HODL line
        │                       ╲╱
       -5│                  high vol = LP loses to HODL via LVR
        │
        └──────────────────────────────────────────────▶
              low vol             high vol
\`\`\`

The relationship is not subtle. V3 LPs are structurally short volatility:

- Low vol → low LVR → fee income wins → LP outperforms HODL
- High vol → high LVR → arbitrageurs extract value → LP underperforms HODL

> [!important] **The implication for capital allocation**
>
> A strategy that "wins on average" can lose money if the average masks two regimes where one of them is catastrophic. The right question is not "did this strategy beat the benchmark?" but "in which regimes did it beat the benchmark, and what fraction of the time were we in those regimes?"
>
> Vol regime classification is the partition that turns this question into something quantitative.

---

## Why adaptive tercile

There are several ways to partition vol into regimes. The choice matters more than it sounds.

### Option 1: fixed thresholds

\`\`\`
   low vol:    σ < 0.50
   medium vol: 0.50 ≤ σ < 1.00
   high vol:   σ ≥ 1.00
\`\`\`

The problem: ETH realised vol drifts over multi-year windows. Thresholds tuned in 2021 are wrong in 2024 (when vol dropped) and wrong again in 2025 (when it climbed back). A strategy might appear to "always" be in medium vol simply because the thresholds are stale.

### Option 2: rolling z-score

\`\`\`
   z = (σ_t - rolling_mean) / rolling_std
   low:    z < -0.5
   medium: -0.5 ≤ z ≤ 0.5
   high:   z > 0.5
\`\`\`

Adaptive, but assumes vol is approximately normal. Realised vol is not. The right tail is long; using z-score thresholds means "high vol" captures different fractions of the data depending on the rolling window's outlier behaviour.

### Option 3: adaptive tercile (the choice)

\`\`\`
   take the σ_t values from the backtest window
   sort
   split into thirds at the 33rd and 67th percentiles

   low:    σ_t in lower tercile
   medium: σ_t in middle tercile
   high:   σ_t in upper tercile
\`\`\`

Properties:

| Property                                          | Adaptive tercile             |
|---------------------------------------------------|------------------------------|
| Adapts to the window's vol distribution            | ✓ (by construction)          |
| Robust to long tails                                | ✓ (uses rank, not magnitude) |
| Equal mass per regime                                | ✓ (33% each by construction) |
| Comparable across pools / windows                   | ✓ (regimes are relative)     |
| Performs honestly on quiet windows vs volatile ones  | ✓                            |

> [!note] **The trade-off**
>
> Adaptive tercile means "high vol in this window" might be different absolute vol than "high vol in another window." The classifier output is regime-relative, not absolute.
>
> This is the right choice for capital allocation decisions on a specific window. If you want to compare absolute vol levels across windows, use the σ values directly.

---

## The math, walked through

### Step 1: realised volatility per window

For each pool snapshot at time t, the price is \`p_t = (sqrt_p_x96 / 2^96)^2\`. The log return over a window [t, t+1] is:

\`\`\`
   r_{t,t+1} = log(p_{t+1}) - log(p_t)
\`\`\`

Realised volatility over a window of length N is:

\`\`\`
   σ_window = sqrt(N × variance(r_t over the window))
\`\`\`

The annualisation factor depends on the window cadence. For 1-hour windows over a 90-day backtest:

\`\`\`
   N = 8760 / window_hours
   σ_annualised = σ_window × sqrt(N)
\`\`\`

### Step 2: adaptive tercile bounds

For the full backtest window, collect every σ_window value into a vector. Sort. Find the 33rd and 67th percentiles. Those are the low/medium and medium/high cutpoints.

\`\`\`rust
pub fn adaptive_tercile_bounds(volatilities: &[f64]) -> (f64, f64) {
    let mut sorted = volatilities.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());

    let n = sorted.len();
    let lo_idx = (n as f64 * 0.33).floor() as usize;
    let hi_idx = (n as f64 * 0.67).floor() as usize;

    (sorted[lo_idx], sorted[hi_idx])
}
\`\`\`

### Step 3: classify each window

For each window, compute σ_window, then check which tercile it lands in:

\`\`\`rust
pub enum VolRegime { Low, Medium, High }

pub fn classify(sigma: f64, lo_bound: f64, hi_bound: f64) -> VolRegime {
    if sigma < lo_bound { VolRegime::Low }
    else if sigma < hi_bound { VolRegime::Medium }
    else { VolRegime::High }
}
\`\`\`

### Step 4: per-regime LP P/L attribution

Walk the equity curve, attribute each window's P/L to the regime active during that window:

\`\`\`rust
pub struct RegimePnL {
    low: f64,
    medium: f64,
    high: f64,
    low_minutes: u64,
    medium_minutes: u64,
    high_minutes: u64,
}

pub fn attribute_pnl(curve: &EquityCurve, regimes: &[VolRegime]) -> RegimePnL {
    let mut result = RegimePnL::default();
    for (i, point) in curve.windows(2).enumerate() {
        let pnl = point[1].value - point[0].value;
        let dur = point[1].timestamp - point[0].timestamp;
        match regimes[i] {
            VolRegime::Low =>    { result.low += pnl;    result.low_minutes += dur.num_minutes() as u64;    }
            VolRegime::Medium => { result.medium += pnl; result.medium_minutes += dur.num_minutes() as u64; }
            VolRegime::High =>   { result.high += pnl;   result.high_minutes += dur.num_minutes() as u64;   }
        }
    }
    result
}
\`\`\`

### Step 5: the same for benchmarks

Each benchmark (HODL, V2-LP, etc.) gets the same per-regime attribution. Then the alpha per regime is:

\`\`\`
   alpha_regime(LP, benchmark) = LP.pnl_in_regime - benchmark.pnl_in_regime
\`\`\`

If alpha is positive in a regime, the LP outperforms the benchmark in that regime. If alpha is negative, the LP underperforms. The capital-allocation verdict is grounded in this per-regime alpha.

---

## What the verdict looks like

The verdict synthesis pulls all of this together into prose readable by a non-engineer audience:

\`\`\`
Strategy: USDC/ETH 0.05% pool, range 2500-3500, hold rule
Period: 2025-12-01 to 2026-03-01 (90 days)
Vol bounds: low < 0.42 (annualised), high > 0.81

Regime distribution:
  Low vol:    31% of window (28 days equiv)
  Medium vol: 42% of window (38 days equiv)
  High vol:   27% of window (24 days equiv)

Per-regime alpha vs HODL:
  Low vol:    +2.10% annualised  →  LP wins (fee income > LVR)
  Medium vol: +0.40% annualised  →  LP wins narrowly
  High vol:   -5.70% annualised  →  LP loses (LVR > fee income)

Per-regime alpha vs DefiLlama stable-coin yields:
  Low vol:    +1.80% annualised  →  LP wins
  Medium vol: -0.20% annualised  →  LP loses to lending
  High vol:   -7.40% annualised  →  LP loses badly

Verdict:
  The V3 LP strategy is profitable across 73% of historical vol regimes
  vs HODL but only 31% of regimes vs stable-coin lending. If your alternative
  is "hold ETH," the LP is a positive-EV decision in low and medium vol. If
  your alternative is "lend stables on Aave," the LP is only worth deploying
  in low-vol conditions, which represented 31% of the last 90 days.

  Estimated dollar P/L on $10k deposit: +$184 (annualised) vs HODL,
                                          -$56 (annualised) vs stable lending.

  Recommendation: Deploy capital when realised vol is in the lower tercile
  (currently below 0.42 annualised). Withdraw during high-vol regimes.
\`\`\`

The verdict is generated by a Claude Code skill that reads the structured per-regime attribution and produces the prose synthesis. The skill has worked examples and templates for low/medium/high regime distributions.

> [!important] **Why the verdict is prose, not a number**
>
> A single P/L number ("+1.4% over 90 days") is meaningless without context. Was that 1.4% concentrated in one good week and flat the rest? Was it consistent? Was it lucky?
>
> Per-regime attribution makes the answer scannable. The verdict prose makes the answer actionable. Both are needed.

---

## What this corrects for in the literature

Most published LP backtests aggregate. They report a single P/L number across the window, or a single Sharpe ratio. This is the wrong reduction for a strategy whose performance is regime-dependent.

| Common approach              | Failure mode                                      |
|------------------------------|---------------------------------------------------|
| Aggregate P/L                 | Hides regimes where strategy bleeds money         |
| Aggregate Sharpe ratio        | Penalises high-regime vol in a way that mislabels |
| Year-over-year comparison      | Different years are different vol distributions  |
| Static threshold buckets       | Calibrated on outdated vol levels                 |
| Volume-weighted attribution    | Volume correlates with vol; conflates the two     |

Adaptive tercile fixes this by making the regime partition local to the backtest window. The strategy is judged against its own performance distribution. A strategy that "averages out fine" but loses 5% in 25% of conditions surfaces those conditions explicitly.

---

## What this looks like in code

The full M2.8 module structure:

\`\`\`
src-tauri/src/headline/
├── mod.rs                  ─▶ HeadlineComputer entry point
├── volatility.rs            ─▶ realised vol per window
├── tercile.rs               ─▶ adaptive partition
├── attribution.rs            ─▶ per-regime P/L
├── alpha.rs                  ─▶ alpha vs each benchmark
└── verdict.rs                ─▶ prose synthesis (Claude Code skill)

tests/headline_tests.rs:
  21 unit tests + 8 integration tests
\`\`\`

Approximately 800 lines of Rust + the verdict skill (markdown). The verdict skill is 220 lines including reference templates.

---

## What this proves about the engine architecture

> [!important] **The engine separates concerns honestly**
>
> M2.3 (backtest engine) produces an equity curve. M2.7 (benchmarks) produces benchmark equity curves. M2.8 (headline) does the regime partitioning and verdict synthesis.
>
> Each layer is independently testable. The engine produces the same equity curve regardless of how the headline layer reduces it. The headline can be re-tuned without re-running the backtest.

This is the kind of separation that pays off when you want to add a new headline (Vector C will add an ML-augmented verdict, for example). The engine does not need to know about regime classification. The headline does not need to know about Q64.96 math. They communicate through one contract: the equity curve.

---

## What is still open

| Item                                          | Status                                          |
|-----------------------------------------------|-------------------------------------------------|
| Regime persistence detection                  | next milestone — vol clusters, not just averages |
| Multi-pool simultaneous classification        | next milestone — when LP across multiple pools   |
| Live regime classification (not just historical)| live data dependent (blocked on Alchemy)        |
| Forward-looking regime forecast                | research direction — not in scope for v1         |

The adaptive tercile is the right baseline. The next refinement is recognising that vol regimes have persistence (high-vol days cluster together), which means the "currently in regime X" signal can be predictive on a day-ahead horizon. That work is queued.

---

## Closing

The vol regime classifier is the kind of analysis layer that turns a backtester into a decision tool. The math is not exotic. The choice of adaptive tercile over fixed thresholds is the engineering decision that makes the output honest across windows.

The capital-allocation verdict is the user-facing artefact. It is grounded in the per-regime attribution, which is grounded in the equity curve, which is grounded in the Q64.96 math, which is grounded in the V3 spec. The whole stack is auditable end-to-end.

Aurix's premise is that you can run serious DeFi analytics without paid APIs and without trusting third parties. The vol regime classifier is one of the layers that makes that promise useful in practice. It does not just tell you the LP made money; it tells you when the LP made money and when it did not, and it tells you what to do with that information.

That is the difference between an analytics tool and a chart-printer. M2.8 is what tips Tab 2 into the first category.
`,
};
