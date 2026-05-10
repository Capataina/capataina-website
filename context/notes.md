*Captured 2026-05-10 against the pre-restructure flat `src/` layout. A major restructure (file reorganisation + content rewrite + 4th-quadrant replacement) is imminent in the same session — both files will be regenerated post-restructure.*

# Notes

Observations about the **current** codebase, including non-obvious decisions, sharp edges, drift, and TODOs visible in the source. Tagged with file + line where helpful.

## Project meta

- `CLAUDE.md` at the repo root is the principal-engineering personality (43 KB; checked into the repo). It is the per-project personality file, not a context document — `context/` exists separately for implementation memory.
- `README.md` is a single sentence: pointer to https://capataina.vercel.app and an invitation to leave suggestions. No project intent / scope / philosophy / roadmap content yet.
- Last commit before this session: `7450212` 2025-12-25 "Add Chrona project to highlighted projects". Project was dormant for ≈135 days before today's session.

## Active drift / TODOs visible in code

- **`QuadrantInterface.tsx` line 44** — the per-quadrant "Download CV" button is a stub: `onClick = () => { /* TODO: Implement CV download */ }`. The PortfolioCard's "Full Resume" button (`PortfolioCard.tsx` line 341) **does** work and links to `/cv/generic_cv.pdf`. Two CV download buttons, only one wired up.
- **`AccentColorContext` is unused.** `src/contexts/AccentColorContext.tsx` defines a `QuadrantTheme` state, a `setTheme` setter, and an `AccentColorProvider` that wraps the whole tree (`page.tsx` line 58). No component calls `useAccentColor()`. The actual theme swap is done by direct `root.style.setProperty` writes in `page.tsx` lines 25-51. The provider is scaffolding that was never wired up.
- **`Quadrant.tsx` `mousePosition` state is dead.** The throttled `handleMouseMove` (lines 124-140) writes `setMousePosition({ x, y })` but the `mousePosition` value is never read in the component's render. Leftover from a prior tilt/parallax effect that was removed.
- **Two lockfiles coexist.** Both `package-lock.json` (243 KB) and `pnpm-lock.yaml` (149 KB) are tracked. `pnpm-workspace.yaml` is also present declaring build-script policies. The npm lockfile is legacy — pnpm is the intended package manager going forward (the npm→pnpm migration is part of the restructure that is about to happen).
- **`pnpm-workspace.yaml` is malformed.** The `allowBuilds:` block has placeholder strings ("set this to true or false") rather than booleans — pnpm will reject this until the values are set explicitly to `true` / `false`.
- **`particleCount` comment is stale** (`ParticleNetwork.tsx` line 38): the comment says "reduced from 80 to 40 for performance" but the value on the next line is `240`.
- **`ParticleNetwork` mouse-repulsion comment is stale** (line 160): "Increased from 150" — current value is 450, comment is correct in direction but the whole comment block (lines 156, 160, 166) reads as a snapshot of a tuning session that never got cleaned up.
- **Misleading variable name `--accent-purple`.** The active accent variables in `globals.css` (lines 207-210) are still named `--accent-purple` even though they now hold whichever quadrant theme is active (purple/blue/green/red). All utility classes (`text-gradient-purple`, `accent-button`, etc.) bind to this name. Renaming would touch every `globals.css` utility plus every Tailwind-class consumer — left as-is for now.
- **Project URL with leading space** (`PortfolioCard.tsx` line 40): the Chrona project's `link` is `" https://github.com/Capataina/Chrona"` (note the leading space). Hasn't been noticed yet because anchor `href` strings tolerate the prefix in most browsers.

## Decisions visible in the source / commit history

- **`use client` for the entire route.** `page.tsx` line 1 — the whole app is client-rendered. This is forced by the interaction model (state lifted into `Home`, particle canvas, mousemove handlers, `useEffect`-driven CSS variable writes). No part of the page benefits from RSC; the layout is the only server component.
- **Hard-coded dark mode.** `<html className="dark">` (`layout.tsx` line 28). The `:root` light tokens in `globals.css` (lines 113-146) are never reached and are effectively dead weight from the shadcn scaffold.
- **Memoised motion variants for performance.** Established by commit `cbce0d2` "Refactor animation variants with useMemo for performance" (2025-12-18). Every component that animates declares variants via `useMemo(() => ({ ... }), [])` instead of inline objects. Pattern is consistent across `PortfolioCard`, `Quadrant`, `Project`, `Skill`, `Education`, `Certificate` — keep this convention when adding new motion-driven components.
- **Mousemove throttling at 32ms.** `Quadrant.tsx` line 126: `if (now - lastUpdateRef.current < 32) return;`. Targets ≈30 fps. The throttled state isn't currently consumed (see "dead state" above) but the convention is in place if someone re-introduces tilt.
- **`field`-string filtering**, not `fieldKey` enum. Each content data file lists the **full label string** ("Systems & Infrastructure Engineer" etc.) in `fields: string[]`, and components filter via `array.includes(field)`. Trade-off: any rename of a quadrant label is a multi-file find-and-replace across `src/projects/`, `src/skills/`, `src/educations/`, `src/certificates/` plus `page.tsx`. The flat label-string keys this directly to the human-readable text — there is no separate symbolic key.
- **Centre-attraction added late** to ParticleNetwork (commit `80d9fe4`, 2025-12-25). Earlier versions had no centre force and particles eventually clustered along edges due to the toroidal wrap. Friction was simultaneously adjusted from a stronger value to `0.99` per the commit message. The combination is what gives the network its current "loose orbit around the middle" feel.
- **Highlighted projects on the PortfolioCard are hand-curated and decoupled from `src/projects/`.** `PortfolioCard.tsx` lines 15-44 hardcode `Nyquestro`, `Image Browser`, `Vynapse`, `Chrona` with their own `title / icon / link / description`. None of these reference the corresponding `src/projects/*.ts` modules — descriptions and even icons can drift independently of the canonical project data. Adding a project to `src/projects/` does NOT add it to the front card.

## Inferred conventions for adding content

- New project: `src/projects/<slug>.ts` exporting `{ title, date, fields, links, description, techStack?, technicalDetails }` → import in `Projects.tsx` lines 3-14, append to the `allProjects` array (lines 21-34).
- New skill: `src/skills/<slug>.ts` exporting `{ name, fields, subskills, bulletPoints }` → import in `Skills.tsx` lines 4-15, append to `allSkills` (lines 22-35).
- New education / certificate: same pattern in `Educations.tsx` / `Certificates.tsx`.
- The `fields` strings must match the labels in `page.tsx` exactly — there is no validation, so a typo silently filters the entry out of every quadrant.

## Quadrant labels (current; one is about to be replaced)

| Position | Label (used as `field` filter key) | Theme key in CSS |
|---|---|---|
| 1 | Systems & Infrastructure Engineer | `systems` |
| 2 | Applied AI & ML Infrastructure Engineer | `ai` |
| 3 | Low Level Financial Systems Engineer | `finance` |
| 4 | Product & Full Stack Engineer | `fullstack` |

The 4th quadrant ("Product & Full Stack Engineer" / `fullstack`) is being replaced with an "Open Source" identity in the imminent restructure. This will require: (a) renaming the theme key + accent triplet in `globals.css`, (b) the `positionToTheme` map in `page.tsx`, (c) the `labelIconMap` in `Quadrant.tsx`, (d) the literal label strings on every `fields[]` entry across `src/projects/` `src/skills/` etc., and (e) the `QuadrantTheme` union in `AccentColorContext.tsx`.

## shadcn / UI primitives

- `components.json` declares: style `"new-york"`, base colour `"neutral"`, RSC `true`, lucide as the icon library, alias `@/components/ui` for primitives.
- Only two primitives have been generated into `src/components/ui/`: `accordion.tsx` (uses `@radix-ui/react-accordion`) and `badge.tsx` (uses `@radix-ui/react-slot`, `class-variance-authority`).
- All other UI is hand-rolled (`PortfolioCard`, `Quadrant`, `QuadrantInterface`, etc.) — shadcn primitives are leaf-level only. Don't expect shadcn-style theming hooks elsewhere.

## Build / lint posture

- `next.config.ts` is empty default — no custom config, no headers, no image domains, no experimental flags.
- `eslint.config.mjs` extends `eslint-config-next/core-web-vitals` + `.../typescript` flat config; default Next ignore list applied.
- `package.json` scripts are stock Next: `dev`, `build`, `start`, `lint`. No format script, no typecheck script, no test script.
- No CI workflow committed.
- `tsconfig.json` is strict; `target: ES2017`, `moduleResolution: bundler`, `paths: { "@/*": ["./src/*"] }`.
