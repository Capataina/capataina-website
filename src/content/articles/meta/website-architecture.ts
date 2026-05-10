import type { Article } from "@/types";

export const websiteArchitecture: Article = {
  slug: "capataina-website-architecture",
  title: "Building capataina.vercel.app: 4 quadrants, L-shapes, and a markdown renderer",
  type: "Dev Log",
  date: "2026-05-10",
  project: "Capataina Website",
  description:
    "This website is a single-page Next.js app with a 4-quadrant interaction model, an L-shape layout for the articles panel, an in-house markdown renderer with cascading TOC, and zero backend. The architecture, the interesting decisions, and what it cost to build.",
  tags: ["nextjs", "react", "tauri", "motion", "frontend"],
  body: `# Building capataina.vercel.app: 4 quadrants, L-shapes, and a markdown renderer

This website is the place where my engineering work gets explained. It is a single-page Next.js app deployed to Vercel's free tier. The interaction model is unusual: 4 quadrants representing my engineering identities, an L-shape layout for the articles panel, and an in-house markdown renderer with a cascading table of contents.

This is the dev log of how the site is built, what the interesting decisions were, and what each part of the architecture costs.

---

## TL;DR

| Property                              | Value                                          |
|---------------------------------------|------------------------------------------------|
| Framework                              | Next.js 16 (App Router, Turbopack)             |
| UI framework                            | React 19 + TypeScript 5 (strict)                |
| Styling                                 | Tailwind 4 + shadcn/ui (Radix primitives)       |
| Animation                                | motion/react (was framer-motion)                |
| Package manager                          | pnpm 11                                          |
| Backend                                  | none — fully static, hosted on Vercel free tier |
| Markdown renderer                         | react-markdown + remark-gfm + PrismAsyncLight  |
| Articles                                  | typed .ts files, no database                    |

---

## The four-quadrant interaction model

The home page is divided into four equal quadrants, one for each of my engineering identities:

\`\`\`
                  Default home page layout

   ┌─────────────────────────────────┬─────────────────────────────────┐
   │                                  │                                  │
   │   Systems & Infrastructure        │   Applied AI & ML                │
   │   Engineer                        │   Infrastructure Engineer        │
   │                                  │                                  │
   │   (Cpu icon)                      │   (Brain icon)                    │
   │                                  │                                  │
   ├─────────────────────────────────┼─────────────────────────────────┤
   │                                  │                                  │
   │   Low Level Financial             │   Open Source Engineer            │
   │   Systems Engineer                │                                  │
   │                                  │   (GitBranch icon)                │
   │   (Database icon)                  │                                  │
   │                                  │                                  │
   └─────────────────────────────────┴─────────────────────────────────┘

   + floating "Hi, I'm Cap!" card centered over the quadrants
\`\`\`

### What happens on hover

Hovering a quadrant grows it (50% → 55% in width and height), shrinks its neighbours, lights up its icon, and tints the page accent colour to that quadrant's theme. The accent variables (\`--accent-purple\`, \`--accent-purple-dim\`, \`--accent-purple-glow\`) get swapped via a \`data-quadrant-theme\` attribute on the page root.

### What happens on click

Clicking a quadrant selects it. The selected quadrant grows to 80% × 80%; the other three shrink to 20% × 20%. Inside the selected quadrant, a content panel opens with three lists:

\`\`\`
                  Selected quadrant layout

   ┌──────────────────────────────────────────┐  ┌──────┐
   │ Header bar: X close · "Systems & ..."     │  │  Q2   │
   ├──────────────────────────────────────────┤  ├──────┤
   │                                            │  │      │
   │  ┌─────────────────────┐  ┌─────────────┐│  │      │
   │  │ Education + Projects │  │  Skills     ││  │      │
   │  │ + Open Source Contri-│  │  accordion  ││  │      │
   │  │ butions + Certificates│  │             ││  │      │
   │  │                       │  │             ││  │      │
   │  │                       │  │             ││  │      │
   │  └─────────────────────┘  └─────────────┘│  │      │
   │                                            │  │      │
   │  (70% width)                  (30% width) │  │      │
   ├──────────────────────────────────────────┤  ├──────┤
   │  Q3                                        │  │  Q4   │
   └──────────────────────────────────────────┘  └──────┘
\`\`\`

Each list filters by which quadrants the entry is tagged for. A project tagged "Systems" only appears in the Systems quadrant. A project tagged "Systems + Open Source" appears in both. The filtering happens at the data-layer boundary via TypeScript's discriminated union.

---

## The L-shape articles layout

The articles button in the floating PortfolioCard opens a different layout. Instead of one quadrant growing, the four corner quadrants reshape into L-shapes that line the perimeter of the screen, and the central area becomes an 80% × 80% panel:

\`\`\`
                  Articles open layout

   ┌─────────┐                                  ┌─────────┐
   │ Q1 icon  │   ┌─────────────────────────┐    │ Q2 icon  │
   │         │   │                            │    │         │
   ├─────────┘   │                            │    └─────────┤
   │             │       Articles panel        │             │
   │             │       (80% × 80%)           │             │
   │             │                              │             │
   │             │                              │             │
   │             │                              │             │
   ├─────────┐   │                            │    ┌─────────┤
   │         │   └─────────────────────────┘    │         │
   │ Q3 icon  │                                  │ Q4 icon  │
   └─────────┘                                  └─────────┘
\`\`\`

The L-shapes are implemented via CSS \`clip-path: polygon(...)\`. Each quadrant element stays at its normal 50% × 50% size, but its visible area is clipped to an L pinned to its respective screen corner. The icons (Cpu, Brain, Database, GitBranch) get pinned to fixed pixel insets so they remain visible inside the L's corner square.

### The polygon math

For Q1 (top-left corner):

\`\`\`css
.quadrant-l-1 {
  clip-path: polygon(
    0 0,
    100% 0,
    100% 20%,
    20% 20%,
    20% 100%,
    0 100%
  );
}
\`\`\`

Reading the polygon counterclockwise from (0, 0):
- top-left corner (0, 0)
- top-right (100%, 0)
- down to (100%, 20%)
- left to (20%, 20%) — the inner corner of the L
- down to (20%, 100%)
- left to (0, 100%) — closing back to the start

The result is an L-shape with arms 20% of the element wide / tall (which is 10% of the viewport). The central 80% × 80% area is clipped away, freeing the space for the articles panel.

---

## The markdown renderer

Articles are written as Markdown bodies inside typed TypeScript files. The renderer is in-house, built on react-markdown + remark-gfm + Prism for syntax highlighting:

\`\`\`
                  Render pipeline (per article)

   article.body (string)
        │
        ▼
   ┌─────────────────────────────┐
   │ extractHeadings(body)        │ ──▶ headings (for the TOC)
   │   - regex parse              │
   │   - skip code blocks         │
   │   - github-slugger for IDs   │
   └─────────────────────────────┘
        │
        ▼
   ┌─────────────────────────────┐
   │ ReactMarkdown                │
   │   plugins:                   │
   │     - remark-gfm (tables, etc.)│
   │     - rehype-slug (heading IDs)│
   │   components:                │
   │     - h1-h6 → custom-styled  │
   │     - p → spaced paragraph   │
   │     - ul/ol → styled lists   │
   │     - table → styled table   │
   │     - blockquote → callout    │
   │     - code (inline) → chip    │
   │     - code (block w/ lang) → PrismAsyncLight │
   │     - code (block no lang) → ASCII pre        │
   │     - a → external link with title             │
   │     - input[type=checkbox] → styled checkmark │
   └─────────────────────────────┘
        │
        ▼
   rendered article DOM + cascade-fade animation
\`\`\`

### The interesting bits

| Decision                                                | Why                                              |
|---------------------------------------------------------|--------------------------------------------------|
| PrismAsyncLight, not Prism                              | Async tokenisation; first-click stays responsive |
| Per-language registration (only 11 languages bundled)   | Smaller bundle; only the languages we use         |
| Fenced code without language → plain monospace pre      | ASCII art reads cleanly without code-block chrome|
| Custom task list checkboxes (lucide Check icon)         | Looks intentional vs native HTML checkbox        |
| Cascade-fade animation on article children              | Reveals content in document order, ~35ms stagger |

### The TOC

The Table of Contents rail extracts headings from the markdown body using github-slugger (the same library rehype-slug uses), so the anchors match exactly.

\`\`\`
                  TOC rail with scroll-spy

   ┌─────────────────────────┐
   │ ON THIS PAGE             │
   ├─────────────────────────┤
   │ ─ Article title           │ ← h1
   │  ─ Section A              │ ← h2 indented
   │    ─ Subsection A.1       │ ← h3 indented further
   │  ─ Section B               │
   │ ─ Section C                │
   └─────────────────────────┘

   Active heading (currently in view) is accent-coloured + has a left
   border indicator. The active state is tracked by an IntersectionObserver
   on the article body's scroll container.
\`\`\`

The hover animation on TOC entries is 75ms ease-out, which is fast enough that a quick skim feels responsive but slow enough that the colour shift is visible.

---

## URL sync for sharable articles

Opening an article syncs the slug to the URL as \`?article=<slug>\`. This means:

\`\`\`
                  URL-based article state

   capataina.vercel.app/                  → home (no panel open)
   capataina.vercel.app/?article=foo      → opens panel + foo article on load

   When the user clicks an article from the list:
     → window.history.replaceState({}, "", "/?article=foo")
     → URL updates without a page reload
     → can be shared as a deep link

   When the user navigates back/forward in browser:
     → popstate handler reads the new URL
     → updates state to match
\`\`\`

The implementation uses \`window.location\` and \`window.history.replaceState\` directly rather than Next.js's \`useSearchParams\` hook. This keeps the page statically generatable and avoids Suspense boundary requirements.

---

## What runs in the browser, what runs at build time

\`\`\`
                  Build vs runtime split

   build time (next build):
     ├─ TypeScript compilation
     ├─ Tailwind CSS generation
     ├─ Markdown content bundled into the JS bundle
     │  (all article .ts files are imported at compile time)
     ├─ Particle network canvas component code-split (dynamic import)
     └─ Bundle output: roughly 280 KB gzipped main bundle

   runtime (in the browser):
     ├─ React 19 hydrates the page
     ├─ ParticleNetwork loads async (ssr: false)
     ├─ Quadrant interactions handled client-side
     ├─ Markdown rendered client-side on article open
     ├─ PrismAsyncLight tokenises code blocks async per article
     └─ URL state synced via window.history
\`\`\`

There is no backend. There is no database. The entire site is static HTML + JS that Vercel serves from its CDN. The articles are inside the bundle.

This makes the deploy story trivial: \`git push\` to main, Vercel rebuilds, the new version ships in ~90 seconds. No environment variables, no secrets, no database migrations.

---

## What this costs to host

| Resource                              | Cost                                       |
|---------------------------------------|--------------------------------------------|
| Vercel free tier                       | $0                                          |
| Domain (capataina.vercel.app)           | $0 (Vercel subdomain)                        |
| Build minutes / month                   | well under the free-tier limit              |
| Bandwidth / month                       | well under the free-tier limit              |
| TLS certificate                          | automatic via Vercel                         |

Zero monthly cost. The free tier supports thousands of unique visitors per month, which is plenty for a personal portfolio site.

---

## The animation discipline

The site has motion variants for every interactive element. Performance discipline is a deliberate constraint: **never reduce visible content for performance**. Particles stay at 320. Animations stay running. The optimisations are all "make the same visual cheaper":

| Optimisation technique                                | What it preserves                                |
|-------------------------------------------------------|--------------------------------------------------|
| useMemo on motion variants                             | Variants identical; just not reallocated         |
| useMemo on inline style objects                         | Same styles; referential equality                |
| memo() on every list / card component                  | Same render output; no unnecessary re-renders    |
| CSS containment on Quadrant elements                    | Same paint output; smaller invalidation scope    |
| IntersectionObserver pause for off-screen canvas        | Same visible output; no CPU when not visible     |
| PrismAsyncLight (not Prism)                             | Same syntax highlighting; off-thread             |

> [!important] **The rule the project enforces**
>
> "Optimisation" means the same visual output produced more cheaply. It does not mean "reduce the visual output to be faster."
>
> Reducing particle count, removing animations, or simplifying transitions are not optimisations. They are feature removals. The user sees the difference.

---

## The accent theming system

Four quadrants, four accent colours, swappable via a single \`data-quadrant-theme\` attribute on the page root:

\`\`\`css
:root {
  /* defaults */
  --accent-purple: var(--accent-default);
  --accent-purple-dim: var(--accent-default-dim);
  --accent-purple-glow: var(--accent-default-glow);
}

[data-quadrant-theme="systems"] {
  --accent-purple: var(--accent-systems);
  --accent-purple-dim: var(--accent-systems-dim);
  --accent-purple-glow: var(--accent-systems-glow);
}
[data-quadrant-theme="ai"] { /* ... */ }
[data-quadrant-theme="finance"] { /* ... */ }
[data-quadrant-theme="opensource"] { /* ... */ }
\`\`\`

The theming colours are OKLCH:

| Quadrant     | Accent (OKLCH)                |
|--------------|-------------------------------|
| Systems       | muted purple (\`oklch(0.65 0.08 285)\`) |
| AI            | muted blue (\`oklch(0.65 0.08 230)\`)  |
| Finance       | muted green (\`oklch(0.65 0.08 150)\`) |
| Open Source    | warm amber (\`oklch(0.7 0.1 65)\`)    |
| Default       | neutral grey (\`oklch(0.5 0.02 0)\`) |

Changing themes is a single attribute change on the page root. The transition between themes happens smoothly because every CSS rule that uses \`--accent-purple\` has a \`transition: var(--accent-transition-duration) ease\` on the affected property.

---

## What is in the repo

\`\`\`
src/
├── app/
│   ├── page.tsx                  ─ single static route
│   ├── layout.tsx                 ─ Next layout shell
│   └── globals.css                ─ Tailwind + custom theming + utility classes
├── components/
│   ├── shell/
│   │   ├── PortfolioCard.tsx       ─ floating card with Articles button
│   │   ├── Quadrant.tsx            ─ four corner quadrants
│   │   ├── QuadrantInterface.tsx  ─ expanded-quadrant content
│   │   └── ParticleNetwork.tsx     ─ canvas-based particle background
│   ├── projects/    ─ Projects list + per-project card
│   ├── skills/      ─ Skills accordion + per-skill card
│   ├── educations/  ─ Education entries
│   ├── certificates/ ─ Certificates
│   ├── open-source/ ─ OSS contributions
│   ├── articles/    ─ ArticlesPanel + List + ArticleView + TOC + MarkdownRenderer
│   └── ui/          ─ shadcn primitives (Accordion, Badge)
├── content/
│   ├── projects/    ─ typed .ts files per project
│   ├── skills/      ─ typed .ts files per skill
│   ├── educations/  ─ typed .ts files
│   ├── certificates/─ typed .ts files
│   ├── open-source/ ─ typed .ts files
│   └── articles/    ─ typed .ts files per article (organised by project)
└── types/           ─ canonical shapes (Field, Project, Skill, Article, etc.)
\`\`\`

The data layer is fully typed. The \`Field\` type is a discriminated union of the four quadrant labels. Every project / skill / education / certificate / article has a \`fields: Field[]\` array. Type errors catch any mismatch between the data and the quadrant interaction at compile time.

---

## What this signals on a portfolio site

The site itself is part of the portfolio. It says:

| Signal                                              | Evidence                                       |
|-----------------------------------------------------|------------------------------------------------|
| Can build modern React + Tailwind UIs                | The site itself                                |
| Comfortable with motion / animation                  | 60fps interactions, deliberate spring physics  |
| Performance discipline                                | Particles + animations preserved while optimising |
| Markdown rendering depth                              | In-house renderer with full feature support    |
| Frontend type-safety                                  | TypeScript strict everywhere                    |
| Static deployment story                                | Vercel free tier, no backend, zero cost         |

This is a meta-signal. The site is the surface; the depth is in the articles and the projects they describe. But the surface itself is the first impression, and it has to be substantial enough that someone scrolling looks closer.

---

## What is on the roadmap

A few things I want to add eventually:

| Item                                          | Status                                          |
|-----------------------------------------------|-------------------------------------------------|
| RSS feed for articles                          | not started                                      |
| Site search across articles                    | not started                                      |
| Mobile-optimised L-shape behaviour              | partial (panel works on small screens)           |
| Article filtering by type from URL              | not started                                      |
| Per-article reading time estimate                | not started                                      |
| Open Graph / Twitter card images per article    | not started                                      |

These are nice-to-haves. The site works without them. They will land when I want them.

---

## Closing

The website is a single-page Next.js app with a deliberate interaction model, in-house markdown rendering, and zero backend. It is fast, it is free to host, and it is the place where the engineering work behind it gets explained at length.

For anyone considering building a portfolio site at this level of depth, the stack is solid:

| Component                | Choice                              |
|--------------------------|-------------------------------------|
| Framework                 | Next.js 16 (App Router)              |
| Styling                   | Tailwind 4 + custom CSS              |
| Animation                  | motion (formerly framer-motion)     |
| Markdown                   | react-markdown + remark-gfm          |
| Syntax highlighting         | PrismAsyncLight                      |
| Hosting                    | Vercel free tier                     |
| Data layer                  | typed TS files, no database         |

The full source is at \`github.com/Capataina/capataina-website\`. The articles you are reading right now live in \`src/content/articles/\`. The renderer that produced this page is in \`src/components/articles/\`.

That is the whole site. It is a portfolio. It is also a demonstration. Both at once.
`,
};
