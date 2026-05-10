import type { Article } from "@/types";

export const aurixVectorASprint: Article = {
  slug: "aurix-vector-a-sprint",
  title: "Vector A in 2 days: shipping a Uniswap V3 LP backtester end-to-end",
  type: "Dev Log",
  date: "2026-05-05",
  project: "Aurix",
  description:
    "On 2026-05-03 and 2026-05-04, Aurix went from a single-tab DeFi monitoring app to a full Uniswap V3 LP backtester with milestones M2.0 through M2.8 plus a 4-tier extension. 295 files. 139 backend tests passing. Q64.96 fixed-point math by hand. This is the timeline.",
  tags: ["rust", "tauri", "defi", "backtesting", "uniswap"],
  body: `# Vector A in 2 days: shipping a Uniswap V3 LP backtester end-to-end

Aurix is a local-first, zero-cost, read-only DeFi analytics desktop application built with Tauri 2. The frontend is React 19 in TypeScript; the backend is Rust. The whole thing runs on-device with no cloud, no wallet, and no transaction capability. The premise is that DeFi analytics tools either cost money (premium APIs, subscriptions) or require trusting a third party with your activity. Aurix makes the computation local and the data sources free.

For its first six weeks Aurix was a single-tab cross-DEX arbitrage detector. Tab 1: working. Tabs 2 through 5: README intent only.

On 2026-05-03 and 2026-05-04, Aurix shipped Tab 2 (a full Uniswap V3 LP backtester) end-to-end. Eight milestones from M2.0 storage through M2.8 capital-allocation headline, plus a four-tier extension (cross-chain, V3 forks, non-USD pools), plus an audit cycle that produced 28 findings and shipped fixes for every one of them.

This is the timeline.

---

## The numbers

| Metric                            | 2026-04-22 (week before) | 2026-05-04 (sprint end) |
|-----------------------------------|--------------------------|-------------------------|
| Total commits                     | 8                        | 40                       |
| Files in repo                     | 67                       | 295                      |
| Backend Rust LoC                   | ~2,100                   | **~10,500**              |
| Frontend TypeScript LoC            | ~1,400                   | **~9,000**               |
| Backend tests                      | 0                        | **139 passing**          |
| Tabs working                       | 1 (arb)                   | **2 (arb + LP)**          |
| Audit findings                     | n/a                      | 28 / 28 fixed             |

\`\`\`
              Sprint cumulative LoC

   k LoC
   20 │                                          ████████ ◀ end (10500 + 9000)
   18 │                                       ███
   16 │                                    ████
   14 │                                 ████
   12 │                              ████
   10 │                           ███
    8 │                        ███
    6 │                     ███
    4 │                  ███
    2 │ ───────────────███─    ◀ week before (2100 + 1400)
    0 ┴─────────────────────────────────────────────────────
       d-7  d-6  d-5  d-4  d-3  d-2  d-1  d0  d1   d2

      sprint window: d-1 through d2 (Saturday + Sunday + audit cycle)
\`\`\`

The sprint was Saturday and Sunday. The audit cycle was the following Tuesday.

---

## Why this got compressed

Vector A was originally scheduled as "the next two weeks of work." It compressed into two days because:

| Compression factor                       | What it bought                                              |
|------------------------------------------|-------------------------------------------------------------|
| Strict scope discipline                   | No new tabs, no UI redesign, only Tab 2                     |
| Clean-room V3 math (no off-the-shelf BLAS) | No hours lost wrangling library calling conventions         |
| Synthetic-first validation                 | Validate against generated fixtures before live data        |
| Aggressive parallel agent use              | Agents worked in parallel on disjoint subsystems             |
| Pre-existing Tab 1 stack                  | Tauri shell, build pipeline, telemetry, error model done     |
| Decision to defer live data                | Storage + math + validation could ship without RPC integration |

The big one is the decision to defer live data verification. Live data is blocked on an Alchemy API key that is currently broken (truncated, ~21 chars vs typical 32, and the user's Alchemy login also broke). Verifying the math against actual on-chain swaps is the next session. Until then, the math is verified against synthetic fixtures and the architecture is verified against unit tests.

> [!important] **Synthetic-first is the right call here**
>
> Q64.96 fixed-point math has clean failure modes against synthetic fixtures (you can construct an exact expected output) and ambiguous failure modes against live data (was that a math bug or a fee tier mismatch?).
>
> Validating against synthetic data first ensures the math is right. Validating against live data afterwards ensures the math agrees with reality. Doing them in that order isolates the failure modes.

---

## Milestone arc

\`\`\`
                          Vector A milestone graph

   M2.0 storage         ─▶  schema for swaps, mints, burns, positions
        │
        ▼
   M2.1 ingest          ─▶  3-tier free-data fallback (Alchemy/subgraph/mock)
        │                    + ABI decoder + per-tier source modules
        │
        ▼
   M2.2 math            ─▶  Q64.96 fixed-point, tick math, liquidity math
        │                    closed-form IL, fee math
        │
        ├──────────────────────────────────────────────────────────────┐
        │                                                              │
        ▼                                                              ▼
   M2.3 backtest         M2.4 validation                         M2.5 strategies
   per-swap loop         synthetic fixture harness                cartesian sweep
   LVR, rebalance        real-fixture pending                     range × rule × deposit
        │
        ├──────────────────────────────────────────────────────────────┐
        │                                                              │
        ▼                                                              ▼
   M2.6 GUI               M2.7 benchmarks                        M2.8 headline
   Tab 2 frontend         DefiLlama / FRED / V2 / HODL            adaptive-tercile vol
   auto-pipeline          alpha decomposition                     verdict prose synthesis
\`\`\`

Each milestone shipped as its own commit with its own tests. The dependency graph kept the early milestones serial (storage → ingest → math) and the later ones parallel (backtest, validation, strategies could land in any order once math was there).

---

## Day 1: M2.0 through M2.5

The first day was the foundation.

### M2.0: storage

A SQLite schema for swaps, mints, burns, positions, and pool snapshots:

\`\`\`sql
CREATE TABLE pool_snapshots (
    id INTEGER PRIMARY KEY,
    pool_address TEXT NOT NULL,
    block_number INTEGER NOT NULL,
    sqrt_price_x96 TEXT NOT NULL,        -- Q64.96 as TEXT for precision
    liquidity TEXT NOT NULL,              -- u128 as TEXT
    tick INTEGER NOT NULL,
    fee_growth_global_0_x128 TEXT NOT NULL,
    fee_growth_global_1_x128 TEXT NOT NULL,
    UNIQUE(pool_address, block_number)
);

CREATE TABLE swaps (
    id INTEGER PRIMARY KEY,
    pool_address TEXT NOT NULL,
    block_number INTEGER NOT NULL,
    log_index INTEGER NOT NULL,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    amount0 TEXT NOT NULL,                -- signed i256 as TEXT
    amount1 TEXT NOT NULL,
    sqrt_price_x96 TEXT NOT NULL,
    liquidity TEXT NOT NULL,
    tick INTEGER NOT NULL,
    UNIQUE(pool_address, block_number, log_index)
);

CREATE TABLE positions (
    id INTEGER PRIMARY KEY,
    owner TEXT NOT NULL,
    pool_address TEXT NOT NULL,
    tick_lower INTEGER NOT NULL,
    tick_upper INTEGER NOT NULL,
    liquidity TEXT NOT NULL,
    fee_growth_inside_0_last_x128 TEXT NOT NULL,
    fee_growth_inside_1_last_x128 TEXT NOT NULL,
    tokens_owed_0 TEXT NOT NULL,
    tokens_owed_1 TEXT NOT NULL,
    UNIQUE(owner, pool_address, tick_lower, tick_upper)
);
\`\`\`

Big numbers stored as TEXT, not INTEGER. SQLite's INTEGER type maxes out at i64 (≈ 1.8e19). Q64.96 \`sqrt_price_x96\` values can exceed that. The choice was: serialise to TEXT, deserialise via num-bigint on read. Marginally slower than native INTEGER, dramatically simpler than BLOB-with-byte-order.

### M2.1: ingest

The data ingestion path with a three-tier fallback:

\`\`\`rust
pub trait ArchiveSource: Send + Sync {
    async fn fetch_pool_snapshot(&self, pool: Address, block: u64) -> Result<PoolSnapshot>;
    async fn fetch_swaps(&self, pool: Address, from: u64, to: u64) -> Result<Vec<Swap>>;
    fn name(&self) -> &str;
}

pub struct AlchemyArchiveSource { /* ... */ }
pub struct UniswapV3SubgraphSource { /* ... */ }
pub struct MockArchiveSource { /* ... */ }

impl ArchiveSource for AlchemyArchiveSource { /* ... */ }
impl ArchiveSource for UniswapV3SubgraphSource { /* ... */ }
impl ArchiveSource for MockArchiveSource { /* ... */ }

pub async fn fetch_with_fallback(
    sources: &[Box<dyn ArchiveSource>],
    pool: Address,
    block: u64,
) -> Result<PoolSnapshot> {
    let mut last_error = None;
    for source in sources {
        match source.fetch_pool_snapshot(pool, block).await {
            Ok(snap) => {
                tracing::info!("fetched from {}", source.name());
                return Ok(snap);
            }
            Err(e) => {
                tracing::warn!("source {} failed: {:?}", source.name(), e);
                last_error = Some(e);
            }
        }
    }
    Err(last_error.unwrap_or_else(|| anyhow::anyhow!("no sources configured")))
}
\`\`\`

Three sources, queried in priority order: Alchemy (fastest, paid in theory but free tier sufficient), Uniswap V3 subgraph (free hosted), MockArchiveSource (deterministic test fixtures). A failure on one tier silently falls through to the next.

(Full story in [the 4-tier free-data fallback article](/?article=aurix-free-data-fallback).)

### M2.2: math

The clean-room V3 port. Q64.96 fixed-point arithmetic, tick math, liquidity math, fees, IL closed forms. Everything from scratch, no off-the-shelf math libraries.

The interesting bit: \`sqrt_price_x96\` (a Q64.96 fixed-point number) maps to a tick via:

\`\`\`rust
pub fn sqrt_price_to_tick(sqrt_price_x96: U256) -> i32 {
    // tick = floor(2 * log_{sqrt(1.0001)}(sqrt_price))
    // implemented via lookup tables for the integer log and Newton iteration for fractional
    // ...
}
\`\`\`

(Full story in [the Q64.96 math article](/?article=aurix-q64-96-math).)

### M2.3: backtest engine

The simulation loop walks a sequence of swaps, applies each one to the position, and produces an equity curve:

\`\`\`rust
pub fn simulate_position(
    swaps: &[Swap],
    initial_position: Position,
    rebalance_rule: &dyn RebalanceRule,
) -> EquityCurve {
    let mut state = State::from(initial_position);
    let mut curve = EquityCurve::default();

    for swap in swaps {
        // 1. Apply swap to pool state
        state.apply_swap(swap);

        // 2. Compute LP value at current pool state
        let lp_value = state.compute_lp_value();

        // 3. Compute LVR (loss-versus-rebalanced) at current state
        let lvr = state.compute_lvr();

        // 4. Apply rebalance rule (no-op for "hold", ranged actions for "tight band")
        rebalance_rule.maybe_rebalance(&mut state, swap);

        curve.push(swap.timestamp, lp_value, lvr);
    }

    curve
}
\`\`\`

LVR is "loss-versus-rebalanced," the classic V3 LP performance metric (Milionis et al., 2022). A V3 LP is structurally short volatility relative to a constantly-rebalanced 50/50 portfolio; LVR quantifies how much.

### M2.4: validation harness

Synthetic fixtures with exact expected outputs. The pattern:

\`\`\`rust
#[test]
fn known_constant_sum_swap_produces_expected_amounts() {
    let initial = Pool {
        sqrt_price_x96: from_decimal(1.0),
        liquidity: 1_000_000_000_000_000_000_000u128.into(),
        tick: 0,
        // ... fixed fees
    };

    let swap = Swap {
        amount0: 1_000_000_000_000_000_000i128.into(),
        amount1: 0i128.into(),
        zero_for_one: true,
        // ...
    };

    let result = apply_swap(initial, swap).unwrap();

    // Expected amounts computed by hand (unit-tested vs Uniswap V3 spec)
    assert_eq!(result.amount_in_consumed, expected_amount_in());
    assert_eq!(result.amount_out_produced, expected_amount_out());
    assert_eq!(result.tick, expected_final_tick());
}
\`\`\`

50+ such fixtures, covering swap directions, tick-crossings, fee accrual, mint/burn lifecycle, and edge cases (single-tick pools, exhausted liquidity).

### M2.5: strategy sweep

Cartesian product over strategy parameters:

\`\`\`rust
pub struct StrategyGrid {
    pub ranges: Vec<(i32, i32)>,         // (tick_lower, tick_upper) candidates
    pub rules: Vec<RebalanceRuleId>,      // hold, tight-band, etc.
    pub deposits: Vec<U256>,              // initial deposit sizes
    pub periods: Vec<(u64, u64)>,         // historical windows
}

impl StrategyGrid {
    pub fn iter(&self) -> impl Iterator<Item = StrategyConfig> + '_ {
        iproduct!(&self.ranges, &self.rules, &self.deposits, &self.periods)
            .map(|(range, rule, deposit, period)| StrategyConfig {
                range: *range,
                rule: *rule,
                deposit: deposit.clone(),
                period: *period,
            })
    }
}
\`\`\`

Hundreds of strategy configurations evaluated against the same historical data, ranked by P/L net of LVR.

---

## Day 2: M2.6 through M2.8 + audit prep

### M2.6: GUI

Tab 2 frontend. Auto-run pipeline (no separate "run backtest" button — the parameter form triggers re-run on change), strict-mode discipline, settings persistence in \`localStorage\`.

\`\`\`
                       Tab 2 layout

   ┌─────────────────────────────────────────────────────────────┐
   │ Aurix · Tab 2 · LP Backtester                                │
   ├─────────────────┬───────────────────────────────────────────┤
   │ Strategy form   │  Equity curve chart                       │
   │ ─────────────── │  ─────────────────                         │
   │ Pool: USDC/ETH  │  ▲                                        │
   │ Range: 2500-3500│  │            ╱╲                          │
   │ Rule: hold      │  │      ╱╲   ╱  ╲      ╱──                │
   │ Deposit: $10k   │  │  ╱╲ ╱  ╲ ╱    ╲────╱                   │
   │ Period: 90d     │  └──╴────────────────────────────────▶    │
   │                 │  jan       apr       jul       oct        │
   │ [auto-run]      │                                            │
   ├─────────────────┴───────────────────────────────────────────┤
   │ Headline verdict: "Tight-band rebalance on weekly cadence    │
   │ outperforms HODL by 4.2% net of fees and LVR over 90d."      │
   ├──────────────────────────────────────────────────────────────┤
   │ Benchmarks: HODL · V2-LP · 60/40 · alpha vs each              │
   └──────────────────────────────────────────────────────────────┘
\`\`\`

### M2.7: benchmarks

Five benchmark strategies, each producing a comparable equity curve:

| Benchmark         | What it computes                                  |
|-------------------|---------------------------------------------------|
| HODL              | 50/50 split at start, no trades                   |
| V2-LP             | Simulated Uniswap V2 LP (constant product)         |
| DefiLlama yields   | Stable-coin lending rate over the period          |
| FRED 10Y T-bill    | Risk-free rate over the period                    |
| Beaconcha.in stake | ETH staking rate                                  |

Alpha decomposition: Vector A's V3 LP equity curve minus each benchmark = excess return attributable to V3 LP strategy. Each can be positive or negative; the table makes the trade-offs explicit.

### M2.8: headline verdict

Adaptive-tercile vol regime classifier. Reads the historical realised volatility, divides into terciles (low / medium / high), and emits a verdict prose synthesis appropriate to the regime.

(Full story in [the vol regime classifier article](/?article=aurix-vol-regime-classifier).)

---

## Audit cycle (2026-05-04)

The day after the sprint, a code-health audit ran across the new Vector A code. 28 findings, all shipped:

\`\`\`
                  Audit findings by category

  Math correctness    ████████░░░░░░░░░░░░░░░░░░░  8
  Storage idempotency ██████░░░░░░░░░░░░░░░░░░░░░  6
  Test coverage gaps  █████░░░░░░░░░░░░░░░░░░░░░░  5
  Performance         ████░░░░░░░░░░░░░░░░░░░░░░░  4
  Error handling      ███░░░░░░░░░░░░░░░░░░░░░░░░  3
  Naming / API drift  ██░░░░░░░░░░░░░░░░░░░░░░░░░  2
\`\`\`

(Full story in [the audit cycle article](/?article=aurix-audit-cycle).)

---

## What blocked vs what shipped

| Component                         | Status              | Reason                                  |
|-----------------------------------|---------------------|----------------------------------------|
| Storage schema                     | ✓ shipped           |                                         |
| Math (Q64.96, ticks, liquidity)    | ✓ shipped + tested  |                                         |
| Backtest engine                    | ✓ shipped + tested  |                                         |
| Strategy sweep                     | ✓ shipped           |                                         |
| Synthetic validation               | ✓ shipped           |                                         |
| GUI Tab 2                          | ✓ shipped           |                                         |
| Benchmark strategies               | ✓ shipped           |                                         |
| Headline verdict                   | ✓ shipped           |                                         |
| Audit fixes                        | ✓ shipped           |                                         |
| **Live data verification**         | **❌ blocked**      | **Alchemy key truncated, login broken** |

The live-data block is the one outstanding item. Tab 1 appears to work because it silently falls through to LlamaRPC; Tab 2 cannot run live because it needs the Alchemy archive endpoint specifically. Resolution: restore Alchemy login, fix the truncated key, run Tab 2 against actual ETH/USDC pool data, compare against the synthetic-fixture-validated math.

---

## What this proves about scope discipline

> [!important] **The right level of scope for a 2-day sprint**
>
> Vector A worked because the scope was: "Tab 2, end to end, with synthetic validation, no live data."
>
> If the scope had been "Tab 2 with live data working perfectly," the live-data debugging would have eaten both days and nothing would have shipped.
>
> Synthetic-first validation is what made the 2-day shipping possible. The live-data verification is a separate session.

Strict scope discipline is not optional for compressed timelines. It is the only way compressed timelines work.

---

## What landed

| Deliverable                                | Location                                  |
|--------------------------------------------|-------------------------------------------|
| Storage schema + migrations                 | \`src-tauri/src/storage/\`                 |
| Q64.96 math library                         | \`src-tauri/src/math/\`                    |
| Ingest sources + fallback                   | \`src-tauri/src/ingest/\`                  |
| Backtest engine                              | \`src-tauri/src/backtest/\`                |
| Synthetic fixtures + validation harness     | \`src-tauri/src/validation/\`              |
| Strategy grid + cartesian product            | \`src-tauri/src/strategies/\`              |
| Benchmark strategies + alpha decomposition  | \`src-tauri/src/benchmarks/\`              |
| Headline verdict synthesiser                  | \`src-tauri/src/headline/\`                |
| Tab 2 frontend                               | \`src/features/lp-backtest/\`              |
| Cross-runtime contract types                  | shared types via \`tauri::Result\`         |

295 files. 139 backend tests passing. Two tabs working. One outstanding blocker (Alchemy live data).

The sprint is the model for the remaining vectors. Vector B (mempool MEV detector) and Vector C (ML arbitrage classifier) are the next candidates. They reuse the storage layer (M2.0) and are otherwise independent.

If Vector A produces signal once live data lands, Aurix is the strongest project in the portfolio for crypto-quant audiences. The depth-on-one-vector strategy is how it gets there. Two days for Tab 2 was not unreasonable; it was the right level of scope to commit to deeply, and it shipped.
`,
};
