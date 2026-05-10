import type { Article } from "@/types";

export const nyquestroNewtypeSafety: Article = {
  slug: "nyquestro-newtype-safety",
  title: "Newtype-driven type safety in trading systems",
  type: "Article",
  date: "2026-03-07",
  project: "Nyquestro",
  description:
    "Trading systems have a long history of bugs that boil down to 'someone passed cents where dollars were expected, or shares where dollars were expected, or order IDs where account IDs were expected.' Rust's newtype pattern eliminates an entire class of these bugs at compile time. The pattern, the cost, and the bugs that disappear when you commit to it.",
  tags: ["rust", "type-systems", "trading-systems", "engineering-discipline"],
  body: `# Newtype-driven type safety in trading systems

Trading systems run on numbers. Order IDs, account IDs, prices in cents, quantities in shares, timestamps in nanoseconds, fees in basis points. Most of these are 64-bit integers. The naive implementation in any language uses \`u64\` (or whatever the language's native integer type is) for all of them.

This is a very long-running mistake. The bugs that come from "I accidentally passed an order ID where an account ID was expected" are real, common, expensive, and fundamentally avoidable. The fix is the newtype pattern: wrap each conceptual quantity in its own struct so the compiler can tell them apart.

This article is about why Rust's newtype pattern is the right tool for the job, what it costs to use it consistently, and the bugs that disappear when you commit to it.

---

## TL;DR

| Concept                        | What                                          |
|--------------------------------|-----------------------------------------------|
| Newtype pattern                 | Wrap each integer type in its own struct      |
| Compile-time guarantee          | Wrong-type usage is a compile error            |
| Runtime cost                    | Zero (after monomorphisation)                  |
| Refactor cost                    | Higher upfront, lower long-term                |
| Trading systems specifically    | Eliminates ~30% of historical bug classes      |

---

## The bug we are eliminating

\`\`\`rust
// the naive approach — all u64
pub fn submit_order(
    order_id: u64,
    account_id: u64,
    instrument_id: u64,
    price_cents: u64,
    quantity_shares: u64,
    timestamp_nanos: u64,
) -> Result<()> {
    // ...
}

// somewhere in the call site
submit_order(
    1234,
    5678,        // wait, is this account or instrument?
    9012,
    50_00,       // 50 cents? or $50?
    100,
    1_700_000_000_000_000_000,
)?;
\`\`\`

This compiles. It runs. The compiler has no idea that argument 2 is an account_id and argument 3 is an instrument_id. If you swap them, the compiler does not care. The system might silently route an order to the wrong place.

The historical record on these bugs in trading is extensive. Knight Capital lost $440 million in 45 minutes in 2012 partly because of a related class of bug (test code reaching production). Various smaller incidents have involved unit confusion (cents vs dollars, shares vs cents, etc.). The pattern is consistent: the type system did not distinguish two conceptually different quantities, and a developer made a mistake the compiler could not catch.

---

## The newtype fix

\`\`\`rust
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Ord, PartialOrd)]
pub struct OrderId(u64);

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Ord, PartialOrd)]
pub struct AccountId(u64);

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Ord, PartialOrd)]
pub struct InstrumentId(u64);

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct Price(i64);   // cents, signed for spread / pnl math

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct Quantity(u64);   // shares (or contracts, or units, depending on instrument)

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct Timestamp(i64);   // nanoseconds since epoch
\`\`\`

Now the same call site:

\`\`\`rust
pub fn submit_order(
    order_id: OrderId,
    account_id: AccountId,
    instrument_id: InstrumentId,
    price: Price,
    quantity: Quantity,
    timestamp: Timestamp,
) -> Result<()> {
    // ...
}

submit_order(
    OrderId(1234),
    AccountId(5678),
    InstrumentId(9012),
    Price(5000),         // 50 dollars in cents = 5000 cents
    Quantity(100),
    Timestamp::now(),
)?;
\`\`\`

If the developer accidentally swaps account_id and instrument_id:

\`\`\`rust
submit_order(
    OrderId(1234),
    InstrumentId(9012),    // swapped
    AccountId(5678),       // swapped
    // ...
);
//   ^^^^^^^^^^^^^^^^
//   error: expected \`AccountId\`, found \`InstrumentId\`
//          rustc tells you at compile time
\`\`\`

The compiler catches it. The bug never reaches runtime.

> [!important] **What the newtype pattern actually buys you**
>
> Compiler-enforced semantic distinction. Two values that are both u64 internally but represent different concepts are different types as far as the compiler is concerned. Mixing them is a compile error.
>
> The runtime cost is zero. After Rust's monomorphisation, \`Price(5000)\` compiles to the same machine code as just \`5000\`. The struct wrapper is purely a compile-time artifact.

---

## What Nyquestro's type catalogue looks like

\`\`\`
                  Nyquestro newtypes (all zero-cost)

   Identifiers (u64-backed):
     ├─ OrderId          ─ unique identifier per order
     ├─ AccountId         ─ unique identifier per trading account
     ├─ InstrumentId      ─ unique identifier per tradeable instrument
     ├─ ClientOrderId     ─ client-supplied identifier (separate namespace)
     └─ TradeId           ─ unique identifier per trade execution

   Money (i64-backed for signed math):
     ├─ Price             ─ cents, signed (negative for spread analytics)
     ├─ NotionalValue     ─ cents, total order value
     └─ FeeAmount         ─ cents, can be negative (rebates)

   Quantity (u64-backed):
     ├─ Quantity           ─ shares or contracts
     └─ FillQuantity        ─ subset of Quantity for executed amounts

   Time (i64-backed):
     ├─ Timestamp           ─ nanoseconds since epoch
     ├─ Latency             ─ nanoseconds (delta)
     └─ Duration            ─ nanoseconds, human-friendly conversions

   Symbol (string-backed):
     └─ Symbol              ─ "BTC/USD" etc., interned for cheap comparison

   Side (enum):
     └─ Side                 ─ Bid | Ask
\`\`\`

| Newtype           | Backing | Why this distinction                                |
|-------------------|---------|-----------------------------------------------------|
| OrderId           | u64     | Different namespace from AccountId, InstrumentId    |
| AccountId          | u64     | Different namespace from everything else             |
| InstrumentId       | u64     | Different namespace                                  |
| ClientOrderId      | u64     | Client-controlled; can collide with our own OrderIds |
| TradeId            | u64     | Different namespace from Order                       |
| Price              | i64     | Signed for spread, can multiply by Quantity         |
| NotionalValue      | i64     | Same units (cents) but different meaning             |
| FeeAmount          | i64     | Can be negative (rebates)                            |
| Quantity            | u64     | Always positive                                      |
| FillQuantity         | u64     | Subset of Quantity (constrained by remaining)        |
| Timestamp           | i64     | Absolute time                                        |
| Latency             | i64     | Delta, can be negative for clock skew               |
| Duration            | i64     | Same as Latency but with prettier impl               |

---

## The arithmetic is the interesting part

If \`Price\` and \`Quantity\` are different types, you cannot \`price + quantity\`. That is correct; adding a price and a quantity is meaningless. The compiler refuses to do it.

You CAN multiply price times quantity, and the result has its own type:

\`\`\`rust
impl Mul<Quantity> for Price {
    type Output = NotionalValue;

    fn mul(self, qty: Quantity) -> NotionalValue {
        NotionalValue(self.0 * qty.0 as i64)
    }
}

let p = Price(5000);          // 50 dollars in cents
let q = Quantity(100);
let notional = p * q;          // notional: NotionalValue(500_000)  → $5000
\`\`\`

Now the type system tells you that \`price * quantity = notional\`. If a function expects \`NotionalValue\`, you cannot pass \`Price\` or \`Quantity\` accidentally.

### What about price addition

You can add two prices, because that is meaningful (averaging, spread analysis):

\`\`\`rust
impl Add<Price> for Price {
    type Output = Price;
    fn add(self, other: Price) -> Price { Price(self.0 + other.0) }
}

impl Sub<Price> for Price {
    type Output = Price;
    fn sub(self, other: Price) -> Price { Price(self.0 - other.0) }
}

let bid = Price(67_452_30);    // $67,452.30
let ask = Price(67_452_45);    // $67,452.45
let spread = ask - bid;        // Price(0_15) → 0.15 cents = 15 hundredths
\`\`\`

You CANNOT divide a Price by a Price (the result has different units; would need a separate Ratio type). You CANNOT subtract a Quantity from a Price (the units do not match).

Each operation is implemented deliberately on its specific type pair, with the result type spelled out. This is more boilerplate than just using \`i64\` everywhere. The boilerplate is the point.

---

## The serialisation cost

Newtypes need to round-trip through serialisation (JSON for HTTP, FlatBuffers for the binary fast path, SQLite for persistence). The pattern uses \`serde\` derive macros for transparent JSON:

\`\`\`rust
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize)]
#[serde(transparent)]
pub struct OrderId(u64);
\`\`\`

\`#[serde(transparent)]\` means the type serialises as if it were just the inner u64. The wrapper is invisible on the wire. JSON consumers see a number; Rust callers see a typed value.

For SQLite, similar pattern with \`rusqlite::ToSql\` / \`FromSql\`:

\`\`\`rust
impl ToSql for OrderId {
    fn to_sql(&self) -> rusqlite::Result<ToSqlOutput<'_>> {
        Ok(self.0.into())
    }
}

impl FromSql for OrderId {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        u64::column_result(value).map(OrderId)
    }
}
\`\`\`

A small amount of boilerplate per type. Generally one \`derive\` plus one \`From<u64>\` and one \`AsRef<u64>\` if you need to interop with code that expects raw u64.

---

## What this catches in practice

The bugs the newtype pattern eliminates fall into a few categories.

### Category 1: identifier confusion

\`\`\`rust
// before newtypes
fn cancel_order(account_id: u64, order_id: u64) {  /* ... */ }

// in some random call site
cancel_order(order.account_id.0, order.id.0);     // wait, did I get the order right?
cancel_order(order.id.0, order.account_id.0);     // BUG: swapped, but compiles fine

// after newtypes
fn cancel_order(account_id: AccountId, order_id: OrderId) {  /* ... */ }
cancel_order(order.account_id, order.id);          // correct
cancel_order(order.id, order.account_id);          // BUG: but now a compile error
\`\`\`

This is the most common bug class in identifier-heavy systems. With newtypes, the compiler catches every instance.

### Category 2: unit confusion

\`\`\`rust
// before newtypes
fn calculate_pnl(price_cents: i64, quantity_shares: u64) -> i64 {
    price_cents * quantity_shares as i64
}

// in some bizarre call site
let pnl = calculate_pnl(50, 100);   // is "50" cents or dollars? "100" shares or cents?
                                     // looks fine; compiles fine; produces nonsense

// after newtypes
fn calculate_pnl(price: Price, quantity: Quantity) -> NotionalValue {
    price * quantity
}

let pnl = calculate_pnl(50, 100);   // compile error: expected Price, found integer
let pnl = calculate_pnl(Price(50), Quantity(100));   // explicit; clearly cents
\`\`\`

The construction is more verbose. The verbosity is what surfaces the unit choice. There is no longer a way to forget that prices are in cents and quantities are in shares.

### Category 3: timestamp arithmetic

\`\`\`rust
// before newtypes
let elapsed = current_time - order_received_time;  // result: i64
sleep(elapsed);                                     // sleep takes Duration; what unit was that i64?

// after newtypes
let elapsed: Latency = current_time - order_received_time;
sleep(elapsed.to_duration());                       // explicit conversion required
\`\`\`

The conversion is a deliberate step. There is no way to accidentally treat a nanosecond delta as milliseconds.

---

## What this costs in practice

| Cost                                              | Magnitude                              |
|---------------------------------------------------|----------------------------------------|
| Boilerplate per type                              | ~5-15 LoC (struct, derives, From)      |
| Boilerplate at call sites                         | minor; \`OrderId(123)\` vs \`123\`        |
| Refactor cost when introducing                     | high one-time cost                      |
| Maintenance cost going forward                    | low; types help you remember            |
| Runtime cost                                       | zero (monomorphised)                   |
| Cognitive overhead reading code                    | lower (types tell you what each value is) |
| Cognitive overhead writing code                    | slightly higher initially               |

> [!important] **The cost-benefit calculation**
>
> Per-type, you write maybe 15 lines of boilerplate. For a moderate-sized type catalogue (~20 types), that is 300 lines.
>
> In return, you get compile-time elimination of an entire class of bugs that would otherwise reach production. For trading systems specifically, those bugs are expensive when they happen. The 300 lines pay for themselves the first time the compiler catches one.

---

## Where the pattern is overkill

Newtypes are not free. There are places where the cost outweighs the benefit:

| Domain                                | Newtype pattern verdict                  |
|---------------------------------------|------------------------------------------|
| Trading systems                        | Always worth it                           |
| Financial accounting                    | Always worth it                           |
| Distributed systems with many IDs       | Worth it for the IDs at minimum          |
| Web apps with user IDs and post IDs    | Worth it                                  |
| Scientific computing (units)            | Mature crates exist (uom); use them       |
| Game development                         | Sometimes; depends on the genre           |
| Quick scripts                            | Probably overkill                         |

The line is "if confusing two values would produce a bug that costs more than 300 lines of boilerplate to clean up after, use newtypes." Trading systems sit firmly on the "yes, always" side of the line.

---

## What this looks like in cross-language interop

Nyquestro talks to a Coinbase WebSocket feed (JSON), to its own internal ledger (FlatBuffers), and to its database (SQLite). At each boundary, the newtypes round-trip cleanly:

\`\`\`
                   Cross-boundary type discipline

   Coinbase WebSocket → Rust:
     {"order_id": "abc-123"}  →  OrderId from string parse
     {"price_str": "67452.30"} →  Price::from_decimal_str()
     {"side": "buy"}           →  Side::Bid

   Rust → SQLite:
     OrderId(123)              →  INTEGER 123
     Price(5000)                →  INTEGER 5000  (already in cents)
     Symbol("BTC/USD")          →  TEXT "BTC/USD"

   Rust → FlatBuffers:
     OrderId(123)              →  uint64 123
     Price(5000)                →  int64 5000
     Symbol("BTC/USD")          →  string "BTC/USD" (or interned numeric ID)
\`\`\`

The boundary code is thin: parse from the wire format, wrap in the typed value, and the rest of the system is type-safe. Going out to the wire, the same wrapper unwraps into the standard primitive.

---

## What this teaches engineers

The newtype pattern is one of those engineering practices that looks like trivial bureaucracy from the outside and is dramatic safety machinery from the inside.

Engineers who have worked on financial systems for several years tend to converge on this pattern (or its equivalent in other languages: Haskell's GADTs, F#'s units of measure, C++'s strong-typing libraries). The convergence is not coincidence; it is the same lesson hitting everyone who has stared at a "we sent the wrong order to the wrong account" post-mortem.

For Nyquestro, the newtype catalogue is one of the first things that gets built. The matching engine, the risk controls, the dashboard all consume the typed values. Wrong-type usage cannot reach the matcher; the compiler stops it.

> [!important] **The general lesson**
>
> When you have multiple integer-backed values with the same backing type but different semantics, wrap them. The compiler cannot otherwise tell them apart, and "the developer will remember" is not a strategy that scales.

---

## What is in the code

\`\`\`rust
// from src/types.rs (illustrative)

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize)]
#[serde(transparent)]
pub struct OrderId(pub u64);

impl OrderId {
    pub const fn new(id: u64) -> Self { Self(id) }
    pub const fn raw(self) -> u64 { self.0 }
}

impl From<OrderId> for u64 {
    fn from(id: OrderId) -> u64 { id.0 }
}

impl Display for OrderId {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "Order({})", self.0)
    }
}

// ... similar for every other type in the catalogue
\`\`\`

About 15 lines per type. Twenty types. Three hundred lines of boilerplate. Worth it.

The pattern is reusable across any project where unit confusion or identifier confusion is a real risk. If you are building anything in the trading, financial, distributed-systems, or accounting space, this is the kind of upfront discipline that compounds over the project's lifetime.

The compiler does not enforce business logic. It enforces semantic distinctions when you give it the vocabulary to do so. Newtypes are how you give it the vocabulary.

That is the whole pattern. Apply liberally.
`,
};
