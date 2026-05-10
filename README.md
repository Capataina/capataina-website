# capataina-website

The source for [capataina.vercel.app](https://capataina.vercel.app) — a personal portfolio site organised as a 4-quadrant interactive shell, with each quadrant carrying a different engineering identity (systems, AI/ML, low-level finance, open source) and a content layer that feeds them all from typed TypeScript modules.

## Stack

- **Next.js 16** (App Router, Turbopack, single static route)
- **React 19** (concurrent rendering)
- **TypeScript 5** with `strict: true`
- **Tailwind 4** + **shadcn/ui** (Radix primitives) + custom OKLCH accent triplets
- **Motion** (formerly Framer Motion) for animation; canvas-based ParticleNetwork for the background
- **pnpm** as the package manager (managed by `packageManager` field + `pnpm-workspace.yaml`)
- Deployed on **Vercel**

## Run

```bash
pnpm install                # one-time
pnpm dev                    # dev server at http://localhost:3000
pnpm build                  # production build
pnpm start                  # serve the production build
pnpm lint                   # eslint
pnpm analyze                # production build with bundle analyzer (ANALYZE=true)
```

## Project structure

```
src/
├── app/                 # Next.js App Router shell (page.tsx, layout.tsx, globals.css)
├── components/
│   ├── ui/              # shadcn primitives (accordion, badge — leave alone)
│   ├── shell/           # PortfolioCard, Quadrant, QuadrantInterface, ParticleNetwork
│   ├── projects/        # Project (single card) + Projects (filtered list)
│   ├── skills/          # Skill + Skills
│   ├── educations/      # Education + Educations
│   ├── certificates/    # Certificate + Certificates
│   └── open-source/     # Contribution + Contributions
├── content/             # the data layer — typed against src/types/
│   ├── projects/        *.ts modules, one per project
│   ├── skills/          one per skill territory
│   ├── educations/      one per degree
│   ├── certificates/    one per certificate
│   └── open-source/     one per OSS engagement
├── types/               # canonical shapes (Field / Project / Skill / Education / Certificate / Contribution)
└── lib/                 # cn() utility from shadcn

context/                 # implementation memory — architecture.md + notes.md
public/                  # cv, fonts (Satoshi), and any future static assets
```

## Adding content

Every content surface is a single typed `.ts` module under `src/content/`. The component layer auto-discovers via per-section list components (`Projects.tsx`, `Skills.tsx`, etc.) — adding a new entry is one file + one import.

### Add a new project

1. Create `src/content/projects/<slug>.ts`:
   ```ts
   import type { Project } from "@/types";

   export const myProject: Project = {
     title: "...",
     date: "...",
     fields: ["Systems & Infrastructure Engineer"],   // one or more quadrant labels
     links: { github: "https://github.com/..." },
     description: ["..."],
     techStack: "Rust, ...",
     technicalDetails: ["...", "..."],
   };
   ```
2. Import + register in `src/components/projects/Projects.tsx`'s `allProjects` array.

The same pattern applies to skills, educations, certificates, and open-source contributions — each has its own typed shape in `src/types/` and its own list component.

### Quadrant labels (canonical strings)

`fields` arrays must use these exact strings — they're a discriminated union in `src/types/field.ts`:

- `"Systems & Infrastructure Engineer"`
- `"Applied AI & ML Infrastructure Engineer"`
- `"Low Level Financial Systems Engineer"`
- `"Open Source Engineer"`

Cross-list across multiple where natural (e.g. Nyquestro is both Systems and Finance).

## Theming model

Each quadrant has an OKLCH accent triplet defined in `globals.css`:

```css
--accent-systems    : oklch(0.65 0.08 285);   /* purple */
--accent-ai         : oklch(0.65 0.08 230);   /* blue   */
--accent-finance    : oklch(0.65 0.08 150);   /* green  */
--accent-opensource : oklch(0.7  0.10  65);   /* amber  */
```

`page.tsx` writes `--accent-purple` / `--accent-purple-dim` / `--accent-purple-glow` directly onto `documentElement` based on hovered/selected quadrant. The whole app reacts via CSS custom-property cascading — no React state for theme, no rerenders, smooth interpolation via the `--accent-transition-duration` custom property.

## Performance discipline

The site keeps its visual richness (animations, particle network, motion variants) while applying the cheap optimisations:

- ParticleNetwork is `dynamic`-imported with `ssr: false` and pauses its rAF loop when scrolled off-screen via IntersectionObserver
- Quadrants use `contain: layout style paint` so hover/select state changes don't cascade paints across the full document
- `next.config.ts` has `optimizePackageImports: ['lucide-react', 'motion']` so only referenced symbols ship
- List cards are `React.memo`-wrapped with `useMemo`-cached motion variants
- `useReducedMotion` is honoured for users with `prefers-reduced-motion: reduce` (the floating PortfolioCard bounce stops)

Run `pnpm analyze` to inspect the bundle visually if you're adding heavy dependencies.

## Deployment

Pushes to the `master` branch deploy to Vercel automatically. The site is static — `pnpm build` produces the prerendered output, no runtime server, no API routes.

## Notes

The repo's `context/` folder holds implementation memory (`architecture.md`, `notes.md`) — read these first when picking up the project after a break. They were captured by a documentation pass and refresh on substantial structural changes.
