import type { Article } from "@/types";

export const aurixAuditCycle: Article = {
  slug: "aurix-audit-cycle",
  title: "The audit cycle: 28 findings, every one shipped",
  type: "Post-Mortem",
  date: "2026-05-04",
  project: "Aurix",
  description:
    "Aurix's Vector A sprint shipped Tab 2 end-to-end on 2026-05-03. The day after, a code-health audit ran across the new code and produced 28 findings across math correctness, storage idempotency, test gaps, performance, and error handling. This is the audit's findings, the fixes, and what the dual-cycle (sprint then audit) approach buys you.",
  tags: ["rust", "code-quality", "post-mortem", "auditing"],
  body: `# The audit cycle: 28 findings, every one shipped

Aurix's Vector A sprint shipped on 2026-05-03. Eight milestones (M2.0 through M2.8) plus a four-tier extension landed in two days. The code went from 67 files to 295, from 0 tests to 100+, from one working tab to two.

The next day, on 2026-05-04, a structured code-health audit ran across the new code. Not a "look around for problems" pass; a Claude Code skill (\`code-health-audit\`) that runs through every file, applies a consistent rubric, and produces structured findings.

It produced 28 findings. Every single one shipped a fix the same day.

This is the audit, the findings, and why this pattern of "ship a sprint, then run a structured audit" is dramatically more honest than "review as you go."

---

## The findings, by category

\`\`\`
                Category breakdown of 28 findings

  Math correctness    ████████░░░░░░░░░░░░░░░░░░░  8  (29%)
  Storage idempotency ██████░░░░░░░░░░░░░░░░░░░░░  6  (21%)
  Test coverage gaps  █████░░░░░░░░░░░░░░░░░░░░░░  5  (18%)
  Performance         ████░░░░░░░░░░░░░░░░░░░░░░░  4  (14%)
  Error handling      ███░░░░░░░░░░░░░░░░░░░░░░░░  3  (11%)
  Naming / API drift  ██░░░░░░░░░░░░░░░░░░░░░░░░░  2  (7%)
\`\`\`

| Category               | Findings | What this category covered                              |
|------------------------|---------:|---------------------------------------------------------|
| Math correctness        | 8        | Q64.96 ops, IL closed forms, LVR signs, fee accruals    |
| Storage idempotency     | 6        | Schema migrations, INSERT-or-UPDATE patterns            |
| Test coverage gaps      | 5        | Untested paths, mocked-but-unverified behaviour         |
| Performance             | 4        | Avoidable allocations, redundant DB queries             |
| Error handling           | 3        | Errors that returned \`Ok(())\` silently                |
| Naming / API drift       | 2        | Inconsistent function naming across modules             |

### Severity breakdown

| Severity | Findings | What this level meant for Vector A                      |
|----------|---------:|---------------------------------------------------------|
| HIGH     | 4        | Active risk to math correctness or live-data integrity   |
| MEDIUM   | 18       | Code health, would degrade maintenance over time         |
| LOW      | 6        | Cleanup, naming, dead code                                |

---

## The 4 HIGH-severity findings

### HIGH-1: \`get_liquidity_for_amount0\` rounded down twice

\`\`\`rust
// audit found this in math/liquidity.rs

pub fn get_liquidity_for_amount0(
    sqrt_a: &Q64x96,
    sqrt_b: &Q64x96,
    amount0: &BigUint,
) -> BigUint {
    // BUG: integer-divide rounds down once
    let intermediate = (amount0 * &sqrt_a.0 * &sqrt_b.0) / Q96;
    // BUG: divide again here also rounds down
    intermediate / (&sqrt_b.0 - &sqrt_a.0)
}
\`\`\`

Two integer divisions in sequence, each rounding down. Total error: up to 2 LSB. For a small position the error is invisible. For a position with $1M deposit on a tight range, the error compounds across thousands of swaps and produces a meaningfully wrong P/L.

The fix consolidates rounding to the final operation:

\`\`\`rust
pub fn get_liquidity_for_amount0(
    sqrt_a: &Q64x96,
    sqrt_b: &Q64x96,
    amount0: &BigUint,
) -> BigUint {
    let numerator = amount0 * &sqrt_a.0 * &sqrt_b.0;
    let denominator = &(&sqrt_b.0 - &sqrt_a.0) * Q96;
    numerator / denominator   // single rounding
}
\`\`\`

Property test that caught the regression in CI:

\`\`\`rust
proptest! {
    #[test]
    fn liquidity_for_amount0_round_trip(
        amount0 in 1u128..1_000_000_000_000_000_000u128,
        sqrt_a in valid_sqrt_price(),
        sqrt_b in valid_sqrt_price().filter(|s| s > &sqrt_a),
    ) {
        let liquidity = get_liquidity_for_amount0(&sqrt_a, &sqrt_b, &BigUint::from(amount0));
        let recovered = get_amount0_for_liquidity(&sqrt_a, &sqrt_b, &liquidity);
        // round-trip should preserve amount0 within 1 LSB
        let diff = if recovered > BigUint::from(amount0) {
            &recovered - amount0
        } else {
            BigUint::from(amount0) - recovered
        };
        prop_assert!(diff <= BigUint::from(2u32));
    }
}
\`\`\`

### HIGH-2: tick crossing did not flip fee growth correctly

When a swap crosses a tick boundary, V3 specifies that the tick's accumulated fee growth gets flipped relative to the position's outside / inside fee growth. The old code had a sign error in the flip:

\`\`\`rust
// BUG: this was using the wrong direction
fn cross_tick(state: &mut PoolState, tick: i32) {
    let fee_growth_outside_0 = state.fee_growth_global_0 - state.tick_fee_growth_outside_0[tick];
    let fee_growth_outside_1 = state.fee_growth_global_1 - state.tick_fee_growth_outside_1[tick];
    state.tick_fee_growth_outside_0[tick] = fee_growth_outside_0;  // wrong
    state.tick_fee_growth_outside_1[tick] = fee_growth_outside_1;  // wrong
}

// FIXED: per V3 spec, the flip is "global - existing"
fn cross_tick(state: &mut PoolState, tick: i32) {
    state.tick_fee_growth_outside_0[tick] =
        state.fee_growth_global_0 - state.tick_fee_growth_outside_0[tick];
    state.tick_fee_growth_outside_1[tick] =
        state.fee_growth_global_1 - state.tick_fee_growth_outside_1[tick];
}
\`\`\`

The bug only manifested for positions that spanned across a crossed tick AND that had accumulated meaningful fees on both sides. Synthetic fixtures had not exercised this combination; the audit added a test case that did:

\`\`\`rust
#[test]
fn position_spanning_crossed_tick_accumulates_fees_correctly() {
    let mut state = PoolState::new(/* ... */);

    // build a position spanning ticks [-100, +100]
    let position = open_position(/* ... */, -100, 100);

    // swap that crosses tick 50 (within the position range)
    let swap_a = build_swap(amount: ..., direction: ZeroForOne, target_tick: 25);
    state.apply_swap(swap_a);

    // swap that crosses tick 150 (outside the position range)
    let swap_b = build_swap(amount: ..., direction: ZeroForOne, target_tick: 175);
    state.apply_swap(swap_b);

    // collect fees for the position
    let fees = position.fees_owed(&state);

    // verify fees match V3 reference computation
    assert_eq!(fees.amount0, expected_amount0());
    assert_eq!(fees.amount1, expected_amount1());
}
\`\`\`

### HIGH-3: LVR sign incorrect for above-range positions

LVR (loss-versus-rebalanced) is supposed to be non-negative for an LP. The original computation produced negative values when the price moved out of the position range upward, due to an incorrect sign on the closed-form expression:

\`\`\`rust
// BUG: sign-correction missing for above-range
pub fn compute_lvr_increment(/* ... */) -> SignedDecimal {
    // ... math that produces a value
    return delta;   // sometimes negative
}

// FIXED
pub fn compute_lvr_increment(/* ... */) -> Decimal {
    let raw = compute_raw_increment(/* ... */);
    if position.is_above_range(state.sqrt_p) {
        // when above range, LP is all token1; LVR is computed differently
        compute_above_range_lvr(state, position)
    } else if position.is_below_range(state.sqrt_p) {
        compute_below_range_lvr(state, position)
    } else {
        raw   // in-range, sign is correct
    }
}
\`\`\`

The bug only fired for positions whose range was deep below the current price (or deep above), which is uncommon for tight-band strategies but very common for HODL-style ranges set at extreme prices.

### HIGH-4: Q64.96 division by very small denominator

The math library had no protection against division by very small denominators (close to but not exactly zero). For tight-range positions, the difference \`sqrt_p_b - sqrt_p_a\` can become very small, and dividing by it produces astronomical intermediate values that then truncate when stored back to Q64.96.

\`\`\`rust
// FIXED: saturating arithmetic added
pub fn safe_div(a: &Q64x96, b: &Q64x96) -> Result<Q64x96, MathError> {
    if b.0 < MIN_DENOMINATOR {
        return Err(MathError::DivisionUnstable);
    }
    Ok(a.div(b))
}
\`\`\`

The fix is at the API boundary: \`safe_div\` returns a result instead of panicking or producing nonsense. Callers handle the error explicitly.

---

## Storage idempotency findings (6)

These were all variants of the same pattern: writes that should be idempotent but were not. The most representative:

\`\`\`rust
// BUG: would fail on second insert with same primary key
pub async fn store_swap(conn: &mut Connection, swap: &Swap) -> Result<()> {
    conn.execute(
        "INSERT INTO swaps (pool_address, block_number, log_index, ...)
         VALUES (?1, ?2, ?3, ...)",
        params![swap.pool_address, swap.block_number, swap.log_index, /* ... */],
    )?;
    Ok(())
}

// FIXED: idempotent via INSERT OR IGNORE
pub async fn store_swap(conn: &mut Connection, swap: &Swap) -> Result<()> {
    conn.execute(
        "INSERT OR IGNORE INTO swaps (pool_address, block_number, log_index, ...)
         VALUES (?1, ?2, ?3, ...)",
        params![swap.pool_address, swap.block_number, swap.log_index, /* ... */],
    )?;
    Ok(())
}
\`\`\`

> [!important] **Why this matters in DeFi data**
>
> Re-running an ingestion pass should produce the same database state as running it once. Without idempotent writes, every re-run produces duplicate rows or PRIMARY KEY violations.
>
> This becomes load-bearing when the live data layer goes live. A failed ingestion pass should be safely re-runnable.

---

## Test coverage gaps (5)

The audit ran a coverage analysis and identified five untested paths in the new Vector A code:

| Untested path                                  | Why it slipped through                          |
|------------------------------------------------|-------------------------------------------------|
| MockArchiveSource missing-fixture path          | Tests only used valid fixtures                   |
| Subgraph rate-limit retry logic                 | Subgraph not in test infrastructure              |
| Position partial burn (50% liquidity removed)   | Only full burns covered                          |
| Multiple-deposit positions (mint twice)         | Only single-mint positions covered               |
| Concurrent reader/writer SQLite access          | Single-threaded tests                            |

Each gap got a test added in the audit-cycle commit. Total test count went from 96 to 139.

---

## Performance findings (4)

Vector A's hot paths had four classes of avoidable cost:

| Finding                                          | Cost class       | Fix                                     |
|--------------------------------------------------|------------------|-----------------------------------------|
| BigUint cloned in inner loop                     | Allocation       | Borrow + chained ops                    |
| Redundant DB query per swap                       | I/O              | Batch reads at chunk boundary           |
| Q64.96 multiplication built temporary U512         | Allocation       | Scratch buffer reuse                    |
| String formatting in hot logging path             | CPU              | Lazy formatting via \`tracing\`          |

None were emergencies. All four were the kind of inefficiency that becomes load-bearing when the hot path runs millions of times. The combined improvement on a 90-day backtest: ~30% reduction in wall-clock.

---

## Error handling findings (3)

\`\`\`rust
// BUG: error swallowed silently
async fn refresh_pool_data(&self, pool: Address) -> Result<()> {
    if let Err(_) = self.fetch_swaps(pool).await {
        return Ok(());   // silently ignores the failure
    }
    Ok(())
}

// FIXED
async fn refresh_pool_data(&self, pool: Address) -> Result<()> {
    self.fetch_swaps(pool).await
        .context("failed to refresh pool data")?;
    Ok(())
}
\`\`\`

Three places in the codebase had similar "ignore the error and pretend everything worked" patterns. This is the kind of bug that makes a system feel mysterious: it works most of the time, fails silently the rest, and there is no log trail to point at.

The fix is consistent: every \`Result\` either succeeds, produces a structured error, or is explicitly logged with full context. No silent \`Ok(())\` from inside an error case.

---

## Naming / API drift (2)

Two findings about consistency:

| Inconsistency                          | Resolution                                          |
|----------------------------------------|-----------------------------------------------------|
| \`fetch_swaps\` vs \`get_swaps\`        | Standardised on \`fetch_*\` for IO, \`get_*\` for in-memory |
| \`Position::new\` vs \`Position::open\` | Standardised on \`Position::open\` (matches V3 lifecycle) |

These are not big bugs. They are the kind of inconsistency that confuses you six months later when you cannot remember which one is which. The audit caught them while the code was fresh.

---

## What the audit cycle bought

> [!important] **The dual-cycle approach: ship + audit**
>
> | Approach                              | Outcome                                          |
> |---------------------------------------|--------------------------------------------------|
> | Review as you go                       | Velocity drops; reviews are shallow              |
> | Ship the sprint, then audit            | Velocity stays high; audit is structured         |
> | Ship and never audit                   | Bugs ship to production; debt compounds          |
>
> The dual-cycle approach lets the sprint move at sprint pace and the audit move at audit pace. Each phase is honest about what it does well.

The audit caught:

- 4 high-severity bugs that would have produced wrong P/L numbers
- 6 idempotency bugs that would have broken the ingestion replay story
- 5 test gaps that would have masked future regressions
- 4 performance issues that would have grown into bottlenecks
- 3 silent-error patterns that would have made debugging impossible
- 2 naming inconsistencies that would have confused future-me

If any one of these had reached production, it would have been a debugging session of unknown duration. The audit pass cost about 8 hours total. Each finding's fix took 15-90 minutes, with the high-severity ones at the longer end.

---

## What the audit was running

The audit was driven by a Claude Code skill: \`code-health-audit\`. Not a free-form review prompt. A structured skill with:

| Skill component                          | Purpose                                                 |
|------------------------------------------|---------------------------------------------------------|
| Reference rubric                         | Specific failure modes to look for                      |
| Worked examples                          | Calibration against real bugs from past audits          |
| Per-category checklist                    | Math, storage, tests, performance, errors, API drift    |
| Output format                            | Structured findings: severity, file, line, fix proposal |
| Mandatory passes                         | Full source walk; no skipping                            |

The skill produces output that looks like:

\`\`\`
HIGH-1: math/liquidity.rs:42-47
  get_liquidity_for_amount0 has cumulative rounding error of up to 2 LSB.
  Two integer divisions sequenced; consolidate to single division at end.
  Fix template: numerator/denominator pattern shown in fix-templates/math/.

MEDIUM-3: storage/swaps.rs:88-92
  Insert without idempotency guard; second-run will produce PRIMARY KEY violation.
  Fix: INSERT OR IGNORE.

LOW-1: ingest/alchemy.rs:201
  Function named fetch_pool_data; project convention is fetch_pool_snapshot.
  Fix: rename for consistency.
\`\`\`

The structured output makes the audit's findings reviewable by a human in a single pass. Each finding has a file:line, a severity, a fix proposal, and a reference to a fix template if one exists.

---

## What this means for engineering practice

> [!important] **The general lesson**
>
> Sprints are good for shipping things. Audits are good for catching bugs. They are different kinds of work.
>
> Trying to do both at the same time produces sprints that ship slowly and audits that miss bugs. Sequencing them lets each phase be efficient at its own job.

A few specific takeaways from this cycle:

| Takeaway                                                | Why                                                        |
|---------------------------------------------------------|-------------------------------------------------------------|
| Sprint hard, audit immediately afterwards                | Code is fresh; bugs are still present in your head          |
| Audit must be structured, not free-form                  | Free-form review misses categories systematically           |
| Audit produces fix proposals, not just diagnoses          | "X is wrong" is less actionable than "X is wrong, fix Y"   |
| Every finding gets a regression test                     | Catches the same bug if it returns                          |
| Severity-tag every finding                                | Lets you triage when you cannot fix all of them in one cycle |

---

## What still needs to happen

The audit caught 28 things. It did not catch:

| What the audit is blind to                          | Why                                                          |
|-----------------------------------------------------|--------------------------------------------------------------|
| Logical bugs in business logic                      | Audit checks structure, not strategy correctness              |
| Performance under live data                          | Synthetic fixtures cannot simulate real swap distributions  |
| Race conditions under multi-user load               | Aurix is single-user; no test coverage                       |
| UX-level bugs in the React frontend                  | Audit is backend-focused                                     |
| Bugs that only manifest after long-running execution | Audit runs against snapshots, not stress tests              |

These are the gaps the audit cycle does not cover. The Vector A roadmap has a follow-up "live data verification" milestone that addresses the first two; the others are outside the current scope.

---

## What landed

Every finding shipped as part of the 2026-05-04 batch. The commits are tagged for traceability:

\`\`\`
9085a82  audit/v2.4.1: fix HIGH-1 liquidity rounding
8f12a40  audit/v2.4.2: fix HIGH-2 tick fee growth flip
... 26 more commits ...
b7e08c2  audit/v2.4.28: rename Position::new → Position::open
\`\`\`

Total commits: 28. Total time: ~8 hours of focused work. Zero new features. Just fixes.

---

## Closing

The audit cycle is what gives the Vector A sprint its credibility. Two days of building plus one day of auditing is dramatically more honest than three days of building. The audit pass is what catches the math correctness bugs, the silent-error patterns, the idempotency gaps that would have shipped to production.

The model is simple: ship the sprint, run the audit, ship the audit's fixes. Three days of work, three credible deliverables. No "we'll review later." No bugs leaking into the next sprint.

If you are running compressed timelines, the audit is not optional. It is what stops compressed timelines from leaking technical debt into the rest of the project. Every Vector beyond A in Aurix's roadmap will follow the same pattern: sprint, audit, ship.

That is what makes "shipped Tab 2 in 2 days" a defensible claim instead of a marketing line.
`,
};
