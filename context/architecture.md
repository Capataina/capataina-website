# Architecture

*Captured 2026-05-10 post-restructure. Replaces the pre-restructure baseline that was captured earlier the same day under the flat-src layout.*

## Scope / Purpose

Personal portfolio website at [capataina.vercel.app](https://capataina.vercel.app). Single static route. The page renders a 4-quadrant interactive shell — each quadrant carrying one of Caner's engineering identities (Systems / AI / Finance / Open Source). Hovering a quadrant nudges the floating PortfolioCard card; clicking a quadrant expands it to ~80% of the viewport and reveals the field-filtered set of educations + projects + open-source contributions + certificates on the left, and skills on the right.

The repo is a portfolio + design sandbox, not a product. The site values visual richness (animations, particles, quadrant springs) and the discipline that lets that richness ship cheaply (memoisation, code-splitting, IntersectionObserver pause, CSS containment).

## Repository Overview

- **Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript 5 strict, Tailwind 4, shadcn/ui (Radix primitives), `motion/react` (formerly Framer Motion), pnpm.
- **Build target:** static prerendered output. No API routes, no runtime server, no backend.
- **Deploy target:** Vercel via push-to-`master`.
- **Source-of-truth invariant:** the `Field` discriminated union in `src/types/field.ts` defines the four quadrant labels. Every content module's `fields` array references one or more of those exact strings. Compile-time enforcement.

## Repository Structure

```text
capataina-website/
├── CLAUDE.md                   # 4.3 KB project-local Claude guidance — hard
│                               # constraints + folder convention + gotchas.
│                               # Layered on top of the global ~/.claude/CLAUDE.md
│                               # principal-engineering personality.
├── README.md                   # ~5.7 KB project description, run instructions,
│                               # adding-content walkthrough, theming model
├── context/                    # implementation memory — this file + notes.md
├── public/
│   ├── cv/Resume.pdf           # served at /cv/Resume.pdf — the Resume button target
│   └── fonts/                  # Satoshi-Variable.woff2 (loaded via next/font/local)
├── src/
│   ├── app/                    # Next App Router (page.tsx, layout.tsx, globals.css)
│   ├── components/
│   │   ├── ui/                 # shadcn primitives (accordion, badge) — leave alone
│   │   ├── shell/              # PortfolioCard, Quadrant, QuadrantInterface, ParticleNetwork
│   │   ├── projects/           # Project (single card) + Projects (filtered list)
│   │   ├── skills/             # Skill + Skills
│   │   ├── educations/         # Education + Educations
│   │   ├── certificates/       # Certificate + Certificates
│   │   └── open-source/        # Contribution + Contributions
│   ├── content/                # typed data modules — one .ts per entry
│   │   ├── projects/           # 15 entries (Aurix, Cernio, NeuroDrive, Image
│   │   │                       #   Browser, Nyquestro, Tectra, Neuronika,
│   │   │                       #   Vynapse, Xyntra, Zyphos, Chrona, Consilium,
│   │   │                       #   AsteroidsAI, fraud-detection, personal-website)
│   │   ├── skills/             # 12 entries
│   │   ├── educations/         # 1 entry (University of York)
│   │   ├── certificates/       # 5 entries (CME Group, DataCamp, DeepLearning.AI,
│   │   │                       #   Google Developer, HackTheBox)
│   │   └── open-source/        # 6 entries (burn A-FINE, burn fold4d, burn
│   │                           #   TensorContainer, tinygrad LSTM, alloy
│   │                           #   JSON-RPC, game mods)
│   ├── types/                  # canonical shapes — Field union + 5 entry types
│   └── lib/utils.ts            # cn() utility from shadcn
├── next.config.ts              # optimizePackageImports for lucide + motion +
│                               #   bundle-analyzer wiring
├── pnpm-workspace.yaml         # allowBuilds: sharp + unrs-resolver (pnpm 11
│                               #   approval gate — without this, install exits 1)
├── package.json                # packageManager: pnpm@11.0.9 + pnpm.onlyBuiltDeps
├── pnpm-lock.yaml
├── tsconfig.json               # strict, paths: { @/* : ./src/* }
├── eslint.config.mjs           # eslint-config-next
├── postcss.config.mjs
├── components.json             # shadcn config
└── .gitignore
```

## Subsystem Responsibilities

| Subsystem | Lives at | Owns | Stability |
|-----------|----------|------|-----------|
| **App shell** | `src/app/` | Next App Router entry, root layout, global CSS, font loading via `next/font/local`, runtime accent-CSS-variable swap on `documentElement` | stable |
| **Shell components** | `src/components/shell/` | The interactive surface: 4 quadrants, the floating PortfolioCard, the canvas ParticleNetwork background, the QuadrantInterface mounted on selection. The dense interaction logic (state machine, layout choreography, accent CSS swap) is the project's central subsystem and has its own canonical home at [`systems/quadrant-interaction.md`](systems/quadrant-interaction.md). | stable |
| **Content components** | `src/components/{projects,skills,educations,certificates,open-source}/` | One pair per content domain: a single-card component (`Project`, `Skill`, etc.) and a filtered-list component (`Projects`, `Skills`, etc.) that imports the data modules and field-filters them | stable |
| **Content data layer** | `src/content/` | Typed `.ts` modules — one per entry. The list components import these directly. No CMS, no API — content lives in the source tree under TypeScript type-checking | unstable (changes whenever a new project / skill / contribution lands) |
| **Type layer** | `src/types/` | Canonical shapes: `Field` discriminated union, `Project`, `Skill`, `Education`, `Certificate`, `Contribution`. Every content module is annotated against these | stable |
| **shadcn primitives** | `src/components/ui/` | Radix-derived `Accordion` + `Badge`. Used by every list component for collapsible details + tag pills | stable (framework-supplied, do not edit) |

## Dependency Direction

```
                     ┌───────────────────┐
                     │  src/app/page.tsx │
                     │  (single route)   │
                     └─────────┬─────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
 ┌───────────────┐   ┌───────────────┐    ┌────────────────────┐
 │ ParticleNet   │   │ PortfolioCard │    │ Quadrant ×4        │
 │ (canvas back- │   │ (floating)    │    │ (interactive grid) │
 │  ground)      │   └───────────────┘    └──────────┬─────────┘
 └───────────────┘                                   │ on select
                                                     ▼
                                          ┌──────────────────────┐
                                          │ QuadrantInterface    │
                                          │ (mounted in selected │
                                          │  quadrant)           │
                                          └──────────┬───────────┘
                                                     │ field-filtered
            ┌────────────────────┬───────────────────┼──────────────────┬───────────────────┐
            ▼                    ▼                   ▼                  ▼                   ▼
      ┌──────────┐         ┌──────────┐        ┌──────────────┐    ┌──────────┐      ┌────────────┐
      │ Educations│         │ Projects │        │ Contributions│    │ Skills   │      │Certificates│
      └─────┬────┘         └────┬─────┘        └──────┬───────┘    └────┬─────┘      └─────┬──────┘
            │ imports           │ imports             │ imports         │ imports          │ imports
            ▼                   ▼                     ▼                 ▼                  ▼
       content/            content/             content/           content/           content/
       educations/         projects/            open-source/       skills/            certificates/
       *.ts                *.ts                 *.ts               *.ts               *.ts
```

Direction is one-way: app shell → shell components → list components → typed content modules → types. Nothing in `content/` or `types/` imports anything from `components/` or `app/`. The types layer is the only thing imported by every other layer.

## Core Execution / Data Flow

**Initial render (cold load):**

1. Browser requests `/`. Vercel serves the prerendered HTML from `pnpm build`.
2. Hydration kicks in. `app/page.tsx` runs as a client component (`"use client"`).
3. `ParticleNetwork` is `dynamic()`-imported with `ssr: false`, so it's split into its own chunk and loaded after the initial paint. The canvas physics + grid + animation loop lives entirely browser-side.
4. `PortfolioCard` mounts and starts the floating-y bounce loop (skipped when `useReducedMotion()` reports true).
5. Four `Quadrant` components mount with their static `label` props passed from `page.tsx`. Each quadrant's outer `motion.div` carries `contain: layout style paint` so its hover / select state changes don't ripple paint passes outside its subtree.
6. The default accent CSS variables (`--accent-default-*`) are active. Page is interactive.

**Quadrant hover (no selection):**

1. User mouse enters quadrant N. `Quadrant.tsx` calls `onHoverChange(N)` from props.
2. `page.tsx` updates `hoveredQuadrant` state.
3. `useEffect` in `page.tsx` fires: it computes `theme = positionToTheme[hoveredQuadrant]` (one of `"systems" | "ai" | "finance" | "opensource"`) and writes `var(--accent-${theme})` to `document.documentElement.style` for `--accent-purple`, `--accent-purple-dim`, `--accent-purple-glow`.
4. CSS cascade fires. Every `text-gradient-purple`, `accent-text`, `accent-button`, `icon-gradient` class on the page interpolates to the new accent over `--accent-transition-duration`. The `PortfolioCard` also offsets (~2.5%) opposite to the hovered quadrant for a parallax effect.
5. Sibling quadrants resize to give the hovered one ~55% width/height; the rest tighten to ~45% on the same axis.

**Quadrant selection (click expand):**

1. User clicks quadrant N. `Quadrant.tsx` calls `onSelect(N)` and sets `selectedQuadrant`.
2. `page.tsx` re-runs the accent-swap effect (selected wins over hovered).
3. Selected quadrant resizes to ~80% × ~80%. Other three collapse to ~20% on each axis.
4. `PortfolioCard` opacity drops to 0 (`pointerEvents: "none"`); it's still mounted but invisible.
5. `QuadrantInterface` mounts inside the selected quadrant via `<AnimatePresence mode="popLayout">`. Header shows close button + the field label (centred) + a width-matching spacer. Body splits 70/30 into left content column + right skills column.
6. The 4 left-column list components (`Educations`, `Projects`, `Contributions`, `Certificates`) mount. Each one runs `useMemo(() => allEntries.filter(e => e.fields.includes(field as Type["fields"][number])).sort(...), [field])`. Empty results return `null` so the section disappears entirely (the `divide-y` Tailwind utility on the parent ensures no orphan dividers between hidden sections — see notes.md §Divider behaviour).
7. `Skills` mounts in the right column with the same field-filter pattern.
8. Each filtered card mounts via `<motion.li>` with `initial / animate` opacity + x stagger; `whileHover` shifts each line `x: 2` (no scale — see notes.md §Hover-clip fix history).

**Closing the selection:**

1. User clicks the close button or the dimmed background. `page.tsx` clears `selectedQuadrant`.
2. `QuadrantInterface` unmounts via AnimatePresence.
3. Quadrants spring back to 50%×50% (`spring stiffness: 500, damping: 25`). PortfolioCard fades back in.
4. Accent CSS variables resolve back to `--accent-default-*` if no quadrant is hovered.

## Inter-System Relationships

| Mechanism | Producer → Consumer | Data shape | Failure mode |
|-----------|---------------------|------------|--------------|
| **`Field` discriminated union** | `src/types/field.ts` → every list component + every content module | `"Systems & Infrastructure Engineer" \| "Applied AI & ML Infrastructure Engineer" \| "Low Level Financial Systems Engineer" \| "Open Source Engineer"` | A typo in any content module's `fields` array fails `tsc --noEmit`. The four quadrant labels in `page.tsx`'s `<Quadrant label="...">` props must also match these exact strings — no compile-time enforcement here, runtime will silently render a quadrant whose `field` filter matches no content. |
| **CSS custom-property cascade for theming** | `page.tsx` `useEffect` → `documentElement.style` → every `var(--accent-purple)` reader (gradients, icons, badges, buttons) | three CSS values per swap (`--accent-purple` + `-dim` + `-glow`) | Variables named `--accent-purple-*` for historical reasons but actually carry the active accent. Renaming would break the indirection layer, see notes.md §Theming gotcha. |
| **`field` prop into list components** | `QuadrantInterface` `field={label}` → `<Educations / Projects / Contributions / Certificates / Skills field={field} />` | string carrying the quadrant label | The `field: string` prop type is intentionally loose — the list components cast at the `.filter()` boundary via `field as X["fields"][number]`. The cast is honest because the producer (`page.tsx`) is hardcoded with the four canonical strings. |
| **Highlighted-projects independent array** | `PortfolioCard.tsx` const `highlightedProjects` (4 items) | local hardcoded shape — `{title, icon: LucideIcon, link, description}` | Decoupled from `src/content/projects/` by design — the floating card's curated 4 (Cernio, Aurix, NeuroDrive, Image Browser) is editorial, not derived. If a featured project is renamed in `content/projects/` but not here, the floating card silently keeps the old name. Worth wiring through `Project.featured?: boolean` later (the type field already exists). |
| **`Contribution.fields[]` filter ⟷ `<Contributions field>`** | content/open-source/*.ts → Contributions.tsx | `Field[]` — currently every contribution sets `["Open Source Engineer"]`, so contributions only ever appear in the 4th quadrant | If a contribution is field-tagged for a non-OSS quadrant, it'll appear there. Currently always single-tagged for OSS. |

## Critical Paths and Blast Radius

The single critical path is **quadrant click → 5-section mount with field-filter**. Tracing it end to end:

1. **Entry.** `Quadrant.onClick` event on the outer `motion.div`.
2. **State update.** `page.tsx` setSelectedQuadrant(N).
3. **Effect cascade.** `useEffect` writes 3 CSS custom properties to `documentElement`. CSS interpolation fires globally for ~250ms.
4. **Layout recompute.** All 4 quadrants recompute size via the `useMemo` chain in `Quadrant.tsx` (depends on `selectedQuadrant`, `hoveredQuadrant`, `position`, `isHovered`, `isAnyHovered`).
5. **AnimatePresence transition.** Old icon/label fades out; `QuadrantInterface` fades in.
6. **5 list components mount.** Each runs its memoised field-filter against its data array. Per-card `<motion.li>` mounts with stagger.
7. **Final paint.** Selected quadrant at ~80%, three others at ~20%, `QuadrantInterface` body visible, scrollable per column.

**Blast radius if the Field union changes:**
- Adding a 5th quadrant: requires (i) new Field literal + FIELDS tuple entry, (ii) globals.css OKLCH triplet, (iii) `page.tsx` positionToTheme map + 5th `<Quadrant label="...">`, (iv) `Quadrant.tsx` labelIconMap + icon import, (v) any content module that should appear there gets re-tagged. The grid layout machinery (`size` useMemo in `Quadrant.tsx`) currently assumes exactly 4 positions — would need restructuring.
- Removing/renaming a quadrant: every content module tagged with the old field becomes orphaned (won't render anywhere). Build still passes (the cast at `.filter()` allows any string), but the data is silently invisible. This is the failure mode the type system would help catch if `field: string` were tightened to `field: Field` everywhere — see notes.md §Type-tightening opportunity.

## State Ownership

| State | Owner | Scope |
|-------|-------|-------|
| `hoveredQuadrant: number \| null` | `page.tsx` (parent) | Drives accent CSS swap + sibling-quadrant size recompute + PortfolioCard parallax offset |
| `selectedQuadrant: number \| null` | `page.tsx` (parent) | Wins over hovered; drives the 80/20 expand layout + QuadrantInterface mount + PortfolioCard fade-out |
| `hoveredProject: number \| null` | `PortfolioCard` (local) | Swaps the description text under the chip row |
| `mousePosition` (canvas only) | `ParticleNetwork.tsx` `mouseRef` | Ref, not state — read inside the rAF loop for the mouse-repulsion force, never triggers a React re-render |
| `isVisibleRef` | `ParticleNetwork.tsx` ref | Toggled by IntersectionObserver; read inside the rAF loop to short-circuit work when off-screen |
| Accent CSS values | `documentElement.style` | DOM-side, not React state — bypasses re-renders for the theme swap |

No global React state, no context providers (AccentColorContext was deleted as unused). The two top-level pieces of state in `page.tsx` plus DOM-side CSS variables carry the entire interactive model.

## Structural Notes / Current Reality

- **One static route.** `src/app/page.tsx` is the only page. No nested routes, no API routes, no middleware. The `_not-found` route is Next's default.
- **No persistent state.** No SWR, no Zustand, no localStorage. Hover/select state is ephemeral; reload starts fresh.
- **No tests configured.** `package.json` has no test script. The discipline is `tsc --noEmit` + `pnpm build` for type/build correctness, plus manual browser smoke for visual correctness. CLAUDE.md flags this explicitly: type-check + build success ≠ visual correctness.
- **The 4th quadrant changed identity 2026-05-10.** Was "Product & Full Stack Engineer" with red accent (hue 25); now "Open Source Engineer" with warm amber accent (hue 65). Theme triplet renamed to `--accent-opensource-*`. Icon swapped from `Code` → `GitBranch`. Every content module's `fields` array was migrated; nothing references the old field string anymore.
- **The OSS quadrant is the only quadrant that uses `<Contributions>`.** Currently every contribution sets `fields: ["Open Source Engineer"]`. The Contributions component still appears in `QuadrantInterface`'s left-column stack regardless of which quadrant is open — `null`-return-on-empty + Tailwind `divide-y` ensure it doesn't render or produce orphan dividers when no contributions field-match.
- **The pnpm 11 build-script approval.** `pnpm-workspace.yaml` carries an `allowBuilds: { sharp: true, unrs-resolver: true }` block. Without it, `pnpm install` exits 1 with `ERR_PNPM_IGNORED_BUILDS`. The `pnpm.onlyBuiltDependencies` field in `package.json` is also set as a belt-and-braces but the workspace YAML is the file pnpm 11 actually reads. See notes.md §pnpm install gotcha.
- **Multiple lockfile warning.** Next dev warns about a `package-lock.json` at `~/package-lock.json` (user's home directory). It's unrelated to this project but Next picks it up via the workspace-root inference. Harmless — the project uses `pnpm-lock.yaml`. Can be silenced with `turbopack.root` in `next.config.ts` if it ever becomes a real issue.

## Coverage

This run inspected every first-party source file in the repository as part of the Phase 1-6 restructure that preceded this upkeep pass:

- **Inspected directly (every file read in full):** `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, every component in `src/components/{shell,projects,skills,educations,certificates,open-source}/`, every type in `src/types/`, every content module in `src/content/{projects,skills,educations,certificates,open-source}/`, `next.config.ts`, `tsconfig.json`, `package.json`, `pnpm-workspace.yaml`, `README.md`, `CLAUDE.md`, `eslint.config.mjs`, `postcss.config.mjs`.
- **Noted but not re-read this session:** `src/components/ui/accordion.tsx` and `src/components/ui/badge.tsx` (shadcn primitives — Radix-derived, framework-supplied, semantic intent stable across the shadcn ecosystem).
- **Inferred from structure:** none. First-party code is fully inspected; shadcn primitives are framework-supplied with well-known semantics.
- **Git history scoped:** `git log --format=fuller f664ae6^..HEAD` covering the 8 commits this session (commit hashes f664ae6 → 5dbfd02). Bodies inspected, not just subjects. The bodies are the highest-yield rationale source for this project — every Phase commit explains the design decisions in detail.

No subsystem is undocumented. The project's small surface area (single route, ~30 first-party files) means `architecture.md` + `notes.md` plus a single `systems/quadrant-interaction.md` for the densest subsystem is the proportionate context shape. Further splitting into per-folder systems files (one per content domain) would be padding — every other system fits as a row in the Subsystem Responsibilities table above.

See [`systems/quadrant-interaction.md`](systems/quadrant-interaction.md) for the deep dive on the central interaction subsystem (state machine, layout math, theming swap mechanism, dead-state and AccentColorContext deletion history).
