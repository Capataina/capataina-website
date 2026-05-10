# capataina-website — project notes for Claude

This file is project-specific guidance layered on top of the global
`~/.claude/CLAUDE.md` principal-engineering personality. The global
provides the operating principles; this file captures the specifics
of working on the portfolio website.

## What this project is

Personal portfolio website at [capataina.vercel.app](https://capataina.vercel.app).
Single static route (`src/app/page.tsx`) rendering a 4-quadrant interactive
shell. Each quadrant carries one of Caner's engineering identities
(Systems / AI / Finance / Open Source); clicking a quadrant expands it to
fill the viewport and reveals the projects, skills, education, certificates,
and OSS contributions that field-tag-match that quadrant.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript 5 strict
- Tailwind 4 + shadcn/ui (Radix primitives) + custom OKLCH accent triplets
- Motion (`motion/react`) for variants + AnimatePresence
- pnpm package manager (managed by `packageManager` field + `pnpm-workspace.yaml`)

## Key project commands

```bash
pnpm install
pnpm dev                    # http://localhost:3000
pnpm build
pnpm lint
pnpm analyze                # bundle analyzer (ANALYZE=true) — read after big dep adds
```

## Folder conventions (post-restructure 2026-05-10)

```
src/
├── app/                 Next App Router shell
├── components/
│   ├── ui/              shadcn primitives — leave alone
│   ├── shell/           PortfolioCard, Quadrant, QuadrantInterface, ParticleNetwork
│   ├── projects/        Project + Projects (list)
│   ├── skills/          Skill + Skills
│   ├── educations/      Education + Educations
│   ├── certificates/    Certificate + Certificates
│   └── open-source/     Contribution + Contributions
├── content/             typed data layer — one .ts module per entry
└── types/               canonical shapes (Field, Project, Skill, Education, Certificate, Contribution)
```

The `field` strings in every data module **must** match the four canonical
quadrant labels — `Field` is a discriminated union in `src/types/field.ts`.
Cross-list across multiple where natural (Nyquestro = Systems + Finance, etc.).

## Hard constraints (user-stated, do not violate)

- **Never reduce ParticleNetwork node counts.** The current `particleCount = 240`
  is a deliberate choice. Optimisation = pause when off-screen / code-split /
  CSS-contain — never thin out the visual.
- **Never remove animations.** Motion variants, AnimatePresence transitions,
  the floating PortfolioCard bounce, the icon-spin hover effects — all stay.
  `useReducedMotion` is acceptable (it only affects users who explicitly
  opted out at the OS level).
- **Test the dev server in a browser before reporting UI work as done.**
  Type-checking + build success ≠ visual correctness.

## Working on the data layer

Adding a project / skill / education / certificate / contribution is a
two-file change: write the typed module under `src/content/<area>/` and
register it in the corresponding list component's `all*` array in
`src/components/<area>/<Area>.tsx`. The type system catches shape drift;
runtime field-filtering catches mis-tagging immediately when you visit
the relevant quadrant.

## OSS contributions

Live engagement state is tracked at the LifeOS vault
(`Capataina/LifeOS:Projects/Open Source Contributions/`) and the umbrella
repo `Capataina/OpenSourceContributions`. When updating
`src/content/open-source/`, verify live PR/issue state via `gh api` against
the upstream repo — statuses change between sessions and stale `status`
fields are misleading on a public-facing page.

## Theming gotcha

`globals.css` has historical `--accent-purple-*` variable names that get
swapped at runtime by `page.tsx` — they're the active accent the rest of
the CSS reads from, not literally "purple". Don't rename them; the swap
mechanism depends on the static name.

## What lives in `context/`

`context/architecture.md` and `context/notes.md` are implementation memory
captured by `upkeep-context` passes. Read these first when picking up the
project after a break. They get refreshed when the structural shape changes
(folder layout, theming model, content data shapes).
