# capataina-website

> Personal portfolio website at **[capataina.vercel.app](https://capataina.vercel.app)** — a 4-quadrant interactive shell where each quadrant carries one of my engineering identities, backed by a typed content layer that turns "add a project" into a single TypeScript file edit.

[![Live site](https://img.shields.io/badge/live-capataina.vercel.app-blue?style=flat-square)](https://capataina.vercel.app)
[![Stack](https://img.shields.io/badge/stack-Next.js%2016%20%C2%B7%20React%2019%20%C2%B7%20TS%205%20%C2%B7%20Tailwind%204-black?style=flat-square)](#stack)
[![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-000?style=flat-square)](https://vercel.com)

---

## Table of contents

- [What it is](#what-it-is)
- [How it works](#how-it-works)
- [Stack](#stack)
- [Run it locally](#run-it-locally)
- [Project structure](#project-structure)
- [Adding content](#adding-content)
- [Quadrant labels (canonical strings)](#quadrant-labels-canonical-strings)
- [Theming model](#theming-model)
- [Performance discipline](#performance-discipline)
- [Accessibility](#accessibility)
- [Deployment](#deployment)
- [Implementation memory](#implementation-memory)
- [Acknowledgements](#acknowledgements)

---

## What it is

A single-route static site that renders four quadrants representing four engineering identities:

| Position | Quadrant | Accent | Owns |
|----------|----------|--------|------|
| top-left | **Systems & Infrastructure Engineer** | muted purple (hue 285) | Cernio, Nyquestro, Tectra, Xyntra, Zyphos, Chrona, etc. |
| top-right | **Applied AI & ML Infrastructure Engineer** | muted blue (hue 230) | NeuroDrive, Image Browser, Vynapse, AsteroidsAI, Neuronika, Consilium, fraud-detection |
| bottom-left | **Low Level Financial Systems Engineer** | muted green (hue 150) | Aurix, Nyquestro, Tectra, fraud-detection |
| bottom-right | **Open Source Engineer** | warm amber (hue 65) | burn (A-FINE / fold4d / TensorContainer), tinygrad LSTM, alloy JSON-RPC, 18+ game mods |

Hovering a quadrant shifts the accent globally and nudges the floating "Hey, I'm Cap" card. Clicking a quadrant expands it to ~80% of the viewport and reveals four content sections — Education, Projects, Open Source Contributions, Certificates — plus a Skills column on the right, all field-filtered to that quadrant's identity.

Behind the four quadrants, a canvas-based **ParticleNetwork** renders 240 mouse-reactive particles with center-attraction physics, wrap-around boundaries, and grid-based spatial partitioning for connection-line drawing.

## How it works

```
                     ┌──────────────────┐
                     │  src/app/page    │  ← single static route
                     └────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
  ┌──────────┐         ┌─────────────┐      ┌──────────────┐
  │ Particle │         │ Portfolio   │      │ 4 × Quadrant │
  │ Network  │         │ Card        │      │ (state machine│
  │ (canvas) │         │ (floating)  │      │  + spring layout)│
  └──────────┘         └─────────────┘      └──────┬───────┘
                                                   │ on click
                                                   ▼
                                          ┌────────────────────┐
                                          │ QuadrantInterface  │
                                          │ field={quadrant}   │
                                          └────────┬───────────┘
                                                   │ field-filter
                ┌──────────────┬───────────────────┼──────────────────┬───────────────────┐
                ▼              ▼                   ▼                  ▼                   ▼
          ┌──────────┐  ┌──────────┐        ┌──────────────┐    ┌──────────┐      ┌────────────┐
          │Educations│  │ Projects │        │Contributions │    │  Skills  │      │Certificates│
          └─────┬────┘  └────┬─────┘        └──────┬───────┘    └────┬─────┘      └─────┬──────┘
                │            │ imports             │                  │                  │
                ▼            ▼                     ▼                  ▼                  ▼
            content/    content/             content/           content/           content/
            educations  projects             open-source        skills             certificates
            *.ts        *.ts                 *.ts               *.ts               *.ts
```

The flow is one-way: `page` → shell components → list components → typed content modules. Nothing in `content/` or `types/` imports anything from `components/` or `app/`. Adding a new project is **one file** under `content/projects/`, one import line in `Projects.tsx`, and the rest is the type system + the field-filter doing its job.

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Next.js 16** | App Router, Turbopack, single static prerendered route |
| UI | **React 19** | concurrent rendering, all components are client components |
| Types | **TypeScript 5** | `strict: true`, `paths: { @/*: ./src/* }` |
| Styling | **Tailwind 4** + **shadcn/ui** (Radix primitives) | OKLCH accent triplets in CSS custom properties, swapped at runtime |
| Animation | **`motion/react`** (formerly Framer Motion) | every variant memoised; canvas physics is hand-rolled |
| Icons | **lucide-react** | tree-shaken via `experimental.optimizePackageImports` |
| Fonts | **Satoshi Variable** via `next/font/local` | served from `public/fonts/`, `display: swap` |
| Package manager | **pnpm 11** | strict approval gate via `pnpm-workspace.yaml allowBuilds` |
| Hosting | **Vercel** | auto-deploy on `master` push |

## Run it locally

```bash
# one-time
pnpm install

# dev server (Turbopack) at http://localhost:3000
pnpm dev

# production build (static prerender)
pnpm build

# serve the production build
pnpm start

# eslint
pnpm lint

# bundle analyzer (ANALYZE=true wraps the next build)
pnpm analyze
```

**pnpm gotcha:** if `pnpm install` exits 1 with `ERR_PNPM_IGNORED_BUILDS`, the build-script approval block in `pnpm-workspace.yaml` is missing or stale. The current file approves `sharp` and `unrs-resolver` (both ship platform-specific prebuilt binaries; the install scripts are no-ops on darwin-arm64 but pnpm 11 still gates on approval). Don't delete the `allowBuilds` block.

## Project structure

```
capataina-website/
├── CLAUDE.md                   # project-local Claude guidance (additive to ~/.claude/CLAUDE.md)
├── README.md                   # this file
├── context/                    # implementation memory (architecture.md, notes.md, systems/)
├── public/
│   ├── cv/Resume.pdf           # served at /cv/Resume.pdf — the Resume-button target
│   └── fonts/Satoshi-Variable.woff2
├── src/
│   ├── app/                    # Next App Router shell
│   │   ├── page.tsx            # the single route — owns hovered/selected state + accent CSS swap
│   │   ├── layout.tsx          # root HTML, font loading, metadata
│   │   └── globals.css         # OKLCH accent triplets, utility classes, card-glow styles
│   ├── components/
│   │   ├── ui/                 # shadcn primitives (accordion, badge — framework-supplied)
│   │   ├── shell/              # PortfolioCard, Quadrant, QuadrantInterface, ParticleNetwork
│   │   ├── projects/           # Project (single card) + Projects (filtered list)
│   │   ├── skills/             # Skill + Skills
│   │   ├── educations/         # Education + Educations
│   │   ├── certificates/       # Certificate + Certificates
│   │   └── open-source/        # Contribution + Contributions
│   ├── content/                # typed data modules — one .ts per entry
│   │   ├── projects/           # 15 entries
│   │   ├── skills/             # 12 entries
│   │   ├── educations/         # 1 entry (University of York)
│   │   ├── certificates/       # 5 entries (CME Group, DataCamp, DeepLearning.AI, Google, HackTheBox)
│   │   └── open-source/        # 6 entries (burn × 3, tinygrad, alloy, game mods)
│   ├── types/                  # canonical shapes — Field union + Project/Skill/Education/Certificate/Contribution
│   └── lib/utils.ts            # cn() utility from shadcn
├── next.config.ts              # optimizePackageImports + bundle-analyzer wiring
├── pnpm-workspace.yaml         # allowBuilds gate
├── package.json                # packageManager: pnpm@11.0.9
├── pnpm-lock.yaml
├── tsconfig.json               # strict, paths: { @/*: ./src/* }
├── eslint.config.mjs           # eslint-config-next
├── postcss.config.mjs
└── components.json             # shadcn config
```

## Adding content

Every content surface is a single typed `.ts` module under `src/content/`. The component layer doesn't auto-discover — adding a new entry is **one file + one import + one array entry**.

### Add a new project

1. Create `src/content/projects/<slug>.ts`:

   ```ts
   import type { Project } from "@/types";

   export const myProject: Project = {
     title: "Project Name — short tagline",
     date: "2025 – present",
     fields: ["Systems & Infrastructure Engineer"],   // one or more canonical strings
     links: {
       github: "https://github.com/Capataina/MyProject",
       website: "https://myproject.dev",   // optional
     },
     description: [
       "First bullet — what the project does at a high level",
       "Second bullet — why it's interesting / what's distinctive",
       "Third bullet — what's currently working / shipped",
     ],
     techStack: "Rust, Tokio, SQLite, ...",
     technicalDetails: [
       "Implementation detail 1 with specific concrete fact",
       "Implementation detail 2 with another specific fact",
     ],
   };
   ```

2. Register in `src/components/projects/Projects.tsx`:

   ```ts
   import { myProject } from "@/content/projects/my-project";
   // ...
   const allProjects: ProjectType[] = [
     // ... existing entries
     myProject,
   ];
   ```

3. Run `pnpm dev` and click into the matching quadrant — your project appears in the field-filtered list.

The same pattern applies to **skills**, **educations**, **certificates**, and **open-source contributions** — each has its own typed shape in `src/types/` and its own list component under `src/components/`.

### Add a new open-source contribution

OSS entries follow a slightly richer shape with status + metrics:

```ts
import type { Contribution } from "@/types";

export const myContribution: Contribution = {
  title: "Short title of the engagement",
  project: "owner/repo",
  date: "May 2026",
  fields: ["Open Source Engineer"],
  status: "open",   // "open" | "merged" | "closed" | "released"
  links: {
    pr: "https://github.com/owner/repo/pull/N",
    repo: "https://github.com/owner/repo",
  },
  description: [
    "What you contributed and why",
    "What landed / what's in review / what's queued",
  ],
  techStack: "Rust, ...",
  technicalDetails: [...],
  metrics: {
    linesOfCode: 1864,
    filesChanged: 10,
  },
};
```

**Verify status before committing.** PR / issue states change between sessions. Hit `gh api` first:

```bash
gh api repos/owner/repo/pulls/N --jq '{state, merged, additions, deletions, changed_files}'
```

## Quadrant labels (canonical strings)

`fields` arrays **must** use these exact strings — they're the four arms of a discriminated union in `src/types/field.ts`:

```ts
type Field =
  | "Systems & Infrastructure Engineer"
  | "Applied AI & ML Infrastructure Engineer"
  | "Low Level Financial Systems Engineer"
  | "Open Source Engineer";
```

A typo fails `tsc --noEmit`. Cross-list across multiple where natural — e.g. Nyquestro is `["Systems & Infrastructure Engineer", "Low Level Financial Systems Engineer"]`, NeuroDrive is both `Applied AI & ML` and `Systems`, fraud-detection is both `AI` and `Finance`.

## Theming model

Each quadrant has an OKLCH accent triplet defined in `src/app/globals.css`:

```css
--accent-systems    : oklch(0.65 0.08 285);   /* muted purple */
--accent-ai         : oklch(0.65 0.08 230);   /* muted blue   */
--accent-finance    : oklch(0.65 0.08 150);   /* muted green  */
--accent-opensource : oklch(0.7  0.10  65);   /* warm amber   */
```

The active accent is referenced through three indirection variables that the rest of the CSS reads from:

```css
--accent-purple      : var(--accent-default);   /* runtime-swapped per quadrant */
--accent-purple-dim  : var(--accent-default-dim);
--accent-purple-glow : var(--accent-default-glow);
```

When a quadrant is hovered or selected, `page.tsx`'s `useEffect` writes the matching `var(--accent-${theme})` into `document.documentElement.style` for each of the three indirection vars. Every `.text-gradient-purple`, `.icon-gradient`, `.accent-text`, `.accent-button` class on the page interpolates to the new accent over `--accent-transition-duration` (250ms). The whole app reacts via CSS custom-property cascading — no React state for theming, no rerenders, smooth interpolation handled by the browser.

> **Don't rename `--accent-purple-*`.** The name is historical (the original accent was purple); the variables now carry the *active* accent of whichever quadrant is foregrounded. Renaming would require updating every utility class consumer too. Treat the indirection as load-bearing.

## Performance discipline

The site preserves its full visual richness — 240 particles, motion variants, AnimatePresence transitions, the floating card bounce — while applying the cheap optimisations:

| Technique | Where | Effect |
|-----------|-------|--------|
| **Dynamic import + `ssr: false`** | `page.tsx` ParticleNetwork | code-splits the canvas physics out of the initial bundle; avoids hydration mismatches on the canvas API |
| **IntersectionObserver pause** | `ParticleNetwork.tsx` | rAF loop short-circuits when canvas is scrolled off-screen; same node count, just no CPU burned drawing pixels nobody sees |
| **`contain: layout style paint`** | each `Quadrant` outer `motion.div` | hover/select state changes don't ripple paint passes outside the quadrant's subtree |
| **`optimizePackageImports`** | `next.config.ts` for `lucide-react` + `motion` | tree-shakes per-icon and per-motion-component — only used symbols ship |
| **`memo()` wraps + `useMemo` motion variants** | every list-card and list component (10 files) | prevents prop-passing rerenders + reference-stable variants for motion's internal memoisation |
| **`@next/bundle-analyzer`** | wired via `pnpm analyze` | run after non-trivial dep adds to catch tree-shaking holes |

Run `pnpm analyze` periodically to verify nothing regressed; `pnpm build` should stay around 100–150 KB First Load JS for the static route.

## Accessibility

- **`useReducedMotion`** is honoured in `PortfolioCard.tsx` — when the OS reports `prefers-reduced-motion: reduce`, the floating y-bounce loop is skipped (default users see the unchanged animation; only OS-opted-out users get the still version).
- Every interactive element has an `aria-label` (close button, social links, project chips).
- Quadrant labels and project descriptions are real text (not embedded in images), screen-readable.
- Tab order follows the visual reading order: GitHub / LinkedIn → Resume button → highlighted-project chips → quadrant grid.
- Colour contrast on accent triplets clears WCAG AA against the dark background — the OKLCH lightness values (0.65–0.7) are deliberately above the AA threshold for primary text usage.

The Quadrant spring transitions and ParticleNetwork are deliberately preserved even under reduced-motion — they're load-bearing for the interaction model (quadrant resize is the primary affordance), not decorative.

## Deployment

Pushes to the `master` branch deploy to Vercel automatically. The site is **fully static** — `pnpm build` produces prerendered HTML for `/` and `/_not-found`, no runtime server, no API routes, no edge functions. First-load is a single HTML document plus the JS chunk.

If you want to self-host, the build output is a standard Next.js standalone output:

```bash
pnpm build && pnpm start
```

Or any static-file host can serve the `.next/standalone` output directly.

## Implementation memory

The `context/` folder holds the durable implementation memory:

- **`context/architecture.md`** — top-down structural map: subsystem responsibilities, dependency direction, core execution + data flow, inter-system relationships, critical paths + blast radius, state ownership.
- **`context/notes.md`** — design rationale, project preferences, conventions (memo wrap, useMemo for motion variants, Field cast at filter boundary), gotchas (`--accent-purple-*` indirection, pnpm 11 allowBuilds), deletion log, performance discipline summary.
- **`context/systems/quadrant-interaction.md`** — deep dive on the central interaction subsystem: state machine, layout math, spring physics, accent CSS swap mechanism, hover-clip + label-sizing + dead-state + AccentColorContext deletion histories.
- **`context/_staleness-report.md`** — snapshot from the last `upkeep-context` pass.

Read these first when picking the project up after a break — they capture the *why* and the *what's intentional vs accidental*.

## Acknowledgements

Built on the work of:

- [**Next.js**](https://nextjs.org) by Vercel — the App Router shell + Turbopack dev server.
- [**React**](https://react.dev) — concurrent rendering primitives.
- [**Tailwind CSS**](https://tailwindcss.com) — utility-first styling + the JIT/v4 engine that makes the OKLCH accent system feasible.
- [**shadcn/ui**](https://ui.shadcn.com) — the Accordion + Badge primitives are Radix-derived and contributed by the shadcn ecosystem.
- [**Radix UI**](https://radix-ui.com) — accessible component primitives underneath shadcn.
- [**motion**](https://motion.dev) (formerly Framer Motion) — animation variants, `AnimatePresence`, `useReducedMotion`.
- [**lucide-react**](https://lucide.dev) — the icon set (Cpu, Brain, Database, GitBranch, Terminal, etc.).
- [**Satoshi**](https://www.fontshare.com/fonts/satoshi) by Indian Type Foundry — the variable font.

The dynamic-accent-theming and quadrant-grid interaction patterns were designed and implemented from scratch for this project.

---

**Author:** Ata Caner Cetinkaya — [GitHub](https://github.com/Capataina) · [LinkedIn](https://www.linkedin.com/in/atacanercetinkaya/)
