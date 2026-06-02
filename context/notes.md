# Notes

*Project preferences, design rationale, conventions, and durable lessons. Read alongside `architecture.md` when picking up the project after a break.*

## Active focus

The 2026-05-10 session was a restructure of a 135-day-dormant project: npm → pnpm migration, flat `src/` → feature-grouped folders, content rewrite against the canonical Field discriminated union, 4th quadrant swapped from Full Stack → Open Source, optimisation pass within a no-removal constraint, README + CLAUDE.md rewritten. Everything in this notes file reflects post-restructure reality.

## Hard constraints (user-stated, do not violate)

These are explicit from Caner during the restructure session:

- **Never reduce ParticleNetwork node counts.** `particleCount = 240` in `src/components/shell/ParticleNetwork.tsx` is a deliberate choice. Optimisation = pause when off-screen, code-split, CSS-contain. Never thin out the visual.
- **Never remove animations.** Motion variants, AnimatePresence transitions, the floating PortfolioCard y-bounce, the icon-spin hovers — all stay. `useReducedMotion` is acceptable (it only affects users who explicitly opted out at the OS level; the default experience is unchanged).
- **Test the dev server in a browser before reporting UI work as done.** `tsc --noEmit` + `pnpm build` verify type and build correctness, not visual correctness. CLAUDE.md restates this; it is the most easily violated discipline in this repo because the project has no test suite.
- **No 2:2 grade in `content/educations/university-of-york.ts`.** The classification is omitted intentionally — the dissertation, modules, and pilot-study results are the substantive evidence. (Per Caner 2026-05-10.)

## Conventions (cross-cutting, not tooling-enforced)

Three structural patterns recur across components. They are not lint-enforced; missing them produces silent perf or correctness regressions.

### memo() wrap on every card and list component

Every component under `src/components/{projects,skills,educations,certificates,open-source}/` is `memo(function Name(...) { ... })`-wrapped — both the single-card variants (Project, Skill, etc.) and the filtered-list variants (Projects, Skills, etc.). The wrap prevents prop-passing rerenders when an unrelated parent state changes (e.g. hovering a different quadrant).

10 files use this pattern. New components in this tree should follow it.

### useMemo for every motion variant object

Every animation variant passed to `motion/react` is wrapped in `useMemo(() => ({ ... }), [])`. Motion compares variants by reference; a fresh object literal each render bypasses motion's internal memoisation and re-emits the spring/transition every frame.

PortfolioCard.tsx has 24 such useMemo blocks (one per variant); Quadrant.tsx has 11. The pattern was set by commit `cbce0d2` ("Refactor animation variants with useMemo for performance") and is mandatory for any new motion-using component.

### Field cast at the .filter() boundary

Every list component under `src/components/{...}/` filters its content with:

```ts
.filter((entry) => entry.fields.includes(field as EntryType["fields"][number]))
```

The cast is needed because the component prop types are `field: string` (loose, since `QuadrantInterface` passes `field={label}` and label originates as a generic string from the parent), but the data layer is strict-typed (`Field[]`). The cast is honest because the producer (`page.tsx`) is hardcoded with the four canonical Field strings.

5 files use this pattern: Projects, Skills, Educations, Certificates, Contributions. New list components should follow it.

## Theming gotcha — the `--accent-purple-*` indirection

`globals.css` defines four OKLCH accent triplets named by quadrant role:

```css
--accent-systems    : oklch(0.65 0.08 285);   /* purple-ish */
--accent-ai         : oklch(0.65 0.08 230);   /* blue */
--accent-finance    : oklch(0.65 0.08 150);   /* green */
--accent-opensource : oklch(0.7  0.10  65);   /* warm amber */
```

The active accent variables are named differently:

```css
--accent-purple      : var(--accent-default);  /* runtime-swapped by page.tsx */
--accent-purple-dim  : var(--accent-default-dim);
--accent-purple-glow : var(--accent-default-glow);
```

`page.tsx`'s `useEffect` writes `var(--accent-${theme})` to `documentElement.style` for each of the three `--accent-purple-*` properties whenever hover/select state changes. Every utility class on the page (`.text-gradient-purple`, `.icon-gradient`, `.accent-text`, `.accent-button`, `.cv-button`, etc.) reads `--accent-purple-*`, so the swap is global and instant.

The "purple" name is historical (the original accent was purple). **Do not rename `--accent-purple-*`.** Rename would break the indirection — every utility class references the active-accent-pointer, not the triplets directly. If you genuinely want clean naming, the swap target should be renamed everywhere (`--accent-active-*` would be honest), not just the source.

## pnpm install gotcha — the `allowBuilds` block

`pnpm 11` requires explicit approval to run install scripts from dependencies. Without approval, `pnpm install` (and `pnpm dev`, which calls `runDepsStatusCheck` → `pnpm install` internally) exits 1 with:

```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: sharp@0.34.5, unrs-resolver@1.11.1
```

The fix lives in `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  sharp: true
  unrs-resolver: true
onlyBuiltDependencies:
  - sharp
  - unrs-resolver
```

Both blocks are kept — `allowBuilds` is what pnpm 11 actually reads; `onlyBuiltDependencies` is the documented public-facing field that older pnpm tooling looks for. `package.json` also carries `pnpm.onlyBuiltDependencies` as a belt-and-braces. The triple-redundancy exists because pnpm's build-approval API has been in flux across the 9 → 10 → 11 versions; future agents inheriting this repo on a different pnpm version should not silently delete any of the three.

The native binaries themselves (`@img/sharp-darwin-arm64`, `@unrs/resolver-binding-darwin-arm64`) ship as platform-specific prebuilds and install correctly regardless of the approval — so even before this fix, sharp and unrs-resolver functioned at runtime; the approval gate was purely about pnpm's strict-mode exit code.

## Divider behaviour in QuadrantInterface

`QuadrantInterface`'s left column originally used manual `<div className="border-t border-zinc-600" />` between sections (Educations, Projects, Contributions, Certificates). When a section returned `null` because no content matched the field, the manual divider on either side rendered as an orphan — visible empty line above or below nothing.

The fix (2026-05-10) is the Tailwind `divide-y` utility on the parent: `divide-y divide-zinc-700/60 [&>*]:pt-4 [&>*:first-child]:pt-0`. `divide-y` only paints between consecutive visible siblings — null-returning components are skipped from the divider chain because they don't render any element at all.

If a future section is added (e.g. publications, talks), it should be a `null`-returning-on-empty component; the parent's `divide-y` will handle it.

## Hover-clip fix history

The original `listItemHoverVariants` was `{ x: 4, scale: 1.01, transition: { duration: 0.1 } }`. On long lines (typical Technical Details bullet) the combined effect of x-shift + 1% scale grew the right edge past the container, clipping the last word. The 1% vertical scale also bumped against the next section's divider in the divide-y stack.

Current variant across all 5 list-component card files (Project, Skill, Education, Certificate, Contribution): `{ x: 2, transition: { duration: 0.1 } }`. The slide-right is preserved as motion feedback; the scale is dropped. Visual polish is roughly equivalent and the clip is gone.

If a future iteration re-introduces scale, transform-origin must be set so growth doesn't push outside the container — but the simpler fix is "just don't scale text on hover."

## Quadrant label sizing

Original `text-4xl` (36px) caused inconsistent wrapping: "Applied AI & ML Infrastructure Engineer" wrapped to two lines while the other three labels rendered single-line, looking visually unbalanced.

Current: `text-3xl px-4 text-center text-balance`. The `text-balance` Tailwind utility (CSS `text-wrap: balance`) makes any wrapping that does happen balance line widths instead of orphaning a single trailing word. All four labels render single-line at typical desktop widths (≥ ~1100 px); narrower viewports get a balanced two-line split.

## OSS contribution status verification

The 6 entries under `src/content/open-source/` all have a `status` field (`"open" | "closed" | "merged" | "released"`). PR / issue states change between sessions — a PR open today might be merged by next week. **Before updating any OSS content module, verify live state via `gh api`:**

```bash
gh api repos/<owner>/<repo>/pulls/<n> --jq '{state, merged, title, additions, deletions, changed_files}'
gh api repos/<owner>/<repo>/issues/<n> --jq '{state, title, created_at}'
```

The 2026-05-10 verification cycle caught two live status changes that would otherwise have been wrong: `tinygrad` PR #15453 (the original) is closed; the active engagement is PR #16119 (the resurrection) which is open. Trust the live API over what the LifeOS vault says — vault notes lag commit-time.

The umbrella OSS contribution work is tracked at:
- `Capataina/LifeOS:Projects/Open Source Contributions/_Overview.md` (vault narrative)
- `Capataina/OpenSourceContributions` (umbrella repo, private)

Read both before adding or editing OSS contribution entries.

## Type-tightening opportunity (deferred)

The `field: string` prop type on every list component (Projects, Skills, etc.) is intentionally loose; the cast at `.filter()` does the runtime filtering. A stricter design would tighten:

- `QuadrantInterface` props: `field: Field` instead of `field: string`.
- Every list component: `field: Field`.
- `<Quadrant label="...">` in `page.tsx`: pass `Field` literals directly.

This would catch typos at compile time. It was deferred because the producer (`page.tsx`) is hardcoded with the four canonical strings — no real risk of typo today. Worth tightening if a new quadrant is added or if dynamic quadrant labels ever surface.

## Highlighted projects independent array

`PortfolioCard.tsx` carries a hardcoded 4-item `highlightedProjects` array (currently Cernio, Aurix, NeuroDrive, Image Browser). It is not derived from `src/content/projects/`. The decoupling is intentional — the floating card's curated 4 is editorial (which projects to feature today), not a function of the data.

The cost is drift risk: if a project gets renamed in `content/projects/X.ts` but not here, the floating card silently keeps the old name. The `Project.featured?: boolean` field on the type already exists for a future iteration that wires the highlighted set through the data layer; until then, both layers must be updated in lock-step.

## What was deleted on 2026-05-10

- `src/contexts/AccentColorContext.tsx` — unused. The context defined a Provider + `useAccentColor()` hook but no component ever called the hook. Theme swap happens via direct `documentElement.style` writes from `page.tsx`. The context wrapping was decorative.
- `src/components/Project.tsx` etc. (flat layout) — moved to per-feature folders under `src/components/{projects,skills,...}/`. Old files preserved through `git mv` so history follows the rename.
- `package-lock.json` — npm artefact, replaced by `pnpm-lock.yaml`.
- `public/cv/generic_cv.pdf` — replaced by `Resume.pdf`.
- The mousePosition useState + handleMouseMove handler in `Quadrant.tsx` — set on every throttled mousemove but never read. Dead code, removed.
- The "Download CV" button in `QuadrantInterface.tsx` — was a TODO stub, never wired. Replaced with a width-matching spacer to keep the centred title centred.

The deletions are recorded here so a future session inheriting the repo doesn't try to "fix" what's intentionally absent.

## Performance discipline summary

The site runs at full visual richness and the optimisations are all of the "do less work without changing what the user sees" shape:

- `dynamic(() => import('./shell/ParticleNetwork'), { ssr: false })` — code-splits the canvas physics out of the initial bundle.
- IntersectionObserver pauses the rAF loop when the canvas is off-screen (in this single-route page that only matters during tab-blur on Safari, but the discipline travels if the layout ever scrolls).
- `contain: layout style paint` on each Quadrant — hover/select state changes don't ripple paint passes outside that quadrant's subtree.
- `experimental.optimizePackageImports: ['lucide-react', 'motion']` in `next.config.ts` — tree-shakes per-icon and per-motion-component.
- `useReducedMotion()` in PortfolioCard — skips the floating bounce when the user's OS prefers-reduced-motion is set. Default users see the unchanged animation.
- `memo()` wraps + `useMemo`'d motion variants throughout (see Conventions above).
- `@next/bundle-analyzer` wired via `pnpm analyze` — run after non-trivial dependency adds to catch tree-shaking holes.

If a future change degrades any of these (e.g. accidentally importing `* as motion`), the analyzer will surface it.

## Articles surface — MDX since 2026-06-02

The articles surface migrated from `react-markdown` + string bodies to `@next/mdx` + ComponentType bodies in commit `c72eeaa` (version 0.1.0 → 0.2.0). The visual primitives (headings, callouts, code, tables, ASCII art) render identically — the migration was the source format, not the rendering. The shift unlocked inline JSX widgets in article bodies without inventing a marker mini-language.

Concrete moving parts:

- `next.config.ts` wraps the export with `withMDX` from `@next/mdx`. Plugin references are passed as **string-name tuples** (not function references — Turbopack rejects non-serialisable loader options). `remarkPlugins: [["remark-gfm", {}]]`, `rehypePlugins: [["rehype-slug", {}]]`. The custom `remark-callouts.ts` plugin remains in the tree as orphan (function-reference; Turbopack rejected it).
- `src/mdx-components.tsx` exports `useMDXComponents` which returns the existing `markdownComponents` map verbatim. Next.js auto-discovers this file at project root.
- `pageExtensions: ["ts", "tsx", "mdx"]` enables `.mdx` files anywhere in the source tree.
- `src/types/article.ts` — `Article.body: ComponentType` (was `string` before the migration).
- `src/content/articles/<cluster>/<slug>.mdx` carries the body; sibling `<slug>.ts` imports the MDX default export and exports the `Article` metadata wrapper.
- `ArticleView.tsx` renders `<article.body />` directly; the `MarkdownRenderer` component was deleted.
- `extract-headings.ts` exports `extractHeadingsFromDom(root: HTMLElement)` — walks the rendered DOM via `querySelectorAll("h1, h2, …, h6")` after mount. The prior regex-on-source approach is gone (MDX has no source to parse at runtime).
- 29 placeholder articles deleted in the same commit. Currently the surface ships **one** article: `burn-afine-pr.mdx`.

### Inline widget system

10 inline widgets at `src/components/articles/widgets/` — all share the `AnsiBox` wrapper for the dark-glass + monospace aesthetic that matches the site's code-block style. Each widget is currently article-specific (the A-FINE article uses all 10); the rule until a second article shows up is "leave them as-is, extract shared primitives when reuse actually demands it" — per the global CLAUDE.md "three similar lines is better than a premature abstraction" guidance.

Widget inventory: `AnsiBox`, `Timeline`, `FileLocBars`, `CoverageGauge`, `MaintainerQuote`, `GeluComparison`, `RatioCollapse`, `PrPrecedentTree`, `PipelineWalker`, `AdapterHeatmap`, `MetricComparison`. The widgets follow three project preferences captured in auto-memory:

- ANSI aesthetic — see auto-memory `feedback_ansi_widget_aesthetic.md`
- Placement adjacent to the concept they help explain — see `feedback_widget_placement_principle.md`
- Audience-aware framing in the article prose, around the widget — see `feedback_explain_for_everyday_bystander.md`

### What didn't change

- The list view geometry, the URL sync (`?article=<slug>`), the cascading TOC scroll-spy, the L-shape quadrant clip-paths, the cascade-fade animation, the layout-mode toggle — all unchanged by the MDX migration. The migration was the body pipeline, not the article surface.

## External pointers

- `~/.claude/CLAUDE.md` — the global principal-engineering personality. Loaded in every session; the project-local CLAUDE.md is additive.
- `Capataina/LifeOS` (vault) — `Profile/Professional/{Education,Experience,Interests,Personal}.md` for biographical content; `Projects/<Name>/_Overview.md` for project-level state; `Projects/Open Source Contributions/` for OSS-specific working memory.
- `Capataina/Capataina` — the GitHub profile readme, canonical source for project descriptions and active-set ordering. The website's content modules track this readme; if it diverges, the readme wins.
- `~/Documents/Resume - Ata Caner Cetinkaya.pdf` — source PDF copied to `public/cv/Resume.pdf` during the Resume button update. If the source PDF is regenerated, copy it again to keep the served PDF current.
