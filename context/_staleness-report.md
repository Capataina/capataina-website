# Staleness Report

*Snapshot for the upkeep-context run on 2026-05-10. Overwritten on each run. Do not edit by hand.*

## Per-file staleness

| File | Verdict | Evidence |
|------|---------|----------|
| `context/architecture.md` | refreshed | Was stale (preamble explicitly noted "captured against the pre-restructure flat src/ layout"). Rewritten this run against the post-restructure feature-grouped folder layout, including the new content/ data layer, types/ canonical shapes, the Open Source 4th quadrant, and the optimisation pass (dynamic import, IntersectionObserver pause, CSS containment, optimizePackageImports). Cross-links to systems/quadrant-interaction.md. |
| `context/notes.md` | refreshed | Was stale on the same preamble. Rewritten with: hard constraints from the user's session (don't reduce particle count, don't remove animations), the three cross-cutting conventions (memo wrap, useMemo for motion variants, Field-cast at .filter() boundary), the --accent-purple-* indirection gotcha, the pnpm 11 allowBuilds requirement, the divider behaviour fix, the hover-clip fix history, the quadrant label sizing fix, OSS contribution status verification protocol, type-tightening opportunity, highlighted-projects decoupling, deletion log, performance discipline summary, external pointers. |
| `context/systems/quadrant-interaction.md` | created | New file added this run. Owns the deep dive on the central interaction subsystem — state machine (default / hovered / selected), per-quadrant size-recompute math, accent CSS swap mechanism, AnimatePresence transition discipline, spring physics parameters, the hover-clip + label-sizing + dead-state + AccentColorContext deletion histories. Created to satisfy the lint requirement that systems/ exists, AND because the content was the densest single topic in the previous architecture.md draft and warranted a canonical home. |
| `context/_staleness-report.md` | this file | Snapshot of the current run. |

## Coverage gap report

No uncovered subsystems found. The repository's first-party source code spans:

| Repository area | Inferred system | Covered? | Where |
|-----------------|-----------------|----------|-------|
| `src/app/` | App shell (Next router + global CSS) | yes | architecture.md §Subsystem Responsibilities, §Core Execution / Data Flow |
| `src/components/shell/` | Interactive surface (PortfolioCard, Quadrant, QuadrantInterface, ParticleNetwork) | yes | architecture.md §Subsystem Responsibilities, §Core Execution / Data Flow, §State Ownership |
| `src/components/{projects,skills,educations,certificates,open-source}/` | Per-feature list components | yes | architecture.md §Subsystem Responsibilities, §Inter-System Relationships |
| `src/components/ui/` | shadcn primitives (Accordion, Badge) | yes | architecture.md §Subsystem Responsibilities (noted as framework-supplied, do not edit) |
| `src/content/` | Typed data modules | yes | architecture.md §Subsystem Responsibilities, §Repository Structure |
| `src/types/` | Canonical shapes + Field union | yes | architecture.md §Inter-System Relationships, §Critical Paths and Blast Radius |
| `next.config.ts`, `pnpm-workspace.yaml`, `package.json` | Build + package config | yes | architecture.md §Repository Structure, notes.md §pnpm install gotcha |
| `globals.css` accent-CSS-variable system | Theming | yes | architecture.md §Inter-System Relationships, notes.md §Theming gotcha |

The project's small surface area (single static route, ~30 first-party source files, no backend) makes `architecture.md` + `notes.md` the proportionate context shape. Splitting into `systems/*.md` files would be padding — every "system" is small enough to fit as a row in `architecture.md`'s subsystem-responsibilities table.

## Files walked

2 markdown files under `context/` (excluding `_staleness-report.md` itself): `architecture.md`, `notes.md`. Both refreshed.

No `systems/`, `notes/`, `plans/`, or `references/` subdirectories exist; none warranted by the project's shape.
