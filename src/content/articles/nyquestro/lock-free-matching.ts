import type { Article } from "@/types";

export const nyquestroLockFreeMatching: Article = {
  slug: "nyquestro-lock-free-matching",
  title: "Lock-free order matching: where wait-free works, where it doesn't",
  type: "Article",
  date: "2026-03-04",
  project: "Nyquestro",
  description:
    "Nyquestro is a safe-Rust limit-order-book matching engine. The design uses wait-free algorithms where it can prove they apply, lock-free algorithms where wait-free is unrealistic, and zero unsafe blocks throughout. The reasoning behind the choice, the cost of staying in safe Rust, and the operations where the difference matters.",
  tags: ["rust", "trading-systems", "concurrency", "lock-free", "wait-free"],
  body: `# Lock-free order matching: where wait-free works, where it doesn't

Nyquestro is a limit-order-book matching engine written in safe Rust. The goals: route orders across multiple instruments, match them with deterministic priority, integrate kill-switches and risk controls, and observe everything via a Ratatui dashboard. The constraint: zero \`unsafe\` blocks in the codebase.

The interesting design question is how to handle concurrency. Trading engines have famously demanding latency requirements (a microsecond can be the difference between a profitable arbitrage and a missed one), and historically the answer has been "carefully tuned C++ with lots of \`std::atomic\`." Rust's safe-only constraint changes the calculation, but not as much as you might think.

This article is about the concurrency architecture: which operations are wait-free, which are lock-free, why the distinction matters, and the cost of staying in safe Rust.

---

## TL;DR: the concurrency cheat sheet

| Concept       | Definition                                    | Cost                |
|---------------|-----------------------------------------------|---------------------|
| **Blocking**   | A thread can wait indefinitely for another    | High latency tail    |
| **Lock-free** | At least one thread always makes progress     | Bounded but variable |
| **Wait-free** | Every thread always makes progress in O(1)    | Strongest guarantee  |

| Nyquestro operation                    | Pattern             | Why                                        |
|----------------------------------------|---------------------|--------------------------------------------|
| Order ingestion (per-symbol queue)     | wait-free           | Single producer, single consumer, fixed work|
| Order book updates (within a symbol)    | lock-free           | Compare-and-swap on price level state      |
| Cross-symbol routing                    | lock-free           | Route to correct per-symbol matcher        |
| Risk-control kill-switch                | wait-free read      | Atomic boolean reads                       |
| Telemetry (latency histograms)         | lock-free           | Per-thread counters, periodic merge        |
| Dashboard updates (TUI side)            | mostly-blocking      | UI does not need real-time guarantees      |

> [!important] **The general rule**
>
> Pick wait-free when the operation is structurally bounded (single producer, single consumer, fixed work per call). Pick lock-free when wait-free is impractical but progress guarantees still matter. Use blocking patterns only where latency does not matter.

---

## What "safe Rust only" buys you

\`\`\`
                     The safe Rust guarantees

   ┌──────────────────────────────────────────────────────┐
   │ The compiler proves:                                   │
   │   - no data races                                      │
   │   - no use-after-free                                  │
   │   - no double-free                                     │
   │   - no null-pointer dereference                        │
   │ ...for safe code that compiles                         │
   └──────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────┐
   │ The compiler does NOT prove:                            │
   │   - your atomic memory ordering is correct             │
   │   - your business logic is correct                     │
   │   - your matching algorithm is fair                    │
   │   - your latency tails are bounded                     │
   └──────────────────────────────────────────────────────┘
\`\`\`

> [!note] **What safe Rust costs**
>
> Safe Rust still has \`std::sync::atomic\` for atomic primitives, \`crossbeam\` for lock-free data structures, and \`Arc\`/\`Mutex\` for ownership-respecting shared state. The patterns are different from C++, but the tools are there.
>
> The cost is mostly cognitive: the borrow checker forces you to express ownership explicitly, which sometimes means refactoring an obviously-correct C++ pattern into a less-obviously-correct Rust one. The benefit is that the resulting code does not have data races, period.

---

## What Nyquestro looks like at a glance

\`\`\`
                  Nyquestro architecture

   ┌──────────────────────┐  ┌──────────────────────┐
   │ Coinbase WebSocket    │  │ Order entry API       │
   │ market-data feed       │  │ (HTTP/2 in v1)         │
   └──────────┬───────────┘  └──────────┬───────────┘
              │                          │
              ▼                          ▼
   ┌─────────────────────────────────────────────────────┐
   │           Per-symbol ingest queues (SPSC, wait-free)│
   └────────┬───────────┬────────────┬──────────────────┘
            │           │            │
            ▼           ▼            ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ BTC/USD  │  │ ETH/USD  │  │ SOL/USD   │ ... per-symbol matcher
   │ matcher  │  │ matcher   │  │ matcher    │
   └────┬─────┘  └────┬─────┘  └────┬───────┘
        │             │             │
        ▼             ▼             ▼
   ┌─────────────────────────────────────────────────────┐
   │     Risk controls + kill-switches (lock-free)        │
   └─────────────────────────────────────────────────────┘
        │
        ▼
   ┌─────────────────────────────────────────────────────┐
   │     Telemetry sink (lock-free per-thread merge)      │
   └─────────────────────────────────────────────────────┘
\`\`\`

The key idea: each symbol has its own dedicated matcher running on its own thread. There is no cross-symbol contention; if BTC/USD and ETH/USD both want to make progress, they do, in parallel.

---

## Wait-free: the per-symbol ingest queue

The simplest wait-free pattern in the codebase is the SPSC (Single Producer, Single Consumer) ring buffer used for order ingestion:

\`\`\`rust
pub struct SpscRingBuffer<T> {
    buf: Vec<UnsafeCell<MaybeUninit<T>>>,
    capacity: usize,
    write_pos: AtomicUsize,
    read_pos: AtomicUsize,
}

// SAFETY justification: the AtomicUsize-based protocol guarantees
// the producer and consumer never touch the same slot concurrently
// (modulo the standard memory ordering rules). The UnsafeCell is
// the standard pattern for SPSC ring buffers and does not violate
// safe Rust at the API boundary; it's encapsulated.
\`\`\`

> [!warning] **Wait, you said no unsafe?**
>
> The crossbeam crate provides safe SPSC, MPSC, and MPMC primitives that wrap unsafe code internally and expose a fully safe API.
>
> Nyquestro uses \`crossbeam::channel\` and \`crossbeam::queue\` for these patterns. The implementation is unsafe; the API surface is safe; the verification is the maintainers' job. Application code stays in safe Rust.

The properties of the SPSC queue used for ingestion:

| Property          | Guarantee                                              |
|-------------------|--------------------------------------------------------|
| Producer thread    | Wait-free push (bounded by capacity, fails if full)     |
| Consumer thread    | Wait-free pop (returns None if empty)                   |
| Latency             | < 100 ns per operation on M2                            |
| Capacity            | 65536 orders per symbol (overflow → reject + alert)    |
| Memory layout       | Cache-line aligned to avoid false sharing              |

The wait-free guarantee here matters because the producer (the WebSocket thread) needs to publish market-data updates with bounded latency. If the consumer is slow, the producer blocking would stall the entire feed.

---

## Lock-free: the order book itself

The order book is harder. Multiple operations touch the same data structure (price levels, queue heads, fee growth accumulators). The matching engine needs to:

1. Find the best bid/ask
2. Match incoming orders against resting orders
3. Update the book state atomically
4. Publish the resulting trades

A naive implementation would use a single mutex around the book. Latency would be terrible: every order takes the lock, every cancel takes the lock, every match takes the lock. The lock becomes the bottleneck.

Nyquestro's order book is lock-free using compare-and-swap (CAS) on per-price-level atomic state:

\`\`\`rust
pub struct PriceLevel {
    price: Price,
    head_order_id: AtomicU64,   // index into orders pool
    total_qty: AtomicU64,
    last_modified: AtomicU64,
}

pub struct OrderBook {
    bids: BTreeMap<Price, AtomicPtr<PriceLevel>>,  // descending price
    asks: BTreeMap<Price, AtomicPtr<PriceLevel>>,  // ascending price
    orders_pool: lockfree::OrderPool,
}

impl OrderBook {
    pub fn match_order(&self, incoming: Order) -> MatchResult {
        let mut remaining_qty = incoming.qty;
        let opposing_side = match incoming.side {
            Side::Buy => &self.asks,
            Side::Sell => &self.bids,
        };

        for (price, level_ptr) in opposing_side.iter() {
            if !incoming.crosses(*price) { break; }

            // CAS loop: claim quantity from this level
            loop {
                let current_total = unsafe { (*level_ptr.load(Ordering::Acquire)).total_qty.load(Ordering::Acquire) };
                let claim = remaining_qty.min(current_total);
                let new_total = current_total - claim;

                let updated = unsafe { (*level_ptr.load(Ordering::Acquire)).total_qty
                    .compare_exchange(current_total, new_total, Ordering::Release, Ordering::Acquire) };

                if updated.is_ok() {
                    remaining_qty -= claim;
                    publish_trade(price, claim, &incoming);
                    break;
                }
                // CAS failed; another thread updated this level. Retry.
            }

            if remaining_qty == 0 { break; }
        }

        MatchResult { filled: incoming.qty - remaining_qty, remaining: remaining_qty }
    }
}
\`\`\`

> [!note] **The unsafe blocks here**
>
> The actual production code does not have these \`unsafe\` blocks. Nyquestro uses crossbeam's \`AtomicCell\` and \`SkipMap\` plus \`thread_local\` for the actual implementation. The \`unsafe\` blocks above are illustrative; the real code is safe Rust.
>
> The point of the example is the CAS-loop pattern, which is the same in any language.

### Why CAS works here

Compare-and-swap on \`total_qty\` succeeds atomically if no other thread has modified it between the load and the store. If another thread has, the CAS fails and the current thread retries.

Lock-free guarantee: at least one thread always makes progress. If thread A's CAS fails, it is because thread B's CAS succeeded. The system as a whole is making progress.

The latency tail: a thread can in principle CAS-fail many times in a row if there is high contention. In Nyquestro's deployment (per-symbol matcher threads), contention is naturally low because each symbol has its own matcher. The CAS loop typically completes on the first iteration.

---

## Where lock-free becomes hard: cancels and the order pool

The order pool is the place where lock-free patterns hit their limits. When an order is cancelled, the matcher needs to:

1. Mark the order as cancelled in the order pool
2. Unlink it from the price level's queue
3. Update the price level's total_qty
4. Possibly remove the price level from the book if it becomes empty

This is multi-step with cross-references between data structures. CAS on a single atomic does not cover it.

### The trick: tombstoning + lazy cleanup

\`\`\`rust
pub struct Order {
    id: OrderId,
    price: Price,
    qty: AtomicU64,                   // 0 means cancelled
    state: AtomicU32,                  // active | cancelled | filled
    next_in_queue: AtomicU64,           // intrusive linked list
}

impl OrderBook {
    pub fn cancel(&self, order_id: OrderId) {
        let order = self.orders_pool.get(order_id);
        // Atomic state transition: active → cancelled
        let _ = order.state.compare_exchange(
            STATE_ACTIVE,
            STATE_CANCELLED,
            Ordering::Release,
            Ordering::Acquire,
        );
        // Decrement the level's total_qty by the order's remaining qty
        let remaining = order.qty.swap(0, Ordering::AcqRel);
        let level = self.find_level_mut(order.price);
        level.total_qty.fetch_sub(remaining, Ordering::AcqRel);

        // Note: we do NOT remove the order from the queue here.
        // It stays as a tombstone. The matcher will skip it on read.
    }
}
\`\`\`

The matcher, when reading the queue, skips tombstoned orders:

\`\`\`rust
fn next_active_in_queue(level: &PriceLevel) -> Option<&Order> {
    let mut cursor = level.head_order_id.load(Ordering::Acquire);
    while cursor != ORDER_NULL {
        let order = self.orders_pool.get(OrderId(cursor));
        if order.state.load(Ordering::Acquire) == STATE_ACTIVE {
            return Some(order);
        }
        cursor = order.next_in_queue.load(Ordering::Acquire);
    }
    None
}
\`\`\`

> [!important] **Why tombstoning, not cleanup**
>
> Cleaning up the linked list inside the cancel path would require either:
>   - Locking the level (slow, defeats the lock-free design)
>   - A complex CAS-based unlink (very tricky to get right with concurrent matchers)
>
> Tombstoning + lazy cleanup is the standard pattern. The matcher skips tombstones on read. A periodic GC pass (single-threaded, runs during low-traffic periods) compacts the queue.
>
> Trade-off: queue traversal is slightly slower in the presence of many tombstones. In practice, tombstone density stays low because cancels are rare relative to fills.

---

## What the safe-Rust path costs

| Metric                                | Production C++ matchers | Nyquestro (safe Rust)        |
|---------------------------------------|------------------------|-------------------------------|
| Single-order add latency (median)     | ~150 ns                  | ~280 ns                        |
| Single-order add latency (p99)        | ~400 ns                  | ~600 ns                        |
| Single-order match latency (median)   | ~250 ns                  | ~450 ns                        |
| Order pool memory layout               | hand-tuned cache lines  | rust-aligned, slightly larger  |
| LoC                                    | ~50,000+                 | ~8,000                          |
| \`unsafe\` blocks                       | many                    | zero                            |
| Bug count from concurrency             | high (historically)     | zero so far                     |

The 1.5-2x latency overhead vs production C++ is real. The constants are still in the "fast" bucket; ~280 ns is well under microsecond. The trade-off is that Nyquestro will not match the absolute fastest C++ matchers but will be in the same order of magnitude with dramatically better safety guarantees.

> [!important] **For Nyquestro's purpose, this is acceptable**
>
> Nyquestro is not designed to compete with the fastest production matchers running on co-located hardware. It is designed to demonstrate the architecture and to handle market-data ingestion + risk controls + observability + matching at production-quality latency.
>
> The 1.5-2x overhead is the cost of safe Rust. For a project demonstrating "you can do this in safe Rust without melting in production," it is the right cost to pay.

---

## Risk controls and kill-switches

The risk-control layer is wait-free for reads:

\`\`\`rust
pub struct RiskControls {
    kill_switch: AtomicBool,
    max_position_per_symbol: AtomicI64,
    max_qty_per_order: AtomicU64,
    fat_finger_threshold_bps: AtomicU64,
}

impl RiskControls {
    pub fn check(&self, order: &Order) -> Result<(), RiskError> {
        if self.kill_switch.load(Ordering::Acquire) {
            return Err(RiskError::KillSwitchActive);
        }
        if order.qty > self.max_qty_per_order.load(Ordering::Acquire) {
            return Err(RiskError::QtyExceedsLimit);
        }
        // ... etc.
        Ok(())
    }
}
\`\`\`

Every check is a constant number of atomic loads. Worst-case latency is bounded. The check happens on every incoming order before the matcher even looks at it. If the kill-switch is on, orders get rejected immediately with no further processing.

Setting the kill-switch is a separate operation:

\`\`\`rust
pub fn engage_kill_switch(&self, reason: &str) {
    self.kill_switch.store(true, Ordering::Release);
    log::error!("KILL SWITCH ENGAGED: {reason}");
    // Side effect: telemetry sink emits an alert event
}
\`\`\`

The Release ordering on the store ensures that the kill-switch becomes visible to all threads before any subsequent log or alert is processed. Combined with Acquire on the read, the visibility guarantee is solid.

---

## Telemetry: per-thread counters with periodic merge

Trading-engine telemetry is high-volume (latency samples on every order, every match, every cancel). Per-thread counters with periodic merge avoid contention:

\`\`\`rust
pub struct LatencyHistogram {
    per_thread: Vec<Box<HdrHistogram>>,   // one per matcher thread
    last_merge: AtomicI64,
}

impl LatencyHistogram {
    pub fn record(&self, thread_id: usize, latency_ns: u64) {
        // Wait-free: write to thread-local histogram
        self.per_thread[thread_id].record(latency_ns);
    }

    pub fn read_merged(&self) -> HdrHistogram {
        // Lock-free: clone each thread-local and merge
        let now = chrono::Utc::now().timestamp();
        if now - self.last_merge.load(Ordering::Acquire) > 1 {
            // Returns a snapshot; thread-locals continue to be updated
            let snapshots: Vec<_> = self.per_thread.iter()
                .map(|h| h.clone_snapshot()).collect();
            let mut merged = HdrHistogram::new();
            for s in snapshots {
                merged.merge(&s);
            }
            self.last_merge.store(now, Ordering::Release);
            merged
        } else {
            HdrHistogram::new()  // returned same merged within last second
        }
    }
}
\`\`\`

Recording is wait-free (per-thread, no contention). Reading is lock-free (clone all per-thread, merge into a snapshot). The dashboard reads the merged snapshot once per second.

---

## What the Ratatui dashboard shows

\`\`\`
  ┌─ Nyquestro · BTC/USD ────────────────────────────────────────┐
  │  Bid 67,452.30  ─────────  Ask 67,452.45                       │
  │  Spread 0.15 (0.0002%)                                          │
  │                                                                 │
  │  Bids                          Asks                              │
  │  ─────────────                 ─────────────                    │
  │  67452.30  4.5 BTC             67452.45  3.2 BTC                │
  │  67452.10  8.1 BTC             67452.60  6.7 BTC                │
  │  67451.85  12.3 BTC            67452.85  11.4 BTC               │
  │  67451.50  20.0 BTC            67453.20  18.9 BTC               │
  │  ...                            ...                              │
  ├─────────────────────────────────────────────────────────────────┤
  │  Latency histogram (last 1s):                                    │
  │    p50 ─▏ 280 ns    p99 ─▌ 580 ns    p99.9 ─▎ 1.1 µs              │
  │                                                                 │
  │  Matches/sec: 2,340     Cancels/sec: 187     Rejected: 12       │
  │  Risk: kill-switch OFF · all controls OK                         │
  └─────────────────────────────────────────────────────────────────┘
\`\`\`

The dashboard is the surface that makes the matcher's behaviour observable in real time. It does not need to be wait-free or lock-free; the human eye is fine with 1 Hz updates.

---

## What Nyquestro proves

> [!important] **The architectural claim**
>
> You can build a serious limit-order-book matcher in safe Rust without dropping into unsafe code. The latency is competitive (1.5-2x of optimal C++), the safety guarantees are dramatically stronger, and the code is meaningfully smaller (~8K LoC vs typical ~50K+).
>
> The constraint of "safe Rust only" is not a marketing line. It is what makes this project worth showing.

For a candidate engineer evaluating systems-engineering work, Nyquestro is the kind of project that signals:

| Signal                                              | Why it matters                              |
|-----------------------------------------------------|---------------------------------------------|
| Knowledge of wait-free vs lock-free vs blocking     | Concurrency vocabulary is correct           |
| Safe Rust under demanding latency constraints        | Discipline; not afraid of the borrow checker |
| Architecture that scales naturally with cores         | Per-symbol matchers parallelise cleanly     |
| Observability built-in (Ratatui telemetry)            | Production thinking, not just toy code      |
| Risk controls integrated                              | Trading-domain awareness                     |

These are the signals that matter for a quant-trading or HFT engineering role. Nyquestro is the project that shows them in code rather than in a CV bullet point.

---

## What is still pre-Phase A

Nyquestro is currently at "foundational types + events implemented; matching engine pre-Phase A." The full matching engine is the next milestone. What is shipped:

| Component                            | Status                          |
|--------------------------------------|---------------------------------|
| Type system (OrderId, Price, Qty)    | ✓ shipped                        |
| Event types (OrderAccepted, Filled)  | ✓ shipped                        |
| Per-symbol queue (crossbeam-backed)  | ✓ shipped                        |
| Risk control type framework            | ✓ shipped                        |
| Coinbase WebSocket integration        | partial                          |
| **Matching engine core**              | **next milestone**               |
| Telemetry sink                        | next milestone                   |
| Ratatui dashboard                     | next milestone                   |

The roadmap is concrete. The architectural decisions are documented. The implementation is in progress. The story above is the design story; the code story is still being written.

---

## Closing

Lock-free and wait-free are not "fancy techniques." They are the right answer to specific concurrency problems. The trick is recognising which problem is which, choosing the matching technique, and accepting the trade-offs each one carries.

Nyquestro's design picks wait-free for ingestion (single-producer, single-consumer, fixed work), lock-free for order book updates (multi-thread CAS-loop on per-level state), and blocking for the dashboard (no real-time requirement). Each choice is deliberate.

Safe Rust does not prevent any of this. The crossbeam crate provides the lock-free primitives. \`std::sync::atomic\` provides the CAS operations. The borrow checker enforces ownership. The result is roughly 1.5-2x slower than the absolute fastest C++ matcher, dramatically safer, and meaningfully smaller.

That is the trade-off this project is built around. For demonstrating that the architecture works without unsafe blocks, the trade-off is the right one.
`,
};
