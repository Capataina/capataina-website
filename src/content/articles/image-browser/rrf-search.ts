import type { Article } from "@/types";

export const imageBrowserRrfSearch: Article = {
  slug: "image-browser-rrf-search",
  title: "Three encoders, one search: Reciprocal Rank Fusion for image semantic search",
  type: "Case Study",
  date: "2026-04-26",
  project: "Image Browser",
  description:
    "Image Browser combines CLIP, DINOv2, and SigLIP-2 for semantic image retrieval. The naive way to combine multi-encoder scores fails because each encoder's cosine distribution differs. Reciprocal Rank Fusion (Cormack 2009) solves this by discarding the cosine value entirely and combining ranks instead. The full retrieval pipeline, end to end.",
  tags: ["machine-learning", "image-retrieval", "rust", "clip", "dinov2"],
  body: `# Three encoders, one search: Reciprocal Rank Fusion for image semantic search

Image Browser is a local-first Tauri 2 desktop application for browsing and searching personal image libraries. The interesting part of the architecture is the retrieval layer: three image encoders run at indexing time, three embeddings are stored per image, and at search time all three encoders contribute to a single ranked result list.

The combination is done via Reciprocal Rank Fusion (RRF), a technique from the information-retrieval literature (Cormack 2009). RRF turns out to be the right choice for combining ranked lists from heterogeneous sources, and the reasons are not obvious until you try the alternatives.

This article is about the retrieval pipeline, why naive multi-encoder fusion fails, and what RRF specifically buys.

---

## TL;DR

| Property                                | Value                                      |
|-----------------------------------------|--------------------------------------------|
| Encoders combined                        | CLIP ViT-B/32 + DINOv2-Base + SigLIP-2 Base 256 |
| Fusion method                            | Reciprocal Rank Fusion, k = 60             |
| Indexing throughput (M2 MacBook Air)     | ~80 images/sec across all 3 encoders       |
| Search latency (1000 images)             | < 30 ms total                              |
| Storage per image                        | ~9 KB (3 encoders × ~3 KB each FP32)       |
| Models on disk                            | ~2.5 GB total                              |

---

## Why three encoders

Each of the three encoders captures a different kind of similarity. They were not chosen randomly:

| Encoder        | Type                | Strength                                   |
|----------------|---------------------|--------------------------------------------|
| CLIP ViT-B/32  | Image-text contrast | Best for "describe what you want" queries |
| DINOv2-Base    | Self-supervised     | Best for "find more like this" image-image|
| SigLIP-2 Base  | Sigmoid contrast    | Better discrimination for fine-grained text|

> [!important] **Why three, not one?**
>
> No single encoder is best at everything. CLIP excels at matching text-to-image (its training task) but is mediocre at detecting fine-grained visual similarity that does not correspond to text. DINOv2 excels at visual similarity but has no text branch at all. SigLIP-2 is a newer text-image contrastive model that handles fine-grained discrimination better than CLIP.
>
> A query for "a black cat sitting on a windowsill" benefits from CLIP. A query "find more like this specific image" benefits from DINOv2. A query for "a Russian Blue cat with a fluffy chest" benefits from SigLIP-2's finer-grained vocabulary.
>
> Combining them captures more of the relevance space than any single encoder would.

### Image Browser's encoder lineup

\`\`\`
                       Encoder pipeline (indexing)

   ┌────────────────────┐
   │ image (RGB tensor)  │
   └─────────┬──────────┘
             │
             ├─────────────────┬─────────────────┬───────────────────┐
             ▼                 ▼                 ▼                   ▼
   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
   │ CLIP ViT-B/32     │ │ DINOv2-Base      │ │ SigLIP-2 Base    │
   │ vision_model.onnx │ │ image_model.onnx │ │ vision_model.onnx │
   ├──────────────────┤ ├──────────────────┤ ├──────────────────┤
   │ in:  224×224 RGB  │ │ in:  224×224 RGB │ │ in:  256×256 RGB  │
   │ out: 512-d vec    │ │ out: 768-d vec   │ │ out: 768-d vec    │
   └─────────┬────────┘ └─────────┬────────┘ └─────────┬────────┘
             │                    │                    │
             ▼                    ▼                    ▼
   ┌──────────────────────────────────────────────────────────┐
   │ embeddings(image_id, encoder_id, embedding) in SQLite     │
   └──────────────────────────────────────────────────────────┘
\`\`\`

Each encoder produces an L2-normalised embedding. All three run in parallel in the indexing pipeline (one thread per encoder), each with its own DB connection and its own batch flush.

---

## Why naive fusion fails

The first instinct, looking at three cosine similarity scores per image, is to combine them by averaging or weighted sum:

\`\`\`rust
// the naive approach — DOES NOT WORK
fn fused_score(clip: f32, dino: f32, siglip: f32) -> f32 {
    (clip + dino + siglip) / 3.0
}
\`\`\`

The reason this fails: **each encoder's cosine distribution has a different mean and a different standard deviation.**

\`\`\`
                Cosine distribution per encoder (illustrative)

   CLIP cosines:      density
                     │       ╱╲
                     │      ╱  ╲      mean ≈ 0.55, std ≈ 0.12
                     │  ___╱    ╲___
                     0────────────────1
                     0.25     0.55     0.85

   DINOv2 cosines:                            mean ≈ 0.20, std ≈ 0.15
                     │     ╱╲                  centered much lower!
                     │    ╱  ╲___
                     │___╱
                     0────────────────1
                     0.05     0.20     0.45

   SigLIP-2 cosines:                          mean ≈ 0.25, std ≈ 0.10
                     │      ╱╲
                     │     ╱  ╲___
                     │ ___╱
                     0────────────────1
                     0.05     0.25     0.55
\`\`\`

A CLIP cosine of 0.85 is "very high relevance." A DINOv2 cosine of 0.85 is so high that it almost certainly indicates a near-duplicate. A SigLIP-2 cosine of 0.85 is similarly extreme. They are not on the same scale.

> [!warning] **The naive averaging trap**
>
> If you average the cosines, the encoder with the largest variance dominates the result. CLIP's cosines are typically in [0.2, 0.9]; DINOv2's are typically in [0.05, 0.5]. Averaging them gives 60-70% of the weight to CLIP, regardless of which encoder is actually most relevant for the query.
>
> Z-scoring the cosines before averaging is better but still wrong. Each encoder's distribution is non-Gaussian and its tails are different shapes.

---

## What Reciprocal Rank Fusion does

RRF (Cormack et al., 2009) sidesteps the cosine-distribution problem by discarding the cosine value entirely and using only the rank.

\`\`\`
                   Reciprocal Rank Fusion

   for each query:
     1. each encoder produces its own ranked list of images
     2. for each image, look up its rank in each encoder's list
     3. fused score = sum of 1 / (k + rank) across encoders, where k = 60

   image's RRF score = 1/(60 + clip_rank) + 1/(60 + dino_rank) + 1/(60 + siglip_rank)

   higher RRF score = more relevant

   the constant k = 60 dampens the influence of any single high-rank entry
\`\`\`

The key insight: an image at rank 5 in CLIP is "in the top 5 most relevant according to CLIP," regardless of what the cosine value at rank 5 happens to be on this query.

\`\`\`rust
const K: f32 = 60.0;

pub fn rrf_combine(rank_lists: &[&[ImageId]]) -> Vec<(ImageId, f32)> {
    let mut scores: HashMap<ImageId, f32> = HashMap::new();
    for list in rank_lists {
        for (rank, &image_id) in list.iter().enumerate() {
            // rank is 0-indexed in code; treat as 1-indexed in formula
            let contribution = 1.0 / (K + (rank + 1) as f32);
            *scores.entry(image_id).or_insert(0.0) += contribution;
        }
    }
    let mut result: Vec<_> = scores.into_iter().collect();
    result.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
    result
}
\`\`\`

---

## Why k = 60

The constant \`k = 60\` is from the original Cormack paper. It is empirically calibrated and surprisingly stable across domains. The intuition:

\`\`\`
                  Effect of k on rank weight

   if k = 0:    rank-1 contributes 1.0; rank-2 contributes 0.5
                rank-100 contributes 0.01
                → rank-1 hits dominate fusion entirely

   if k = 60:   rank-1 contributes 1/61 ≈ 0.0164
                rank-2 contributes 1/62 ≈ 0.0161
                rank-10 contributes 1/70 ≈ 0.0143
                rank-100 contributes 1/160 ≈ 0.00625
                → smooth descent; no single high-rank entry dominates

   if k = 1000: contributions are all very close
                → fusion approaches simple count of "appears in any list"
\`\`\`

The sweet spot is k between 40 and 80 for most domains. Image Browser uses 60.

> [!note] **What changing k buys**
>
> Lowering k makes the fusion more sensitive to top-rank items. Raising k makes the fusion more democratic across all encoders. For image search, the sweet spot is empirical: k = 60 produces results that feel right across query types, and tuning k away from that breaks fewer queries than it improves.

---

## Per-encoder ranking implementation

Each encoder produces its own ranked list before fusion:

\`\`\`rust
pub async fn get_top_k_per_encoder(
    db: &Database,
    query_embedding: &[f32],
    encoder_id: EncoderId,
    k: usize,
) -> Result<Vec<(ImageId, f32)>> {
    let candidates: Vec<(ImageId, Vec<f32>)> = db.fetch_all_embeddings(encoder_id).await?;

    let mut scored: Vec<(ImageId, f32)> = candidates
        .into_iter()
        .map(|(id, emb)| (id, cosine_similarity(query_embedding, &emb)))
        .collect();

    scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
    scored.truncate(k);
    Ok(scored)
}
\`\`\`

This runs in parallel for all three encoders. With 1000 images in the database, each encoder's pass takes ~5 ms (linear scan plus partial sort). Three encoders in parallel: ~5 ms wall-clock. The RRF fusion adds another ~1 ms. Total query latency: well under 30 ms.

For larger libraries (10,000+ images), the linear scan starts to dominate. The next refinement is approximate nearest-neighbour indexing per encoder, but for personal libraries (typically < 5000 images), brute-force scans are simpler and fast enough.

---

## Image-image vs text-image fusion

Image Browser supports two fusion modes:

| Mode          | Encoders combined         | Trigger                          |
|---------------|---------------------------|----------------------------------|
| Image-image   | CLIP + DINOv2 + SigLIP-2  | Click on an image to find similar |
| Text-image    | CLIP + SigLIP-2           | Type a query                      |

DINOv2 has no text branch (it is a self-supervised image-only model), so it drops out of text-image queries.

\`\`\`
              Image-image search:                   Text-image search:

   [click image] ─┐                            [type query] ─┐
                  ├─▶ CLIP image embedding                    ├─▶ CLIP text embedding
                  ├─▶ DINOv2 embedding                        │
                  └─▶ SigLIP-2 image embedding                └─▶ SigLIP-2 text embedding
                                                              │
                  ranked lists from each                       ranked lists from each
                  RRF fusion (3 lists)                          RRF fusion (2 lists)
\`\`\`

The fusion code does not care how many lists it gets. It just combines whatever it is given.

---

## What the user-facing experience looks like

\`\`\`
                Image Browser search bar (3 modes)

  ┌─────────────────────────────────────────────────────────────┐
  │ Search:  [hashtag]  [text query]   [click image]            │
  ├─────────────────────────────────────────────────────────────┤
  │                                                              │
  │  text query example:                                         │
  │    "black cat on windowsill"                                  │
  │      → CLIP + SigLIP-2 ranked lists                           │
  │      → RRF fusion                                             │
  │      → masonry grid of results                                │
  │                                                              │
  │  click-image example:                                         │
  │    [click image of mountain landscape]                        │
  │      → CLIP + DINOv2 + SigLIP-2 ranked lists                 │
  │      → RRF fusion                                             │
  │      → masonry grid of similar images                         │
  │                                                              │
  │  hashtag example:                                             │
  │    "#cat #window"                                             │
  │      → SQL filter on tags table                               │
  │      → no RRF (deterministic match)                           │
  │                                                              │
  └─────────────────────────────────────────────────────────────┘
\`\`\`

Each mode produces a result list that flows into the same masonry grid renderer. The user does not need to know that a different fusion strategy is running for each mode.

---

## What goes wrong if you skip RRF

A few months before RRF landed, the project tried weighted-sum fusion:

\`\`\`rust
// the version we tried for two weeks
fn weighted_sum_fusion(clip: f32, dino: f32, siglip: f32) -> f32 {
    0.4 * clip + 0.3 * dino + 0.3 * siglip
}
\`\`\`

The weights came from an empirical "what feels best on a sample of queries." The problem manifested over time:

\`\`\`
                  Failure modes of weighted-sum fusion

  query: "snow-capped mountains"
    CLIP:    snow + mountain images, cosines 0.6-0.8  [great]
    DINOv2:  some snow, some mountains, mixed grain    [okay]
    SigLIP:  snow + mountain, fine-grained             [good]

    weighted sum: dominated by CLIP because of cosine magnitude
    result: looks fine, but DINOv2's contribution is invisible

  query: [click image of a striped cat]
    DINOv2:  similar striped cats, cosines 0.3-0.5     [great]
    CLIP:    "cats" generally, including non-striped    [okay]
    SigLIP:  some stripey cats, cosines 0.3-0.4        [fine]

    weighted sum: dominated by CLIP's higher cosine magnitude
    result: returns generic cats, not striped cats specifically
    DINOv2's signal got drowned out by CLIP's higher absolute scores
\`\`\`

The fix was always going to be either (a) carefully calibrate per-query weights, which is impossible at runtime, or (b) discard the magnitudes and use ranks. RRF is option (b).

After switching to RRF: the second query starts returning striped cats. The first query loses nothing. The change is positive across query types because RRF treats every encoder's vote with equal weight, regardless of its score's magnitude.

---

## Per-encoder toggle and instant restoration

Image Browser has a Settings drawer that lets the user disable specific encoders. Disabling DINOv2 causes the fusion to run with only CLIP and SigLIP-2. Re-enabling brings DINOv2's contribution back instantly without re-encoding any images.

> [!important] **Storage policy: keep all embeddings, even disabled ones**
>
> Re-encoding 1000 images is slow (~12 seconds on the M2). Disabling an encoder does not delete its embeddings; it just removes that encoder's ranked list from the RRF fusion.
>
> Storage cost is ~3 KB per image per encoder. For a 5000-image library that is 15 MB per disabled encoder. Cheap. Re-encoding cost is much higher than storage cost; keep the embeddings.

---

## Performance numbers

| Operation                                  | Time on M2 MacBook Air                |
|--------------------------------------------|---------------------------------------|
| Encode one image, all 3 encoders parallel  | ~15 ms                                 |
| Index 1000 images                           | ~12 seconds (3 encoders parallel)     |
| Query: cosine sim across 1000 embeddings    | ~5 ms per encoder (parallel)          |
| RRF fusion of 3 ranked lists, top-k = 50    | ~1 ms                                  |
| Total search latency, 1000 images           | < 30 ms                                |

The critical path is the cosine-similarity scan. For libraries up to ~5000 images, brute force is simpler than approximate-nearest-neighbour indexing and stays under interactive latency.

---

## What this generalises to

> [!important] **RRF is the right default for combining heterogeneous ranked lists**
>
> Anywhere you have multiple ranked lists from sources with different score distributions, RRF produces honest fused rankings. Examples beyond image search:
>
> | Domain                    | Ranked lists from                       |
> |---------------------------|------------------------------------------|
> | Document retrieval         | BM25 + dense retrieval + click logs     |
> | Recommendation systems     | Collaborative filtering + content-based + popularity |
> | Code search                | Lexical + AST-aware + semantic        |
> | Email search               | Subject match + body match + sender weight |
> | Movie recommendation       | Director + genre + audience similarity   |
>
> The pattern: each source produces a ranked list independently. RRF combines them without needing to normalise scores across sources.

---

## What the encoders are NOT

A short note on what RRF does not solve:

| Problem                                 | RRF helps?                                           |
|-----------------------------------------|------------------------------------------------------|
| Heterogeneous score distributions        | ✓ yes (this is exactly what RRF is for)              |
| Encoder bias (CLIP underrates abstract art)| ✗ no — RRF amplifies what each encoder ranks high  |
| Missing relevance from any encoder       | ✗ no — if no encoder ranks an image high, RRF won't find it |
| Re-ranking learned from user feedback    | ✗ no — that is a separate layer (Image Browser doesn't do this) |

If your problem is "all my encoders are bad," RRF will not save you. If your problem is "my encoders are fine individually but their scores are not on the same scale," RRF is the right tool.

---

## What landed in Image Browser

| Component                            | Status                                   |
|--------------------------------------|------------------------------------------|
| 3-encoder image pipeline              | ✓ shipped 2026-04-25                      |
| RRF fusion (image-image)              | ✓ shipped (Phase 5)                       |
| Per-encoder toggle in settings        | ✓ shipped                                  |
| Text-image fusion (CLIP + SigLIP-2)   | ✓ shipped (Phase 11d)                     |
| Phase 12 perf bundle                   | ✓ shipped                                  |
| Approximate-nearest-neighbour ANN      | not shipped (brute force fast enough)     |

The full retrieval pipeline is roughly 2,400 lines of Rust + 800 lines of TypeScript for the React side. The RRF code itself is about 80 lines.

---

## Closing

The retrieval layer in Image Browser is the part of the project that matters most. The user does not see the encoders, the cosines, or the ranked lists. They see "type a query, get good results." Whether the results are good depends entirely on the fusion strategy.

Reciprocal Rank Fusion is the technique that turns three good encoders into one excellent search experience. It is not a clever trick; it is a 2009 paper from the IR literature. The contribution is choosing the right tool for the right problem and resisting the temptation to invent a custom fusion strategy when an off-the-shelf one works better.

The lesson generalises beyond image search: when you have multiple ranked lists from different sources with different score distributions, RRF is the right default. It is honest, it is fast, and it is robust to the kinds of distribution drift that break weighted-sum fusion.

Image Browser uses three encoders because no single encoder is best at everything. It uses RRF because no clever weighting scheme is robust across query types. The combination is what makes the search useful.
`,
};
