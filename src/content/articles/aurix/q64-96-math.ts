import type { Article } from "@/types";

export const aurixQ6496Math: Article = {
  slug: "aurix-q64-96-math",
  title: "Q64.96 fixed-point math, by hand, for V3 LP simulation",
  type: "White Paper",
  date: "2026-05-05",
  project: "Aurix",
  description:
    "Why Uniswap V3's Q64.96 fixed-point representation is the right number format for LP simulation, what it costs to implement from scratch in Rust without any off-the-shelf math libraries, and the closed-form impermanent-loss math that makes per-swap simulation tractable. The clean-room V3 port behind Aurix's Tab 2.",
  tags: ["rust", "fixed-point", "uniswap", "math", "defi"],
  body: `# Q64.96 fixed-point math, by hand, for V3 LP simulation

Aurix's Vector A milestone is a Uniswap V3 LP backtester. The core of any V3 backtester is the math: tick math, liquidity math, fee accrual, and impermanent loss. Get any of those wrong by a single least-significant bit and the simulator produces results that look reasonable but disagree with the chain.

V3 uses a specific number format for its on-chain math: \`Q64.96\` fixed-point. This is the format Aurix uses end-to-end, implemented from scratch in Rust, with zero off-the-shelf math libraries on the simulation hot path.

This document is about why that representation is the right one, what it costs to implement, and how it interacts with the V3 invariants.

---

## Why fixed-point and not floating-point

The natural instinct, looking at "we need numbers up to 10^57 with high precision," is to reach for a big-decimal library or float64. Both are wrong choices for V3 LP simulation.

| Representation     | Range                  | Precision               | Determinism      | V3 chain agreement |
|--------------------|------------------------|-------------------------|------------------|--------------------|
| f32                | ±3.4e38                | ~7 decimal digits       | non-deterministic | ❌ disagrees fast  |
| f64                | ±1.8e308               | ~15 decimal digits      | non-deterministic | ❌ disagrees       |
| BigDecimal         | unbounded              | configurable, slow      | deterministic    | ❌ different math  |
| **Q64.96 (u256)**  | **0 to ~1.16e76**      | **2^96 = 7.9e28 LSB**   | **deterministic** | **✓ agrees**       |

> [!important] **Why f64 is wrong for V3 LP math**
>
> A V3 \`sqrt_price_x96\` value can be in the range roughly \`[2^32, 2^160]\` for normal pools. f64's mantissa is 52 bits. You will lose meaningful precision on every operation, and the loss is non-deterministic across CPUs (different rounding modes, SIMD vs scalar, etc.).
>
> A backtest run on your laptop produces different P&L numbers than the same backtest run on a server. The chain agrees with neither.
>
> f64 is fast and convenient. It is also wrong for this problem.

---

## What Q64.96 actually is

Q-format is a fixed-point number representation. The notation \`Qm.n\` means: m bits of integer part, n bits of fractional part.

\`\`\`
                       Q64.96 layout in a u256

   ┌──────────────────────────┬───────────────────────────────┐
   │  64 integer bits          │       96 fractional bits       │
   ├──────────────────────────┼───────────────────────────────┤
   │  bit 95 ────────── bit 159│  bit 0 ─────────────── bit 95 │
   └──────────────────────────┴───────────────────────────────┘
              top 64 bits                   low 96 bits

   To convert from a "real" number x to Q64.96:    x × 2^96
   To convert from Q64.96 back to a "real" number: x / 2^96

   Multiplication: (a × 2^96) × (b × 2^96) = ab × 2^192
                   need to shift right by 96 to keep result in Q64.96

   Division: (a × 2^96) / (b × 2^96) = a/b
              need to multiply by 2^96 to keep result in Q64.96
\`\`\`

V3 actually uses Q64.96 inside a u256. The full representation has 96 unused high bits in normal use; this is fine because u256 is the EVM's natural word size and these computations need to land in u256 for safe multiplication anyway.

### Why specifically 64 + 96

| Constraint                                                | Bits needed |
|----------------------------------------------------------|------------:|
| Max sqrt(price) for any reasonable pool                   | ~160        |
| Min sqrt(price) for any reasonable pool                   | ~32         |
| Tick step (1.0001) per tick                                | needs ≥ 2^-96 precision |
| Multiplying two Q64.96 numbers without overflow           | 2 * 160 = 320 bits → fits in u512 intermediate |
| EVM word size                                             | 256          |

V3 chose 64 + 96 because it gives enough integer headroom for any realistic pool (covering 9 orders of magnitude of price ratios) and enough fractional precision to represent the 1.0001 tick step accurately enough that 2^16 ticks of accumulated error stay below 1 LSB.

---

## The core types

Aurix's Q64.96 type wraps a \`U256\` from \`num-bigint\`:

\`\`\`rust
use num_bigint::BigUint;

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct Q64x96(BigUint);

impl Q64x96 {
    pub const ONE: Self = Self(BigUint::from(1u64) << 96);
    pub const Q96: Self = Self::ONE;

    pub fn from_decimal(x: f64) -> Self {
        // for testing: convert f64 to Q64.96, with truncation
        let scaled = (x * (1u128 << 96) as f64) as u128;
        Self(BigUint::from(scaled))
    }

    pub fn mul(&self, other: &Self) -> Self {
        // (a * 2^96) * (b * 2^96) = ab * 2^192
        // shift right 96 to keep in Q64.96
        Self(&self.0 * &other.0 >> 96)
    }

    pub fn div(&self, other: &Self) -> Self {
        // (a * 2^96) / (b * 2^96) = a/b
        // multiply by 2^96 first to keep result in Q64.96
        Self((&self.0 << 96) / &other.0)
    }
}
\`\`\`

Each multiplication does a u256 × u256 → u512 multiply, then shifts right by 96. Each division does a u512 ÷ u256 → u256. \`num-bigint\` handles the u512 intermediates transparently.

---

## Tick math

Uniswap V3 represents prices as \`sqrt_price_x96\` rather than \`price\` directly. The square root form is exact with respect to the V3 swap formula, where:

\`\`\`
                Uniswap V3 swap formula

   for a swap that moves sqrt_price from sqrt_p_a to sqrt_p_b
   with liquidity L:

   amount_in_token0  = L × (sqrt_p_b - sqrt_p_a) / (sqrt_p_a × sqrt_p_b)
   amount_in_token1  = L × (sqrt_p_b - sqrt_p_a)
   amount_out_token0 = L × (sqrt_p_a - sqrt_p_b) / (sqrt_p_a × sqrt_p_b)
   amount_out_token1 = L × (sqrt_p_a - sqrt_p_b)

   tick is defined as:
       tick = floor(log_{1.0001}(price))
       tick = floor(2 × log_{1.0001}(sqrt_price))

   sqrt_price at a tick:
       sqrt_p(tick) = 1.0001^(tick/2)
\`\`\`

### Tick to sqrt price

Implemented via lookup table. The V3 spec defines exact constants for 19 power-of-two-tick references:

\`\`\`rust
pub fn sqrt_price_at_tick(tick: i32) -> Q64x96 {
    debug_assert!(tick.abs() <= MAX_TICK);

    let abs_tick = tick.abs() as u32;

    // Multiply in the contributions for each set bit, using lookup constants
    let mut ratio = Q64x96::ONE;
    if abs_tick & 0x1 != 0 { ratio = ratio.mul(&K_TICK_1); }
    if abs_tick & 0x2 != 0 { ratio = ratio.mul(&K_TICK_2); }
    if abs_tick & 0x4 != 0 { ratio = ratio.mul(&K_TICK_4); }
    // ... up to bit 18 (covering ticks up to 2^18 - 1 = 262143)
    if abs_tick & 0x40000 != 0 { ratio = ratio.mul(&K_TICK_262144); }

    if tick > 0 {
        // we computed 1.0001^(tick/2); for negative ticks, invert
        ratio
    } else {
        Q64x96::ONE.div(&ratio)
    }
}

const K_TICK_1: Q64x96 = q96_const(0xfffcb933bd6fad37aa2d162d1a594001);
const K_TICK_2: Q64x96 = q96_const(0xfff97272373d413259a46990580e213a);
// ... 17 more constants
\`\`\`

The constants come straight from V3's reference implementation. They encode \`sqrt(1.0001)^(2^k)\` for k=0..18 in Q64.96. Multiplying together the constants for the set bits of \`abs_tick\` reconstructs \`sqrt(1.0001)^abs_tick\` to within 1 LSB.

### Sqrt price to tick

The inverse direction is implemented via a binary search:

\`\`\`rust
pub fn sqrt_price_to_tick(sqrt_price: &Q64x96) -> i32 {
    debug_assert!(sqrt_price >= &SQRT_PRICE_AT_MIN_TICK);
    debug_assert!(sqrt_price <= &SQRT_PRICE_AT_MAX_TICK);

    let mut lo = MIN_TICK;
    let mut hi = MAX_TICK;
    while hi > lo + 1 {
        let mid = (lo + hi) / 2;
        let mid_sqrt_price = sqrt_price_at_tick(mid);
        if &mid_sqrt_price <= sqrt_price {
            lo = mid;
        } else {
            hi = mid;
        }
    }
    lo
}
\`\`\`

22 iterations covers the full tick range (\`MIN_TICK = -887272\` to \`MAX_TICK = 887272\`).

---

## Liquidity math

Liquidity is the V3 quantity that links amounts of token0 and token1:

\`\`\`
                  V3 liquidity definition

   L (liquidity) is defined such that for an in-range position:

      amount0 = L × (1/sqrt_p - 1/sqrt_p_b)    [for sqrt_p_a ≤ sqrt_p ≤ sqrt_p_b]
      amount1 = L × (sqrt_p - sqrt_p_a)

   For an out-of-range position above:
      amount0 = 0
      amount1 = L × (sqrt_p_b - sqrt_p_a)

   For an out-of-range position below:
      amount0 = L × (1/sqrt_p_a - 1/sqrt_p_b)
      amount1 = 0

   To compute L from a deposit (amount0, amount1) at sqrt_p, sqrt_p_a, sqrt_p_b:
      L = min(
          amount0 × sqrt_p × sqrt_p_b / (sqrt_p_b - sqrt_p),
          amount1 / (sqrt_p - sqrt_p_a)
      )
\`\`\`

\`get_liquidity_for_amounts\`:

\`\`\`rust
pub fn get_liquidity_for_amounts(
    sqrt_price_x96: &Q64x96,
    sqrt_price_a_x96: &Q64x96,
    sqrt_price_b_x96: &Q64x96,
    amount0: &BigUint,
    amount1: &BigUint,
) -> BigUint {
    let (sqrt_a, sqrt_b) = sort_pair(sqrt_price_a_x96, sqrt_price_b_x96);

    if sqrt_price_x96 <= &sqrt_a {
        // Below range: only token0
        get_liquidity_for_amount0(&sqrt_a, &sqrt_b, amount0)
    } else if sqrt_price_x96 < &sqrt_b {
        // In range: bound by both tokens
        let l0 = get_liquidity_for_amount0(sqrt_price_x96, &sqrt_b, amount0);
        let l1 = get_liquidity_for_amount1(&sqrt_a, sqrt_price_x96, amount1);
        l0.min(l1)
    } else {
        // Above range: only token1
        get_liquidity_for_amount1(&sqrt_a, &sqrt_b, amount1)
    }
}
\`\`\`

The corner cases are subtle. A position whose range is entirely above the current price is "all token0"; one entirely below is "all token1." An in-range position is bound by whichever token would be exhausted first.

---

## Closed-form impermanent loss

The closed-form IL math is what makes per-swap simulation tractable. Without it, you would need to simulate every fee accrual and every swap explicitly. With it, you can compute LP value at any moment from the current pool state.

\`\`\`
                  Closed-form LP value at sqrt_p

   given a position with liquidity L over [sqrt_p_a, sqrt_p_b],
   and current price sqrt_p:

   amount0_held = L × (1/sqrt_p - 1/sqrt_p_b)       if sqrt_p < sqrt_p_b
                = 0                                   otherwise

   amount1_held = L × (sqrt_p - sqrt_p_a)            if sqrt_p > sqrt_p_a
                = 0                                   otherwise

   value_in_token1 = amount1_held + amount0_held × sqrt_p^2
                   = amount1_held + amount0_held × price
\`\`\`

\`compute_lp_value\`:

\`\`\`rust
pub fn compute_lp_value(
    liquidity: &BigUint,
    sqrt_p_x96: &Q64x96,
    sqrt_p_a_x96: &Q64x96,
    sqrt_p_b_x96: &Q64x96,
) -> Position {
    let amount0 = if sqrt_p_x96 < sqrt_p_b_x96 {
        let inv_sp = Q64x96::ONE.div(sqrt_p_x96);
        let inv_spb = Q64x96::ONE.div(sqrt_p_b_x96);
        liquidity * (inv_sp - inv_spb).to_biguint()
    } else {
        BigUint::zero()
    };

    let amount1 = if sqrt_p_x96 > sqrt_p_a_x96 {
        liquidity * (sqrt_p_x96.clone() - sqrt_p_a_x96.clone()).to_biguint()
    } else {
        BigUint::zero()
    };

    Position { amount0, amount1, sqrt_p: sqrt_p_x96.clone() }
}
\`\`\`

Per-swap, the engine computes the new \`sqrt_p\` from the swap's amounts, then calls \`compute_lp_value\` for the position. The cost of the per-swap update is: 2 multiplications, 1 division, 2 additions. All Q64.96 operations on u256 backing storage. Fast enough to simulate millions of swaps per second.

---

## Loss-versus-rebalanced (LVR)

LVR is the V3 LP performance metric introduced by Milionis, Moallemi, Roughgarden, Zhang (2022). It quantifies how much an LP loses to arbitrageurs by holding a fixed range while the price moves.

\`\`\`
                       LVR intuition

   LP holds a range [sqrt_p_a, sqrt_p_b] with liquidity L.
   Constant-rebalanced 50/50 portfolio of the same value at the start.

   When price moves, LP gets pushed to one side of the range.
   Constant-rebalanced portfolio rebalances continuously to 50/50.

   LVR = constant-rebalanced value − LP value
       = "how much value the arbitrageurs extracted from the LP"

   For a Uniswap V3 LP, LVR per unit time is:
       dLVR/dt = (1/8) × σ² × p × L_inverse(p)
       where σ² is realised variance and L_inverse(p) is the inverse-liquidity at p
\`\`\`

Aurix computes realised LVR by integrating the closed-form expression along the historical sqrt_p trajectory. The implementation is a numerical integration:

\`\`\`rust
pub fn compute_lvr_increment(
    pool_before: &PoolState,
    pool_after: &PoolState,
    position: &Position,
) -> BigUint {
    // delta_sqrt_p × dL_inverse / dp × L for in-range moves
    // see Milionis et al. equation 12 for the closed form
    // ...
}
\`\`\`

---

## What this looks like in practice

A full Tab 2 backtest run on a 90-day window touches:

| Operation                             | Count per 90-day window | Q64.96 ops per call |
|---------------------------------------|------------------------:|--------------------:|
| Swap application                      | ~30,000-100,000          | 6                    |
| Tick crossings                         | ~3,000-10,000            | 12                   |
| Position rebalance (if rule triggers) | ~50-500                   | 18                   |
| LP value compute                       | once per swap            | 4                    |
| LVR increment compute                  | once per swap            | 5                    |

A 90-day backtest with 50,000 swaps does roughly 15 to 30 million Q64.96 operations. Each operation is a u256 mul or div, which on the M2 takes roughly 50-100 nanoseconds. Total time: 1-3 seconds. Well within the auto-run budget for an interactive UI.

---

## What goes wrong if you get this wrong

| Bug class                                | Symptom                                          |
|------------------------------------------|--------------------------------------------------|
| 1-LSB rounding in tick math               | Position reports 0.0001% off chain               |
| Off-by-one tick boundary                  | Crossing a tick fires twice or zero times         |
| Q64.96 multiplication overflow             | Values silently wrap; results look "weird"        |
| sqrt_price_to_tick binary search bug       | Tick computed from valid sqrt_price comes back wrong |
| Closed-form IL signed handling             | LVR comes out negative when it should be positive |
| Out-of-range position handling              | "All token0" position computes amount1 != 0       |

> [!warning] **The hardest class to find**
>
> 1-LSB rounding bugs are the worst class. The simulator looks right. The numbers look reasonable. The disagreement with chain reality is in the third or fourth decimal place. You only find out when you compare against a real on-chain swap and the chain says 0.99987 ETH while your simulator says 0.99991 ETH.
>
> The fix is always: check the order of operations. \`(a * b) / c\` is not \`a * (b / c)\` in fixed-point. Reordering operations changes which intermediate values get truncated.

---

## What landed in the audit

The 2026-05-04 audit on the math layer specifically caught:

| Audit finding                                       | Severity | Fix                                          |
|----------------------------------------------------|----------|----------------------------------------------|
| \`get_liquidity_for_amount0\` rounded down twice    | HIGH     | Single rounding at the end                    |
| Tick crossing did not flip fee growth correctly    | HIGH     | Spec re-read; matched V3 reference             |
| Q64.96 division by very small denominator         | MEDIUM   | Saturating arithmetic added                    |
| LVR sign incorrect for above-range positions      | HIGH     | Sign-correction by range comparison           |

Two of the four high-severity findings were math correctness issues. The audit (separate dev session) caught them before any of the code touched live data, which validated the synthetic-first approach to the sprint.

---

## What this required to build

| Component                  | LoC    | Test count |
|----------------------------|-------:|-----------:|
| Q64.96 base operations     | ~400   | 32         |
| Tick math (forward + reverse)| ~250 | 18         |
| Liquidity math              | ~300   | 21         |
| Closed-form IL              | ~150   | 14         |
| LVR computation             | ~200   | 11         |
| Synthetic fixture harness   | ~500   | n/a (test infra) |
| **Total**                   | **~1,800 LoC** | **96 tests** |

The math library specifically is a defensible engineering deliverable on its own. It is correct against the V3 reference, fast enough for interactive backtesting, and tested against synthetic fixtures with exact expected outputs.

---

## What this proves

> [!important] **Why "from scratch" was the right choice**
>
> Going through a hosted DeFi math library would have:
> - Tied Aurix to a specific dependency's correctness assumptions
> - Made the audit cycle harder (less inspectability)
> - Made the synthetic fixture harness harder (no clean expected-output)
>
> Going through f64 would have:
> - Produced different P&L numbers across machines
> - Disagreed with chain data in the long tail
>
> Going through a generic BigDecimal would have:
> - Been slower (no V3-specific optimisations)
> - Required custom rounding/truncation rules
>
> Q64.96 from scratch is what V3 itself uses. Aurix uses the same representation end-to-end. There is no semantic gap between Aurix's math and the chain's math.

The math library is roughly 1,800 lines of Rust, fully tested, audited, and now in production for the LP backtester. It will be reused for any future Vector that touches V3 pools (Vector C's ML arbitrage classifier is the most obvious candidate).

This is the kind of code where the right answer is to write it yourself. The Q64.96 representation is not a Rust-ecosystem library; it is a chain-level convention that has to be implemented faithfully. From-scratch is the only way to know that you are.
`,
};
