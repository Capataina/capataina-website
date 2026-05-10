# Quadrant Interaction System

*The central interactive subsystem — 4 quadrants, hover/select state machine, accent CSS swap, layout choreography, conditional content mount.*

## Scope / Purpose

Owns the interactive surface that turns the page from a static grid of labels into the explorable portfolio. Specifically:

- the 4-quadrant `motion.div` layout that fills the viewport
- the hover-vs-select state machine driven from `page.tsx`
- the per-quadrant size recompute (50%/50% default, 55%/45% on hover, 80%/20% on select)
- the runtime accent CSS variable swap on `documentElement`
- the `QuadrantInterface` mount inside the selected quadrant, with field-filtered list components
- the spring-physics transitions between states (stiffness 500, damping 25)

Everything else on the page (the floating PortfolioCard, the canvas ParticleNetwork) is supporting decoration around this central interaction.

## Boundaries / Ownership

| Owns | Does not own |
|------|--------------|
| `page.tsx` state (`hoveredQuadrant`, `selectedQuadrant`) | The data layer (`src/content/`) |
| The 4 `<Quadrant>` instances + their position-1..4 props | The single-card components (Project, Skill, etc.) — those are owned by the per-feature list components |
| The `useEffect` in `page.tsx` that writes `--accent-purple-*` to `documentElement` | The OKLCH triplets in `globals.css` (those are theming-system-owned at the CSS layer, but the swap *mechanism* lives here) |
| The `Quadrant.tsx` size-recompute `useMemo` | The `QuadrantInterface` body layout (left 70% column with Educations + Projects + Contributions + Certificates, right 30% column with Skills) — this is owned by `QuadrantInterface.tsx` directly |
| Spring transition parameters | Animation variants on individual cards inside the interface |

The clean boundary: this system owns *which quadrant is active and how it resizes*; the per-feature list components own *what fills the active quadrant when expanded*.

## Current Implemented Reality

**Files:**
- `src/app/page.tsx` — owns the two top-level pieces of state (`hoveredQuadrant`, `selectedQuadrant`), the `positionToTheme` map, and the accent-CSS-swap `useEffect`.
- `src/components/shell/Quadrant.tsx` — one component, instantiated 4× from page.tsx with `position={1..4}` and a `label` prop. Owns the size-recompute logic + the click/hover handlers + the per-quadrant icon/label rendering.
- `src/components/shell/QuadrantInterface.tsx` — mounted inside the selected quadrant via `<AnimatePresence mode="popLayout">`. Owns the close button, the centred title, the spacer, and the two-column layout that hosts the field-filtered list components.

**State machine (3 modes):**

```
                 ┌─────────────┐
                 │  default    │ — no hover, no select
  hover-leave    │  4 × 50%/50% │ — accent: --accent-default
  ←─────────────┤             │
                 └──────┬──────┘
                        │ user enters quadrant N
                        ▼
                 ┌─────────────┐
                 │  hovered    │ — hoveredQuadrant = N
                 │  N at       │ — accent: --accent-{theme(N)}
  hover-leave    │  55%/55%    │ — PortfolioCard parallax-offset
  ←─────────────┤  others     │
                 │  45%/45%    │
                 └──────┬──────┘
                        │ user clicks quadrant N
                        ▼
                 ┌─────────────┐
                 │  selected   │ — selectedQuadrant = N
                 │  N at       │ — QuadrantInterface mounts
  click background │ 80%/80%   │ — PortfolioCard fades to 0
  or close button  │ others    │ — accent stays on theme(N)
  ←──────────────┤  20%/20%    │
                 └─────────────┘
```

**Layout grid (per Quadrant.tsx `size` useMemo):**
- Default: every quadrant is `calc(50% - 16px)` wide and tall (16px margin compensation).
- Hovered with selection-null: hovered quadrant is `calc(55% - 16px)`; siblings are `calc(45% - 16px)` on the axis they share with the hovered one. Position-shared (top vs bottom row, left vs right column) controls which sibling-axis gets the 55 or 45 depending on whether they share the hovered quadrant's row/column.
- Selected: selected quadrant is `calc(80% - 16px)`; siblings are `calc(80% - 16px)` on the axis they share with the selected, `calc(20% - 16px)` on the other axis. Result: visually, the selected quadrant fills its corner-quarter, expanded to take 80% of each dimension.

The size-recompute math is the densest piece of logic in the file (Quadrant.tsx lines ~141-191) — preserved during the 2026-05-10 restructure unchanged.

**Spring transition:** every animated property uses `{ type: "spring" as const, stiffness: 500, damping: 25 }` for the size transition. AnimatePresence transitions for the icon-vs-label vs interface use shorter spring or `easeInOut` parameters.

## Key Interfaces / Data Flow

**`page.tsx` → `Quadrant`:**

```ts
<Quadrant
  position={1}
  hoveredQuadrant={hoveredQuadrant}
  selectedQuadrant={selectedQuadrant}
  onHoverChange={setHoveredQuadrant}
  onSelect={setSelectedQuadrant}
  label="Systems & Infrastructure Engineer"
/>
```

`label` is the canonical Field string. It's consumed in two places inside Quadrant.tsx:
- `labelIconMap[label]` to pick the Lucide icon (Cpu / Brain / Database / GitBranch).
- `<QuadrantInterface field={label} />` when selected — the label propagates as the filter key into the list components.

**`Quadrant` → `QuadrantInterface`:**

```ts
<QuadrantInterface
  quadrantPosition={position}
  field={label}
  onClose={() => onSelect(null)}
/>
```

`field` is passed unchanged into the 5 list components.

**`QuadrantInterface` → list components:**

```ts
<Educations field={field} />
<Projects field={field} />
<Contributions field={field} />
<Certificates field={field} />
<Skills field={field} />
```

Each list component runs `field as Type["fields"][number]` cast at its `.filter()` boundary. The cast is honest because the producer chain (page.tsx → Quadrant → QuadrantInterface) only ever passes the four canonical Field strings.

**`page.tsx` `useEffect` → DOM:**

```ts
const root = document.documentElement;
const activeQuadrant = selectedQuadrant || hoveredQuadrant;
const theme = activeQuadrant ? positionToTheme[activeQuadrant] : "default";
root.style.setProperty("--accent-purple", `var(--accent-${theme})`);
root.style.setProperty("--accent-purple-dim", `var(--accent-${theme}-dim)`);
root.style.setProperty("--accent-purple-glow", `var(--accent-${theme}-glow)`);
```

This is a side-effect, not a state update. CSS interpolates the new accent over `--accent-transition-duration` (250ms) globally.

## Implemented Outputs / Artifacts

- **The 4-quadrant grid** rendered as 4 sibling `motion.div` elements inside the page-level `flex flex-wrap` container.
- **The `QuadrantInterface`** mounted conditionally on selection — close button, centred field label, spacer (right-side, width-matched to the close button so the title stays centred), 70/30 two-column body, vertical scroll per column.
- **The accent-CSS-variable swap** propagated globally via `documentElement.style` writes — no React re-renders, no prop-drilling, no context.
- **PortfolioCard parallax offset** — when hovered, the card shifts ~2.5% in the opposite direction of the hovered quadrant for a depth effect. The offset math is in `PortfolioCard.tsx` `getOffset()`.

## Known Issues / Active Risks

- **Hardcoded position-to-quadrant assumption.** `Quadrant.tsx`'s `size` useMemo computes positions based on `position <= 2` (top row) and `position % 2 === 1` (left column). Adding a 5th quadrant breaks the math. **Downstream impact:** if a future iteration extends the grid, the size recompute logic must be redesigned, not extended. Likely needs a row/col grid prop instead of inferring from position number.
- **Field-string runtime mismatch is silent.** `page.tsx` passes `label="..."` strings that aren't compile-time-checked against the Field union. A typo would render a quadrant whose content always filters to empty. **Downstream impact:** the quadrant would show only the close button + spacer + skills column; no projects/skills/educations/certs/contributions would render. Easy to spot in browser smoke; invisible to `tsc --noEmit` and `pnpm build`.
- **CSS containment caveat.** `contain: layout style paint` on each Quadrant works correctly today but assumes no positioned descendant escapes the quadrant's bounds. If a future absolute-positioned tooltip renders outside its quadrant, containment will clip it. **Downstream impact:** if such a tooltip is added, the containment should be relaxed to `contain: layout style` (drop paint isolation) for that quadrant, OR the tooltip should portal up to the document body.

## Partial / In Progress

Nothing. The system is fully implemented; the 2026-05-10 restructure did not leave any in-progress threads.

## Planned / Missing / Likely Changes

- **Type-tightening (deferred).** Pass `field: Field` everywhere instead of `field: string`. Removes the cast at every `.filter()` boundary and catches typos at compile time. Defer until a real failure motivates it (none observed yet — producer chain is hardcoded with the four canonical strings).
- **Featured-projects derivation (deferred).** `Project.featured?: boolean` is in the type but unused. The 4-item `highlightedProjects` array in PortfolioCard.tsx is hand-curated. Wiring through `featured: true` on data modules would couple the floating-card content to the data layer. Defer until the editorial vs data tension actually bites.
- **Tablet / mobile layout.** The current grid assumes desktop-shaped viewports (≥ ~1100px). Mobile viewport handling is not designed in — labels would wrap across more than two lines, the 80/20 expand layout would feel cramped. Likely a portrait-mode tier with a stacked layout (4 quadrants in a column instead of 2×2) is the right answer eventually.

## Durable Notes / Discarded Approaches

**Hover-clip animation history (2026-05-10).** The list-item hover variant inside this system's downstream cards was originally `{ x: 4, scale: 1.01, ... }`. The combined effect of x-shift + 1% scale clipped long lines on the right edge of their container, and pushed bottom-edge pixels into the next divider in the divide-y stack. Reduced to `{ x: 2, ... }` (no scale). The lesson: don't scale text on hover when the parent has any kind of containment or sibling-divider boundary — pure translation is safe, scale is risky.

**Quadrant label sizing history (2026-05-10).** Original label size was `text-4xl` (36px). Caused inconsistent wrapping — "Applied AI & ML Infrastructure Engineer" wrapped to two lines while the other three labels rendered single-line. Reduced to `text-3xl` + added `text-balance` Tailwind utility (CSS `text-wrap: balance`) so any wrapping at narrower viewports balances line widths. All four labels now render single-line at typical desktop widths.

**Dead-state removal (2026-05-10).** `Quadrant.tsx` previously had a `mousePosition: {x, y}` `useState` set on every throttled mousemove (32ms throttle) but never read in the JSX. The mousemove handler was dispatched but did nothing observable. Removed the state, the handler, the `lastUpdateRef`, and the `onMouseMove` binding entirely. The lesson: state set without a consumer is dead code; the throttle bookkeeping was machinery without a payload.

**AccentColorContext deletion (2026-05-10).** A `<AccentColorProvider>` wrapped the page in a `useContext`-driven theme provider. No component ever called `useAccentColor()` — the theme swap was happening via direct `document.documentElement.style.setProperty` writes in `page.tsx`'s `useEffect`. The context was decorative wrapping with no consumers. Deleted entire `src/contexts/AccentColorContext.tsx`. The lesson: React Context for global state is the wrong tool when the state is a CSS variable — DOM-side writes bypass React's render cycle and integrate naturally with the CSS cascade.

## Obsolete / No Longer Relevant

- The "Product & Full Stack Engineer" 4th quadrant identity. Replaced 2026-05-10 with "Open Source Engineer" + warm amber accent + GitBranch icon + the new `<Contributions>` data section. No content module references the old field string.
- The hand-rendered manual `<div className="border-t border-zinc-600" />` dividers in QuadrantInterface's left column. Replaced with Tailwind `divide-y` utility, which only paints between visible siblings — solving the orphan-divider problem when a list component returns null on empty filter results.
- The 43 KB principal-engineering CLAUDE.md template that was project-locally committed at the start of the 2026-05-10 session. Replaced with a 4.3 KB project-specific CLAUDE.md; the principal-engineering personality lives at `~/.claude/CLAUDE.md` globally.
