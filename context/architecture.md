*Captured 2026-05-10 against the pre-restructure flat `src/` layout. A major restructure (file reorganisation + content rewrite + 4th-quadrant replacement) is imminent in the same session — both files will be regenerated post-restructure.*

# Architecture

## Purpose

Single-page interactive personal portfolio for Ata Caner Cetinkaya ("Capataina"). The site presents Caner across four engineering identities through a 2x2 quadrant grid; clicking a quadrant expands it into a full-screen "interface" panel showing the projects, education, certificates, and skills tagged for that identity. Deployed at https://capataina.vercel.app.

The site is a single route (`/`) — there is no per-project sub-page, no blog, no sub-navigation. All content lives in TypeScript data modules, filtered into the active quadrant by string-matching against a `fields: string[]` tag on each item.

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js `16.0.10` (App Router) | `package.json` line 18; `src/app/` only |
| React | `19.2.1` | concurrent features available; no use of Server Components beyond layout (page is `"use client"`) |
| Language | TypeScript 5 (strict) | `tsconfig.json` line 7; `paths: { "@/*": ["./src/*"] }` |
| Styling | Tailwind CSS v4 + custom CSS variables | `@import "tailwindcss"` + `@theme inline { ... }` in `src/app/globals.css` |
| UI primitives | shadcn/ui (`new-york` style, `neutral` base) | `components.json`; only `Accordion` and `Badge` installed under `src/components/ui/` |
| Animation | `motion/react` (Framer Motion v12) | named `motion` in `package.json`; `motion`, `AnimatePresence`, `whileHover`, `layout` |
| Icons | `lucide-react` | quadrant icons (`Cpu`, `Brain`, `Database`, `Code`), action icons (`Download`, `X`, `Github`, `Linkedin`, `ExternalLink`) |
| Fonts | Local Satoshi Variable | `src/app/layout.tsx` lines 5-15; served from `public/fonts/Satoshi-Variable.woff2`, exposed as `--font-satoshi` |
| Utility | `clsx` + `tailwind-merge` via `cn` helper | `src/lib/utils.ts` |
| Package manager | pnpm (workspace file present) + npm lockfile lingering | both `pnpm-lock.yaml` and `package-lock.json` in tree; `pnpm-workspace.yaml` declares build-script policies for `sharp` / `unrs-resolver` |
| Deployment | Vercel | per `README.md` |

`next.config.ts` is empty default — no image domains, redirects, headers, or experimental flags configured.

## Routing — Next App Router shape

```
src/app/
├── layout.tsx     # RootLayout: <html lang="en" className="dark"> + Satoshi font + metadata
├── page.tsx       # Single client-side route ("/") — quadrant grid host
└── globals.css    # Tailwind theme + dark-mode tokens + accent-color variables + utility classes
```

- `metadata.title = "Capataina Portfolio"`, `metadata.description = "Portfolio website of Capataina"` (`layout.tsx` lines 17-20).
- `<html>` is hard-coded `className="dark"` — no light-mode toggle; everything in `globals.css` `:root` is effectively dead. All real tokens live under `.dark { ... }` (lines 148-214).
- `page.tsx` is `"use client"`; the entire site is a client component tree under `<AccentColorProvider>`.

## Top-level repository structure (current flat src/)

```
capataina-website/
├── CLAUDE.md                  # principal-engineering personality (project-checked, 43 KB)
├── README.md                  # one-line pointer to the deployed site
├── components.json            # shadcn config
├── next.config.ts             # empty default
├── eslint.config.mjs          # next/core-web-vitals + next/typescript flat config
├── postcss.config.mjs         # @tailwindcss/postcss only
├── package.json
├── package-lock.json          # npm lockfile (legacy — coexists with pnpm-lock.yaml)
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json              # @/* → ./src/*
├── public/
│   ├── cv/generic_cv.pdf      # served at /cv/generic_cv.pdf, linked from PortfolioCard
│   └── fonts/Satoshi-Variable.woff2  (+ unzipped satoshi/ + satoshi.zip)
└── src/
    ├── app/                   # Next routes (3 files)
    ├── components/            # 12 feature components + ui/ shadcn primitives
    ├── components/ui/         # accordion.tsx, badge.tsx (shadcn-generated; do not author by hand)
    ├── contexts/              # AccentColorContext.tsx
    ├── lib/                   # utils.ts (cn helper)
    ├── projects/              # 12 project data modules
    ├── skills/                # 12 skill data modules
    ├── educations/            # 1 education data module
    └── certificates/          # 5 certificate data modules
```

The flat-folder pattern is the central convention: every content type has its own sibling directory under `src/`, every entry is a single `.ts` file exporting one named const, and the rendering component imports each entry by name.

## Quadrant interaction model

Three orthogonal interaction states, all driven from `src/app/page.tsx`:

```
state space        ┌─ hoveredQuadrant: 1 | 2 | 3 | 4 | null
                   ├─ selectedQuadrant: 1 | 2 | 3 | 4 | null
                   └─ activeQuadrant = selectedQuadrant ?? hoveredQuadrant
```

**Layout response** (computed in `Quadrant.tsx` lines 143-191, memoised):

| Condition | Self size | Other quadrants |
|-----------|-----------|-----------------|
| Nothing hovered, nothing selected | 50% × 50% | 50% × 50% |
| `isHovered` (this quadrant) | 55% × 55% | sibling sharing row/col gets 55% on shared axis, others 45% |
| Some other quadrant hovered | shrinks to 45% on the non-shared axis | hovered one expands |
| `isSelected` (this quadrant) | 80% × 80% | each squashed to 80%/20% according to whether they share the selected one's row or column |
| Some other quadrant selected | 20% on non-shared axis, 80% on shared axis | selected one fills 80% × 80% |

Spring transition: `{ stiffness: 500, damping: 25 }` (`Quadrant.tsx` lines 45-52).

**Visual content per state**:

```
isSelected → <QuadrantInterface />          (full panel: header bar + content area)
isAnyOtherSelected → <Icon />               (Lucide icon for this quadrant's role)
default → <h2>{label}</h2>                  (text-gradient-purple title)
```

`AnimatePresence mode="popLayout"` wraps the swap (`Quadrant.tsx` line 218) so the icon/label/interface cross-fade in place rather than reflowing the parent.

**Quadrant-position → role mapping** (hard-coded; `page.tsx` lines 13-18 + `Quadrant.tsx` lines 9-14):

| Position | Theme key | Lucide icon | Label |
|----------|-----------|-------------|-------|
| 1 (top-left) | `systems` | `Cpu` | "Systems & Infrastructure Engineer" |
| 2 (top-right) | `ai` | `Brain` | "Applied AI & ML Infrastructure Engineer" |
| 3 (bottom-left) | `finance` | `Database` | "Low Level Financial Systems Engineer" |
| 4 (bottom-right) | `fullstack` | `Code` | "Product & Full Stack Engineer" |

The `field` value passed down to `Projects` / `Skills` / `Educations` / `Certificates` is the **label string** (not the theme key), and that exact string is what each data module's `fields: string[]` is matched against.

## Data layer (flat-folder per-content-type)

Every content type follows the same shape:

```
src/<type>/<slug>.ts   →   export const <camelCase> = { fields: string[], ... }
```

The owning rendering component imports every module by name into a literal array and filters by `field`:

```ts
// e.g. src/components/Projects.tsx lines 21-43
const allProjects = [imageBrowser, tectra, vynapse, ...];
const projects = useMemo(
  () => allProjects.filter(p => p.fields.includes(field)).sort((a,b) => a.title.localeCompare(b.title)),
  [field]
);
```

Adding new content = create file under `src/<type>/`, add to the import + array literal in the matching rendering component. There is no glob, no manifest, no auto-discovery — each new entry requires touching the index in two places (import statement + array spread).

**Content-type schemas** (inferred from data files):

| Type | Folder | Count | Schema |
|------|--------|-------|--------|
| Project | `src/projects/` | 12 | `{ title, date, fields[], links: { github?, website? }, description[], techStack?, technicalDetails[] }` |
| Skill | `src/skills/` | 12 | `{ name, fields[], subskills[], bulletPoints[] }` |
| Education | `src/educations/` | 1 | `{ title, location, degree, date, fields[], bullets[] }` |
| Certificate | `src/certificates/` | 5 | `{ title, fields[], company, degrees[], skills[] }` |

No shared `types.ts` — every component re-declares its prop interface inline. Schemas drift independently per file (`description` on Project vs `bullets` on Education vs `bulletPoints` on Skill).

## Component hierarchy

```
src/app/page.tsx (Home)
└── AccentColorProvider                       (src/contexts/AccentColorContext.tsx)
    ├── ParticleNetwork                       (canvas background, fixed inset, opacity 0.4)
    ├── PortfolioCard                         (centred 600px card; visible iff selectedQuadrant === null)
    │   └── highlightedProjects: HighlightedProject[]   (HARDCODED — independent of src/projects/)
    │       ├── Nyquestro
    │       ├── Image Browser
    │       ├── Vynapse
    │       └── Chrona
    │   ├── socials (GitHub, LinkedIn)
    │   ├── "Full Resume" download → /cv/generic_cv.pdf
    │   └── dynamic description (default text or hovered-project.description)
    ├── Quadrant pos=1 …                      (4 instances, one per role)
    │   └── AnimatePresence
    │       ├── isSelected:        <QuadrantInterface field={label} />
    │       ├── shouldShowIcon:    <Icon /> (lucide)
    │       └── default:           <h2>{label}</h2>
    └── (siblings share state via lifted hoveredQuadrant / selectedQuadrant)

QuadrantInterface  (src/components/QuadrantInterface.tsx)
├── Header bar (border-b accent-border)
│   ├── X close button
│   ├── <h2>{field}</h2>
│   └── "Download CV" button (TODO — onClick is a stub, line 44)
└── Content area (flex gap-4)
    ├── Left column 70%
    │   ├── Educations field={field}     → filters [universityOfYork]
    │   ├── divider
    │   ├── Projects field={field}       → filters 12 projects
    │   ├── divider
    │   └── Certificates field={field}   → filters 5 certificates
    └── Right column 30%
        └── Skills field={field}         → filters 12 skills (Accordion)
```

`Projects` / `Skills` / `Educations` / `Certificates` are all `memo(...)` components. Each owns its own data import wall and filter pipeline.

`Project`, `Skill`, `Education`, `Certificate` (singular) are `memo(...)` row renderers. Project + Skill + Education + Certificate all use a `Technical Details` / `Highlights` / `View Details` accordion (`@/components/ui/accordion` — Radix `@radix-ui/react-accordion`). Skill + Certificate use Badge for chip lists.

## Theming model

The accent system is split across three layers:

**Layer 1 — static palette in `globals.css` `.dark` block** (lines 181-205):

```
--accent-default        oklch(0.5  0.02 0  )    grey
--accent-systems        oklch(0.65 0.08 285)    muted purple/lilac
--accent-ai             oklch(0.65 0.08 230)    muted blue
--accent-finance        oklch(0.65 0.08 150)    muted green
--accent-fullstack      oklch(0.65 0.08 25 )    muted red
```

Each of the 5 themes ships a triplet: base, `-dim`, and `-glow` (with alpha). Same lightness/chroma/hue convention across all four quadrants — only the hue rotates.

**Layer 2 — active variables resolved at runtime** (lines 207-210):

```
--accent-purple        ← always points at the currently active theme's base
--accent-purple-dim
--accent-purple-glow
```

The variable name is misleadingly fixed as `purple` (legacy from when the default was purple); every utility class binds to `--accent-purple`, not to a theme-specific variable. Theme switching = rewriting these three CSS vars on `document.documentElement` from `page.tsx` `useEffect` (lines 25-51) whenever `hoveredQuadrant || selectedQuadrant` changes.

**Layer 3 — utility classes consuming `--accent-purple*`** (`globals.css` lines 276-356):

| Class | Effect |
|-------|--------|
| `.text-gradient-purple` | `linear-gradient(135deg, accent → mix → accent)` clipped to text |
| `.icon-gradient` | `stroke: var(--accent-purple)` + drop-shadow with `--accent-purple-glow` |
| `.cv-button` | gradient fill from base → dim |
| `.accent-button` | translucent base over transparent (`color-mix 10%` → `20%` on hover) |
| `.accent-border` | `border-color: color-mix(--accent-purple 20%, transparent)` |
| `.accent-text` / `.accent-text-hover` | text colour mixed with white (60% on resting, 100% on hover) |
| `.border-gradient` | layered backgrounds: solid panel + diagonal gradient border-box |
| `.gradient-bg` | flat `hsl(285, 6%, 15%)` page background |

`html` declares CSS-property transitions on `--accent-purple*` (lines 222-227) wrapped in `@supports (transition: --accent-purple 0.25s)` so accent swaps fade rather than snap on browsers that support property animation.

**`AccentColorContext`** (`src/contexts/AccentColorContext.tsx`) defines a `currentTheme` state + `setTheme` setter with type `QuadrantTheme = "default" | "systems" | "ai" | "finance" | "fullstack"`. Wraps the page tree but **is not actually consumed by any component** — the real theme swap happens via direct `root.style.setProperty` writes in `page.tsx`. The provider exists as scaffolding for a context-driven version that has not been wired up.

## Animation conventions

- **Framer Motion (`motion/react`)** is the only animation library — no GSAP, no CSS keyframes for component-level motion (CSS keyframes exist only for shadcn accordion + theme-level `float`/`shimmer`/`gradient-shift`/`pulse-subtle` utilities, of which only `pulse-subtle` is bound to `--animate-pulse-subtle`).
- **Memoised variants pattern**: every component with motion declares its variants via `useMemo(() => ({ ... }), [])` rather than inline objects. Established as a deliberate optimisation in commit `cbce0d2` "Refactor animation variants with useMemo for performance". Applies to `PortfolioCard`, `Quadrant`, `Project`, `Skill`, `Education`, `Certificate`.
- **Throttled mousemove**: `Quadrant.tsx` lines 124-140 throttle pointer-tracking inside a quadrant to `~32ms` (≈30 fps) using a `lastUpdateRef`. The tracked `mousePosition` is set into state but is not currently consumed for rendering — leftover from an earlier tilt/parallax effect that has been removed.
- **`AnimatePresence mode="popLayout"`** drives the icon ↔ label ↔ interface swap inside each quadrant (`Quadrant.tsx` line 218) so the AnimatePresence children share layout.
- **`layout="size"`** on the inner PortfolioCard wrapper (`PortfolioCard.tsx` line 285) enables size-only layout animation while the float keyframe drives `y: [0, -8, 0]` independently.
- **Spring vs duration**: spring transitions used for size/position changes (`Quadrant`, icon entry); explicit `duration` + `easeInOut` used for fades and label cross-fades.
- **Stagger via `delay: index * 0.04`**: bullet/badge lists animate in with index-based delays in `Project`, `Skill`, `Education`, `Certificate`.

## ParticleNetwork (background)

`src/components/ParticleNetwork.tsx` — 232 lines, full canvas-2D simulation:

- 240 particles initialised at random positions with low random velocities (line 39).
- **Spatial hash grid** with `cellSize = 120` for O(n) neighbour lookups (lines 53-72) — neighbour search returns the 3×3 cell block around a particle.
- **Per-frame physics**:
  - integrate position; wrap toroidally on screen edges (lines 94-101).
  - small random drift each frame (line 104-105).
  - **center-attraction** force scaled by distance-from-centre / max-distance (lines 107-125) — pulls particles harder the further they drift, prevents edge clustering. Added in commit `80d9fe4`.
  - **particle-particle repulsion** within radius 80 (lines 128-154).
  - **mouse repulsion** within radius 450 (lines 157-168) — global `mousemove` listener writes to `mouseRef`.
  - friction `* 0.99` per axis (lines 171-172).
- **Connections**: line drawn between any two particles within `maxDistance = 120`, opacity `(1 - dist/maxDistance) * 0.3`, colour `rgba(168, 150, 200, ...)` — a fixed lilac that does **not** participate in the accent-theme swap.
- Canvas is `position: absolute`, `inset: 0`, `pointer-events: none`, `opacity: 0.4`.

## Notable absent pieces

- No tests anywhere (no `__tests__/`, no `.test.tsx`, no Vitest/Jest config).
- No CI configuration committed (no `.github/workflows/`).
- No `loading.tsx`, `error.tsx`, `not-found.tsx` under `src/app/`.
- No image optimisation usage — `next/image` is not imported anywhere; portfolio relies on icons + text only.
- No analytics, no SEO beyond the title/description metadata.
- `README.md` is one sentence — minimal directional document.
