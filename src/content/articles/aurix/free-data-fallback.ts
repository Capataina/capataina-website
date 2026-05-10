import type { Article } from "@/types";

export const aurixFreeDataFallback: Article = {
  slug: "aurix-free-data-fallback",
  title: "4-tier free-data fallback: building DeFi analytics with zero paid APIs",
  type: "Article",
  date: "2026-05-06",
  project: "Aurix",
  description:
    "Aurix runs a serious DeFi analytics tool with no paid APIs. The architecture is a four-tier data-source fallback chain that pulls from free RPC endpoints, hosted subgraphs, public archive nodes, and falls back to deterministic mocks for testing. The trick that makes it work, and the silent-fallthrough trap that can hide a broken integration.",
  tags: ["rust", "defi", "infrastructure", "tauri"],
  body: `# 4-tier free-data fallback: building DeFi analytics with zero paid APIs

Aurix is a desktop DeFi analytics application. It does cross-DEX arbitrage detection, Uniswap V3 LP backtesting, and (eventually) wallet position tracking, gas intelligence, and quantitative risk modelling. The "value proposition" line on the README is unusual:

> Local-first. Zero-cost. Read-only.

The "zero-cost" part is architecturally load-bearing. Aurix runs without any paid API keys. No Alchemy Pro, no Infura paid tier, no Moralis subscription, no The Graph hosted service paid plan, no DefiLlama Pro, nothing. Free tiers and public endpoints, all the way down.

This is harder than it looks. Free public RPC endpoints rate-limit aggressively. Hosted subgraphs are deprecating their free tiers. Mock data is fine for tests but useless for actual analysis.

The architecture that holds this together is a four-tier data-source fallback chain. This article is about how it is built, what failure modes it handles, and the silent-fallthrough trap that can hide a broken integration for weeks.

---

## TL;DR

| Tier | Source                          | Cost     | Reliability | Throughput  |
|------|---------------------------------|----------|-------------|-------------|
| 1    | Alchemy free tier (300M CU/mo)  | free     | high        | medium      |
| 2    | Uniswap V3 hosted subgraph      | free     | medium      | high        |
| 3    | Public RPC (LlamaRPC etc.)      | free     | low         | low         |
| 4    | MockArchiveSource (test fixtures)| free    | n/a (mock)  | infinite    |

Tier 1 is the primary. Tier 2 is the fallback for endpoint methods Alchemy does not expose. Tier 3 is the panic fallback for total Tier 1+2 failure. Tier 4 is for tests and for offline development.

---

## The architecture

\`\`\`
                  Aurix data source resolution

   client request: "give me the swap log at block 18342111"
        │
        ▼
   ┌──────────────────────┐
   │ ArchiveSource trait   │  ← uniform interface across all 4 tiers
   └──────────┬───────────┘
              │
              ▼ try in priority order
   ┌──────────────────────┐
   │ T1: Alchemy           │ ─▶ ✓ returns log     (success)
   │     free tier         │     ┌─────────────┐
   └──────────┬───────────┘     │ persisted   │
              │ failure          │ to SQLite   │
              ▼                  └─────────────┘
   ┌──────────────────────┐
   │ T2: Uniswap subgraph  │ ─▶ ✓ returns log     (fallback succeeded)
   └──────────┬───────────┘
              │ failure
              ▼
   ┌──────────────────────┐
   │ T3: Public RPC        │ ─▶ ✓ returns log     (panic fallback succeeded)
   └──────────┬───────────┘
              │ failure
              ▼
   ┌──────────────────────┐
   │ T4: MockArchiveSource │ ─▶ ✓ returns synthetic log
   │     (test only)       │     (only if AURIX_MOCK=1)
   └──────────────────────┘
\`\`\`

Tier 4 is excluded from the production fallback chain by default. It only activates when \`AURIX_MOCK=1\` is set in the environment. The reason: silent fallthrough to mock data in production would silently destroy analysis correctness. Better to fail loud.

---

## The trait that makes it work

\`\`\`rust
#[async_trait]
pub trait ArchiveSource: Send + Sync {
    async fn fetch_pool_snapshot(&self, pool: Address, block: u64) -> Result<PoolSnapshot>;
    async fn fetch_swaps(&self, pool: Address, from: u64, to: u64) -> Result<Vec<Swap>>;
    async fn fetch_mints(&self, pool: Address, from: u64, to: u64) -> Result<Vec<Mint>>;
    async fn fetch_burns(&self, pool: Address, from: u64, to: u64) -> Result<Vec<Burn>>;

    fn name(&self) -> &str;
    fn priority(&self) -> u8;  // lower = higher priority
}

pub struct AlchemyArchiveSource { /* api key, http client */ }
pub struct UniswapV3SubgraphSource { /* http client, cached graphql query */ }
pub struct PublicRpcSource { /* fallback rpc list */ }
pub struct MockArchiveSource { /* deterministic fixture data */ }

#[async_trait]
impl ArchiveSource for AlchemyArchiveSource { /* ... */ }
#[async_trait]
impl ArchiveSource for UniswapV3SubgraphSource { /* ... */ }
#[async_trait]
impl ArchiveSource for PublicRpcSource { /* ... */ }
#[async_trait]
impl ArchiveSource for MockArchiveSource { /* ... */ }
\`\`\`

The dispatcher walks them in priority order:

\`\`\`rust
pub struct SourceDispatcher {
    sources: Vec<Box<dyn ArchiveSource>>,
}

impl SourceDispatcher {
    pub async fn fetch_pool_snapshot(
        &self,
        pool: Address,
        block: u64,
    ) -> Result<PoolSnapshot> {
        let mut last_error = None;
        for source in &self.sources {
            match source.fetch_pool_snapshot(pool, block).await {
                Ok(snap) => {
                    tracing::info!(
                        target: "aurix.ingest",
                        source = source.name(),
                        block,
                        "fetched"
                    );
                    return Ok(snap);
                }
                Err(e) => {
                    tracing::warn!(
                        target: "aurix.ingest",
                        source = source.name(),
                        error = ?e,
                        "source failed; trying next tier"
                    );
                    last_error = Some(e);
                }
            }
        }
        Err(last_error.unwrap_or_else(|| anyhow::anyhow!("no sources configured")))
    }
}
\`\`\`

Each source either returns a value or returns an error. The dispatcher walks the list in order and returns the first success. Errors at each tier are logged with structured context (source name, block, error) so that fallthroughs are visible in the telemetry stream.

---

## Why each tier exists

### Tier 1: Alchemy free tier

Alchemy's free tier offers 300 million compute units per month, which is enough for one user's analytical workload. The API exposes:

- \`eth_getBlockByNumber\` for block headers
- \`eth_getLogs\` for log fetches with topic filtering
- \`eth_call\` for contract reads at specific block numbers
- \`eth_getTransactionReceipt\` for tx detail

For pool snapshots, Aurix uses \`eth_call\` against the pool's \`slot0\`, \`liquidity\`, and \`feeGrowthGlobal\` getters at a specific block. For swap logs, Aurix uses \`eth_getLogs\` filtered by the pool address and the \`Swap\` event topic.

The advantage: full archive access, fast, well-rate-limited, ergonomic API. The disadvantage: rate limits hit hard if you batch poorly. The architecture batches calls aggressively to stay within rate limits.

### Tier 2: Uniswap V3 hosted subgraph

The Uniswap team maintains a free hosted subgraph at \`api.thegraph.com\`. It exposes a GraphQL API over the indexed Uniswap V3 data:

\`\`\`graphql
query SwapsForPool($pool: Bytes!, $fromBlock: Int!, $toBlock: Int!) {
  swaps(
    where: {
      pool: $pool,
      blockNumber_gte: $fromBlock,
      blockNumber_lte: $toBlock
    }
    orderBy: blockNumber
    first: 1000
  ) {
    timestamp
    pool { id }
    token0 { symbol decimals }
    token1 { symbol decimals }
    amount0
    amount1
    sqrtPriceX96
    liquidity
    tick
    sender
    recipient
  }
}
\`\`\`

The advantage: high throughput, no rate-limit issues for normal queries, indexed data. The disadvantage: trails the chain by 1-3 minutes (subgraph indexing lag), missing some less common data, deprecation risk.

> [!warning] **The deprecation risk is real.**
>
> The hosted subgraph at \`api.thegraph.com\` is being deprecated in favour of the decentralised network. The migration deadline keeps slipping but is real. Aurix's tier-2 source will need to be replaced with either the decentralised network query gateway or a self-hosted graph node when this happens.

### Tier 3: Public RPC

Public RPC endpoints (LlamaRPC, PublicNode, Cloudflare Ethereum, etc.) are free, unauthenticated, and brutally rate-limited. They are the panic fallback for when both Alchemy and the subgraph fail.

\`\`\`rust
const PUBLIC_RPC_URLS: &[&str] = &[
    "https://eth.llamarpc.com",
    "https://ethereum.publicnode.com",
    "https://cloudflare-eth.com",
    "https://rpc.ankr.com/eth",
];

pub struct PublicRpcSource {
    urls: Vec<String>,
    client: reqwest::Client,
}

impl PublicRpcSource {
    pub async fn call_with_failover<T: DeserializeOwned>(
        &self,
        method: &str,
        params: serde_json::Value,
    ) -> Result<T> {
        for url in &self.urls {
            match self.try_call(url, method, &params).await {
                Ok(result) => return Ok(result),
                Err(e) => {
                    tracing::warn!(url, error = ?e, "rpc call failed; trying next");
                }
            }
        }
        Err(anyhow::anyhow!("all public RPCs failed"))
    }
}
\`\`\`

This is the tier most likely to fail. Most public RPCs will rate-limit you to 10-20 requests per second. Some will silently truncate responses past a certain size. Some will return cached data from minutes ago. Tier 3 is meant for "we have run out of options" situations, not for routine ingestion.

### Tier 4: MockArchiveSource

Used only in tests and when \`AURIX_MOCK=1\` is set. Returns deterministic synthetic data:

\`\`\`rust
pub struct MockArchiveSource {
    fixtures: HashMap<(Address, u64), PoolSnapshot>,
}

impl MockArchiveSource {
    pub fn new_with_fixtures(fixtures: HashMap<(Address, u64), PoolSnapshot>) -> Self {
        Self { fixtures }
    }

    pub fn from_fixture_dir(dir: &Path) -> Result<Self> {
        // load every .json file in the dir as a fixture
        // ...
    }
}

#[async_trait]
impl ArchiveSource for MockArchiveSource {
    async fn fetch_pool_snapshot(&self, pool: Address, block: u64) -> Result<PoolSnapshot> {
        self.fixtures
            .get(&(pool, block))
            .cloned()
            .ok_or_else(|| anyhow::anyhow!("no fixture for {pool} at block {block}"))
    }
    // ... other methods
}
\`\`\`

The synthetic fixtures are written by hand to match the V3 spec. Tests use them to verify math and engine correctness without needing live data. This is what made the Vector A sprint shippable in two days; live data could be deferred.

---

## The silent-fallthrough trap

The most subtle bug in this architecture is what happens when Tier 1 silently breaks but Tier 2 keeps working:

\`\`\`
                The silent-fallthrough trap

   user thinks: "I am paying for Alchemy data, my analysis is fast and current"

   reality:
        │
        ▼
   ┌──────────────────────┐
   │ T1: Alchemy           │ ─▶ ❌ key truncated; 401 errors
   └──────────┬───────────┘
              │ silent fallthrough (only logged, no UI surface)
              ▼
   ┌──────────────────────┐
   │ T2: Uniswap subgraph  │ ─▶ ✓ returns data, BUT 3 minutes stale
   └──────────────────────┘     │ user does not know
                                ▼
                         analysis is on stale data
                         numbers look "right" until a real arb opportunity
                         is missed because Aurix is 3 minutes behind
\`\`\`

This is the kind of bug that hides for weeks. The visible application keeps working. The data is dimensionally correct. The freshness is wrong, and the freshness only matters when it really matters (during a fast-moving arbitrage opportunity, exactly the wrong moment to find out you are stale).

> [!warning] **What Aurix learned about this**
>
> The 2026-05-04 audit caught this exact failure on the user's actual setup. The Alchemy API key in their \`.env\` was truncated (~21 characters versus the typical 32). Tab 1 (arbitrage) appeared to work because it silently fell through to LlamaRPC. The data was 30-60 seconds stale; the user could not tell.
>
> The audit's \`potential-issues.md\` documents this trap explicitly. The fix: add a "data source" indicator to the UI showing which tier produced the most recent data. If Tier 1 has not produced data in the last 10 seconds, surface that as a warning.

---

## Mitigation: surface the source

The fix is to make the fallback chain's behaviour visible:

\`\`\`
                    Aurix Tab 1 (post-audit)

   ┌─────────────────────────────────────────────────────────────┐
   │ Aurix · Cross-DEX Arbitrage                                  │
   ├─────────────────────────────────────────────────────────────┤
   │                                                              │
   │  USDC/ETH @ Uniswap V3       3,251.43                        │
   │  USDC/ETH @ Curve            3,253.18      0.05% spread     │
   │                                                              │
   ├─────────────────────────────────────────────────────────────┤
   │ data: Alchemy ✓ (last poll: 2 sec ago)                        │
   │       Subgraph ✓ (last poll: 8 sec ago)                       │
   │ ──────────────────────────────────────────────────────────── │
   │ ⚠ Public RPC fallback active (Alchemy unreachable)           │
   └─────────────────────────────────────────────────────────────┘
\`\`\`

The status line at the bottom is the new affordance. It surfaces the active tier explicitly. If Alchemy is unreachable, the user knows they are on a slower fallback. If both Alchemy and the subgraph are down, the user knows they are on the panic-tier RPC. The trap of "silently working but with stale data" goes away.

---

## What this architecture wins

| Property                                   | Outcome                                         |
|--------------------------------------------|-------------------------------------------------|
| Cost per user                              | $0                                              |
| Reliability when one tier fails             | App keeps working with degraded freshness        |
| Reliability when two tiers fail            | App keeps working with worse freshness           |
| Reliability when all live tiers fail       | App refuses to operate (Tier 4 is gated)         |
| Test coverage                              | 100% via Tier 4 fixtures                         |
| Offline development                         | Trivial (set \`AURIX_MOCK=1\`)                   |
| Resilience to provider deprecations         | Replace one tier without touching the others    |
| Data freshness visibility                    | Surfaced in UI (after the audit fix)             |

---

## What this architecture costs

| Cost class                                  | Cost                                            |
|--------------------------------------------|-------------------------------------------------|
| Maintenance of 4 source implementations     | ~2,000 LoC across 4 modules                      |
| Per-tier rate-limit tuning                   | Manual, ongoing as providers change              |
| Per-tier API drift                           | Subgraph schema, Alchemy method signatures      |
| Synchronisation between tiers                 | Tier 1 may report different decimal places than Tier 2 |
| Telemetry overhead                            | Every fetch produces structured log lines        |

The maintenance cost is real. Each tier has its own quirks. The Uniswap subgraph reports prices in decimal form; Alchemy returns Q64.96 raw u256 strings; LlamaRPC returns standard JSON-RPC. Aurix has to normalise across all four.

---

## What this generalises to

> [!important] **The pattern is broader than DeFi**
>
> Anywhere you have a workload that needs data from external sources, where each source has different cost / reliability / freshness trade-offs, the multi-tier fallback is a useful pattern.
>
> | Domain                | Tier 1                     | Tier 2                      | Tier 3                       |
> |-----------------------|----------------------------|------------------------------|------------------------------|
> | Search                 | own search index            | hosted search API            | Bing / Google                |
> | Translation             | own model                  | hosted neural translation    | rule-based fallback          |
> | Geocoding               | own database                | Mapbox / Google              | OpenStreetMap                 |
> | Stock prices             | direct exchange feed         | hosted financial API         | Yahoo Finance HTML scrape     |

The discipline that matters: **never silently fall through to a degraded tier without surfacing it to the user.** That is what turns a robust architecture into a hidden bug factory.

---

## What is still on the roadmap

| Item                                          | When                                            |
|-----------------------------------------------|-------------------------------------------------|
| Tier 5: self-hosted Graph node fallback        | If Uniswap deprecates hosted subgraph             |
| Tier 6: \`web3://\` decentralised RPC pool      | Once the protocol is mature                       |
| Per-tier circuit breaker                       | If LlamaRPC etc. cause cascading failures         |
| Tier-aware caching                              | If certain queries are stable for hours/days     |
| User-configurable Alchemy key                   | Already in plan: \`.env\` + UI input              |

The fallback architecture is designed to absorb new tiers without restructuring. Tiers 5 and 6 will plug in as additional \`ArchiveSource\` implementations and the dispatcher will route to them in order.

---

## Closing

> [!important] **Free does not have to mean fragile**
>
> The trick to free DeFi tooling is not finding one cheap source; it is having multiple sources that fail differently and a dispatch layer that handles the failures gracefully.
>
> Aurix runs zero-cost, end-to-end, on a stack of free public sources. The architecture is doing real engineering work to make that sustainable. The audit fix that surfaced the active tier in the UI is the discipline that keeps "free" honest: if the user does not know which tier they are on, "free" can mean "silently broken."

The 4-tier fallback is the structural fact that makes Aurix's "zero-cost" promise honest. It is not magic. It is just deliberate engineering, applied to the specific problem of "how do I get DeFi data without paying for it."
`,
};
