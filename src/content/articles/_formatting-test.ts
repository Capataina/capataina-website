import type { Article } from "@/types";

export const formattingTest: Article = {
  slug: "_formatting-test",
  title: "Markdown formatting test",
  type: "Article",
  date: "2026-05-10",
  project: "Capataina Website",
  description:
    "Kitchen-sink document exercising every markdown + ASCII feature the renderer needs to handle. Used to verify visual fidelity end-to-end.",
  tags: ["meta", "test"],
  body: `# Markdown formatting test

This document is the visual test bed for the article renderer. Every formatting convention the article surface needs to handle has at least one occurrence below. If something looks broken, it's a styling bug, not a content bug.

The opening paragraph also doubles as a typography sample — body text, line height, paragraph rhythm, the colour of the prose against the panel background. Reading flow matters here as much as any of the structural elements that follow.

## Inline formatting

Plain prose with **bold weight**, *italic emphasis*, ***bold italic***, and ~~strikethrough~~ for things that no longer apply. Inline code looks like \`particleCount = 320\` and should pop visually without breaking the reading rhythm. A [link to the live site](https://capataina.vercel.app) sits inline; a [link with a title attribute](https://github.com/Capataina "Caner's GitHub") should expose the title on hover.

Emphasis stacking sanity check: a sentence with **bold containing _italic inside it_ and back to bold**, then back to plain weight.

## Headings — full cascade

Headings drive the table of contents. The TOC rail on the left should reflect this hierarchy with appropriate indentation per level.

### Third level

Most case studies will live at this depth — sections under a chapter.

#### Fourth level

Used sparingly for sub-sub-sections. The TOC can still indent these but they may not always be linked.

##### Fifth level

Edge case — present so we know how it renders.

###### Sixth level

The deepest standard markdown allows. Should look distinct from body text.

## Lists

### Unordered, with nesting

- Top-level bullet
  - Second-level bullet under the first one
    - Third-level bullet, deepest we'll usually go
  - Back to second level
- Sibling at the top level
- Lists can contain **inline formatting**, \`inline code\`, and [links](https://example.com)
- Lists can also contain longer paragraphs that wrap across multiple lines, in which case the indentation on the wrapped line should align with the start of the bullet's content rather than the bullet glyph itself

### Ordered, with nesting

1. First step
   1. Sub-step under the first
   2. Another sub-step
2. Second step
3. Third step
   1. Sub-step
      1. Deepest nesting we should test

### Task list (GFM)

- [x] Write the formatting test document
- [x] Wire react-markdown + remark-gfm
- [ ] Build the TOC scroll-spy
- [ ] Integrate the L-shape layout mode
- [ ] Add query-param URL sync

## Code blocks

### TypeScript

\`\`\`typescript
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

function buildSpatialGrid(particles: Particle[], cellSize: number): Map<string, Particle[]> {
  const grid = new Map<string, Particle[]>();
  for (const p of particles) {
    const key = \`\${Math.floor(p.x / cellSize)},\${Math.floor(p.y / cellSize)}\`;
    const cell = grid.get(key);
    if (cell) cell.push(p);
    else grid.set(key, [p]);
  }
  return grid;
}
\`\`\`

### Rust

\`\`\`rust
#[derive(Debug, Clone, Copy)]
struct OrderId(u64);

#[derive(Debug, Clone, Copy)]
struct Price(i64); // cents, signed for spread / pnl math

impl Order {
    pub fn matches(&self, other: &Order) -> bool {
        self.side != other.side && self.price.crosses(other.price)
    }
}

fn route(books: &[OrderBook], symbol: Symbol) -> Result<&OrderBook, RoutingError> {
    books
        .iter()
        .find(|b| b.symbol() == symbol)
        .ok_or(RoutingError::UnknownSymbol(symbol))
}
\`\`\`

### Python

\`\`\`python
import torch
import torch.nn as nn

class ThreeFactorRule(nn.Module):
    """Pre × post × dopamine, with eligibility decay."""

    def __init__(self, tau: float = 50.0):
        super().__init__()
        self.tau = tau
        self.register_buffer("eligibility", torch.zeros(1))

    def forward(self, pre: torch.Tensor, post: torch.Tensor, da: torch.Tensor) -> torch.Tensor:
        self.eligibility = self.eligibility * (1.0 - 1.0 / self.tau) + pre * post
        return self.eligibility * da
\`\`\`

### Bash

\`\`\`bash
#!/usr/bin/env bash
set -euo pipefail

# Build all four targets in release mode and surface only the timing rows.
for target in cernio aurix neurodrive nyquestro; do
  echo "Building $target..."
  cargo build --manifest-path "$target/Cargo.toml" --release 2>&1 \\
    | grep -E "(Compiling|Finished)" \\
    | tail -3
done
\`\`\`

### Inline code samples

Reach for inline code for short identifiers like \`useMemo\`, paths like \`src/content/articles/\`, and CLI fragments like \`pnpm dev\`. Anything longer than a phrase should go into a fenced block.

## Tables

### Basic table

| Quadrant                                    | Skills | Projects | OSS |
|---------------------------------------------|------:|---------:|----:|
| Systems & Infrastructure Engineer           | 9     | 8        | 1   |
| Applied AI & ML Infrastructure Engineer     | 8     | 7        | 2   |
| Low Level Financial Systems Engineer        | 5     | 3        | 0   |
| Open Source Engineer                        | 7     | 1        | 6   |

### Wider table with alignment

| Project    | Stack            | Status   | Description                                                                |
|:-----------|:-----------------|:--------:|:---------------------------------------------------------------------------|
| Cernio     | Rust + Ratatui   | active   | Local-first job-discovery TUI with Claude-assisted candidate evaluation.   |
| Aurix      | Rust + Tauri 2   | active   | DeFi analytics platform with Q64.96 Vector A V3 LP backtester.             |
| NeuroDrive | Rust + Bevy      | active   | Brain-inspired continual learning substrate, no backprop, no ML libraries. |
| Nyquestro  | Rust             | active   | Lock-free limit-order-book matching engine with live Coinbase market data. |

## Blockquotes

> A quoted line that stands on its own. Useful for pulling an idea forward or citing a source.

> Multi-paragraph blockquotes also work.
>
> The second paragraph keeps the quote glyph on every line so the visual continuity doesn't break.
>
> > Nested blockquotes — the gutter steps in another level. Rare but should look intentional when it happens.

## ASCII art and diagrams

The article format is text-first, so most diagrams will be ASCII. The renderer needs to preserve monospace alignment exactly.

### Flow diagram

\`\`\`
┌────────────┐    ┌────────────┐    ┌────────────┐
│  Markdown  │───▶│   parse    │───▶│   render   │
│   source   │    │ (remark)   │    │  (custom)  │
└────────────┘    └────────────┘    └────────────┘
                         │
                         ▼
                  ┌────────────┐
                  │    AST     │──── walk for TOC
                  └────────────┘
\`\`\`

### Sparkline

\`\`\`
commits per week (last 12)
▁▃▂▅▇▆▄▃▆█▇▅
1   3   6   9  12
\`\`\`

### Box-drawing tree

\`\`\`
src/
├── app/
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── articles/
│   │   ├── ArticlesPanel.tsx
│   │   ├── ArticleView.tsx
│   │   ├── TableOfContents.tsx
│   │   └── markdown-components.tsx
│   ├── shell/
│   │   ├── PortfolioCard.tsx
│   │   └── Quadrant.tsx
│   └── ui/
└── content/
    └── articles/
        └── _formatting-test.ts
\`\`\`

### Comparison table in pure ASCII

\`\`\`
┌──────────────────┬───────────┬───────────┬───────────┐
│ approach         │ latency   │ memory    │ accuracy  │
├──────────────────┼───────────┼───────────┼───────────┤
│ naive O(n²)      │ 28.4 ms   │ 12 KB     │ 100 %     │
│ spatial grid     │  3.1 ms   │ 18 KB     │ 100 %     │
│ k-d tree         │  4.7 ms   │ 24 KB     │ 100 %     │
└──────────────────┴───────────┴───────────┴───────────┘
\`\`\`

### Annotated ASCII

\`\`\`
                  ┌─────────────┐
   client ──────▶ │  edge fn    │ ──────▶ remote API
                  └─────────────┘
                        │ (cache miss only)
                        ▼
                  ┌─────────────┐
                  │  KV store   │
                  └─────────────┘

  Hot path:  client → KV (≤ 8 ms)
  Cold path: client → edge → API (≤ 240 ms)
\`\`\`

## Horizontal rules

The horizontal rule below should look like a thin divider, not an obtrusive line. It exists to break visual rhythm when sections genuinely don't connect.

---

After the rule, prose continues. Spacing above and below the rule should feel deliberate.

## Long-form prose

Some article sections will be paragraph-heavy with no list or table at all. The renderer needs to handle a wall of text gracefully — measured line-length, comfortable line-height, paragraph spacing that lets the eye breathe.

This is the second paragraph of long-form prose. It exists to test paragraph-to-paragraph spacing. The visual gap should be enough to clearly separate ideas without the page feeling sparse.

A third paragraph rounds out the long-form section. Wrapping a sentence over multiple visual lines should produce clean line-height with no orphaned hyphens, no awkward last-word lines, and no rhythm break at the wrap point. A reader should be able to skim a paragraph and return to a specific sentence without losing their place.

## Edge cases worth verifying

1. **Emoji in headings** — the existing site uses 👋 in the portfolio card; case studies should handle it too.
2. **Long unbreakable strings** — like \`some-very-long-package-name-that-will-not-wrap-naturally-at-spaces-or-hyphens-and-must-overflow-gracefully\`.
3. **Mixed inline formatting** — *italic followed by* **bold**, then back to plain, with \`inline code\` interspersed.
4. **Empty list items** look like:
   - filled bullet
   -
   - filled again
5. **A bullet whose text contains a fenced code block**:
   - here is the bullet, and the code block follows on its own line:
     \`\`\`
     just a plain code block inside a list
     \`\`\`
   - back to a normal bullet

## Closing note

If every section above renders cleanly with the website's accent variables, transitions, and scrollbar, the markdown surface is ready for real article content. The next step is writing the first one.
`,
};
