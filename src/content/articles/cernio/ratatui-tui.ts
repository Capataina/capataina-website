import type { Article } from "@/types";

export const cernioRatatuiTui: Article = {
  slug: "cernio-ratatui-tui",
  title: "Building a 5-view interactive TUI in Ratatui (Cernio v5)",
  type: "Dev Log",
  date: "2026-01-12",
  project: "Cernio",
  description:
    "How Cernio's terminal interface evolved from a single dump-output view to a five-view modular application with mouse support, an activity heatmap, a pipeline kanban, and contextual status bars. Why the terminal is the right surface for a tool you live in for hours a day.",
  tags: ["rust", "ratatui", "tui", "ui-design"],
  body: `# Building a 5-view interactive TUI in Ratatui (Cernio v5)

Cernio is a job-discovery tool I use for hours every week. The user interface is a Ratatui-based terminal application. Not a CLI. Not a status dashboard. A real interactive multi-view application that runs in a terminal window.

Most engineers I know have a vaguely positive feeling about TUIs but have never built one beyond a status dashboard or a fzf wrapper. The medium has more in it than that. This is the dev log of how Cernio's TUI grew from a v1 single-view dump into a v5 five-view application.

---

## Why a terminal in 2026

Quick comparison of starting up Cernio's TUI versus the equivalent web or desktop app:

| Surface         | Cold start  | Hot start   | Memory     | Density (info/cm²) |
|-----------------|-------------|-------------|------------|--------------------|
| Web app         | 2-4 seconds | 800 ms      | ~80 MB     | medium              |
| Electron app    | 1-3 seconds | 600 ms      | ~120 MB    | medium              |
| Native desktop  | 1-2 seconds | 200 ms      | ~40 MB     | high                |
| **Ratatui TUI** | **200 ms**  | **80 ms**   | **~12 MB** | **very high**       |

The argument for a TUI in 2026:

| Property                    | Why it matters                                             |
|-----------------------------|------------------------------------------------------------|
| **Latency**                 | 200 ms vs 2-4 seconds. For tools opened ten times a day, decisive |
| **Density**                 | ~10,000 cells visible at once at standard zoom              |
| **No mouse-first thinking** | Keyboard navigation is faster for repeat tasks              |
| **No styling distraction**  | Constraints force functional layout over decorative         |

The argument against is real too:

| Argument against              | Truth                                            |
|-------------------------------|--------------------------------------------------|
| Discovery is harder           | True — keyboard shortcuts are not visible        |
| Complex layouts are harder    | True — but constraint-based layout helps         |
| Non-terminal users locked out | True — Cernio's user is me; this is fine          |

For Cernio, every user is me, every user has the terminal open all day, and every user has Vim muscle memory. The trade-offs land.

---

## What v1 looked like

\`\`\`
v1: a single view

  ┌──────────────────────────────────────────────────────────────┐
  │ Cernio                                                        │
  ├──────────────────────────────────────────────────────────────┤
  │ Senior Software Engineer @ Anthropic           grade: SS      │
  │ Senior Systems Engineer  @ Cloudflare         grade: S       │
  │ Backend Engineer         @ Stripe             grade: A       │
  │ Software Engineer        @ Google             grade: B       │
  │ ...                                                          │
  ├──────────────────────────────────────────────────────────────┤
  │ ↑↓ navigate · Enter view · q quit                            │
  └──────────────────────────────────────────────────────────────┘
\`\`\`

A list of jobs. Up and down to scroll. Enter to see the full description in a popup. That was the whole app.

This worked for the first hundred jobs in the database. Once the database had a few hundred companies and a thousand jobs, the single-list view broke:

- No way to see the company-level grade distribution
- No way to see which ATSes were active
- No way to see what the pipeline was currently doing
- CLI commands had to be run in a separate terminal
- No live feedback while \`cernio search\` ran

v1 was a job browser. It needed to be an actual application.

---

## What v5 looks like

The current TUI has five views, accessible with single-key shortcuts:

| Key | View          | Purpose                                                     |
|:---:|---------------|-------------------------------------------------------------|
| \`1\` | Companies   | Sortable, filterable list of companies                       |
| \`2\` | Jobs        | The successor to v1's job list, much richer                  |
| \`3\` | Pipeline    | Kanban-style live view of the data pipeline                   |
| \`4\` | Activity    | GitHub-style heatmap of grading activity over time            |
| \`5\` | Stats       | Aggregate distributions and calibration drift detection       |

### View: Companies

\`\`\`
  ┌─ Cernio · Companies ────────────────────────────────────────────┐
  │  /  filter   s  sort  o  open jobs  e  edit  q  quit            │
  ├─────────────────────────────────────────────────────────────────┤
  │  Company           ATS         Loc        Grade  Last      Jobs │
  │  ───────────────── ─────────── ────────── ────── ────────  ──── │
  │ ▶Anthropic         Greenhouse  Remote     S      2026-05-10  41 │
  │  Cloudflare        Greenhouse  Remote     S      2026-05-09  87 │
  │  Stripe            Greenhouse  Remote/SF  A      2026-05-10 220 │
  │  Linear            Ashby       Remote     A      2026-05-09  18 │
  │  Vercel            Greenhouse  Remote     A      2026-05-10  31 │
  │  ...                                                            │
  ├─────────────────────────────────────────────────────────────────┤
  │ Anthropic · grade S · 41 jobs (2 SS, 8 S, 12 A, 14 B, 5 F)       │
  └─────────────────────────────────────────────────────────────────┘
\`\`\`

Hovering over a company expands to show its job count by grade tier. Pressing Enter opens a sub-view with the company's full job list.

### View: Pipeline

\`\`\`
  ┌─ Cernio · Pipeline ─────────────────────────────────────────────┐
  │  Pending  Resolving  Searching  Cleaning  Grading   Imported    │
  │ ─────── ─────────── ─────────── ────────── ─────── ───────── │
  │ Cloud-  Stripe       Anthropic  Linear     Vercel              │
  │ flare   ░░░░ 30%      ▓▓▓░ 75%   ▓▓▓▓ done  ▓▓░░ 50%             │
  │                                                                 │
  │ Replit  Datadog                  Notion                          │
  │         ▓░░░ 12%                  ▓▓▓░ 80%                        │
  │                                                                 │
  ├─────────────────────────────────────────────────────────────────┤
  │ live · 5 jobs in flight · 28% complete · ETA 2m 14s              │
  └─────────────────────────────────────────────────────────────────┘
\`\`\`

A kanban-style view of the data pipeline. Items move across columns as the pipeline processes them. Live updates while \`cernio search\` and the other long-running commands execute. This is how I monitor a running scrape without alt-tabbing to a log file.

### View: Activity

\`\`\`
  ┌─ Cernio · Activity ─────────────────────────────────────────────┐
  │  Last 12 weeks of grading activity                              │
  │                                                                 │
  │       Mon Tue Wed Thu Fri Sat Sun                               │
  │  -11   ░   ░   ░   ░   ░   ░   ░                                │
  │  -10   ░   ▒   ░   ░   ░   ░   ░                                │
  │   -9   ░   ░   ░   ░   ░   ░   ░                                │
  │   -8   ░   ▒   ▒   ░   ▒   ░   ░                                │
  │   -7   ▒   ▓   ▓   ▒   ▓   ▒   ░                                │
  │   -6   ▓   █   █   ▓   ▓   ▒   ░                                │
  │   -5   ▓   ▓   █   ▓   ▒   ▒   ░                                │
  │   -4   █   █   ▓   ▒   ▓   ▓   ░                                │
  │   -3   ▒   ▒   ▒   █   █   ▓   ▒                                │
  │   -2   ▓   █   █   █   █   ▒   ░                                │
  │   -1   ▒   ▓   ▓   ▒   ░   ░   ░                                │
  │    0   ▓   █   █                                                │
  │                                                                 │
  │ ░ none   ▒ 1-9   ▓ 10-49   █ 50+ jobs graded                    │
  └─────────────────────────────────────────────────────────────────┘
\`\`\`

A GitHub-style heatmap of activity over time. Each cell is a day; the colour encodes how many jobs were graded that day. Patterns are visible at a glance. Used to be a debug tool; turned out to be useful as a "what have I been doing" view.

### View: Stats

\`\`\`
  ┌─ Cernio · Stats ────────────────────────────────────────────────┐
  │ Job grades (1184 graded)                                        │
  │   SS  ▍     13                                                  │
  │   S   ▊     27                                                  │
  │   A   ██    70                                                  │
  │   B   ████ 142                                                  │
  │   C   ▍     20                                                  │
  │   F   █████░ 212                                                │
  │   ?   ██████░ 700                                               │
  │                                                                 │
  │ Company grades (456 total, 431 graded)                          │
  │   S   ▎     26    A   ████ 124    B   ██████ 182    C   ███ 99 │
  │                                                                 │
  │ ATS distribution                                                │
  │   Greenhouse   ████████   168                                   │
  │   Lever        █████      89                                    │
  │   Workable     ███         62                                   │
  │   Ashby        ███         55                                   │
  │   SmartRec     ██          41                                   │
  │   Workday      █           21                                   │
  │   Eightfold    █           20                                   │
  │                                                                 │
  │ Calibration drift: ▒░ 0.04 (within tolerance)                   │
  └─────────────────────────────────────────────────────────────────┘
\`\`\`

The numbers I quote about the database in other Cernio articles all live here.

---

## The modular architecture under the hood

The TUI source code went from one file in v1 to 26 files in v5. That sounds like a lot of growth, but each file is small and has one job:

\`\`\`
src/tui/
├── app.rs              top-level App struct, view routing
├── views/
│   ├── companies.rs
│   ├── jobs.rs
│   ├── pipeline.rs
│   ├── activity.rs
│   └── stats.rs
├── widgets/            reusable widget components
│   ├── status_bar.rs
│   ├── filter_input.rs
│   ├── sort_menu.rs
│   ├── modal.rs
│   ├── heatmap.rs
│   ├── kanban.rs
│   └── table.rs
├── theme.rs            colour palette, glyph palette
├── input.rs            key + mouse event routing
└── render.rs           frame composition
\`\`\`

The big architectural decision was the widgets folder. Each Cernio widget is a self-contained piece of UI:

\`\`\`rust
pub trait Widget {
    fn render(&self, area: Rect, buf: &mut Buffer, state: &dyn AppState);
    fn handle_input(&mut self, event: Event, state: &mut dyn AppState) -> Action;
    fn hit_test(&self, x: u16, y: u16) -> Option<HitInfo>;
}
\`\`\`

The Companies view assembles a Table widget, a Filter Input widget, a Sort Menu widget, and a Status Bar widget. The Jobs view assembles a slightly different combination. The widgets do not know about views; the views are responsible for layout and state.

This is the same pattern modern web frameworks use, but in a terminal. The benefit is the same: each widget can be developed and tested in isolation, and bugs in one widget do not cascade across the application.

---

## Mouse support, surprisingly

Ratatui supports mouse events. Crossterm reports them through the same input stream as keyboard events:

\`\`\`rust
match event::read()? {
    Event::Key(key) => {
        // existing keyboard routing
        self.input_router.dispatch_key(key);
    }
    Event::Mouse(mouse) => {
        // hit-test against widget bounds
        if let Some(hit) = self.hit_test(mouse.column, mouse.row) {
            self.input_router.dispatch_mouse(mouse, hit);
        }
    }
    _ => {}
}
\`\`\`

The implementation cost is low (mouse coordinates need to be mapped to widget bounds, but each widget already knows its bounds for rendering), and the user experience benefit turned out to be larger than I expected:

| Mouse interaction              | Keyboard equivalent                     |
|--------------------------------|-----------------------------------------|
| Hover for preview              | Move selection up/down to row           |
| Click column header to sort    | Tab to header, press Enter, select sort |
| Click row to select            | Move with arrows                        |
| Wheel-scroll                   | Page up/down                            |
| Drag to resize panes           | (no equivalent)                          |

None of this is necessary; everything except the last has a keyboard equivalent. But for the moments where the keyboard equivalent is "press / to enter filter, type a 4-char filter, press enter, then press s to sort by date, then press k to scroll up," clicking is faster.

---

## Responsive layout

Cernio's TUI runs at any terminal size from roughly 80x24 (the historic minimum) up to whatever your terminal can do (mine is usually 200x60 on a 16-inch laptop). Layouts have to adapt.

\`\`\`
                  Layout adaptation by terminal width

  80 cols (minimum):
   ┌─ Cernio ────────────────────────┐
   │ status bar                      │
   ├─────────────────────────────────┤
   │ Company           Grade  Jobs  │ ← only 3 columns
   │ ▶Anthropic        S      41    │
   │  Cloudflare       S      87    │
   ├─────────────────────────────────┤
   │ ...keys...                       │
   └─────────────────────────────────┘

  140 cols (typical laptop):
   ┌─ Cernio ──────────────────────────────────────────────────────────┐
   │ status bar                                                         │
   ├──────────────────────────────────────────────────────────────────┤
   │ Company           ATS         Loc        Grade  Last       Jobs │ ← 6 columns
   │ ▶Anthropic        Greenhouse  Remote     S      2026-05-10  41   │
   ├──────────────────────────────────────────────────────────────────┤
   │ ...keys...                                                         │
   └──────────────────────────────────────────────────────────────────┘

  200 cols (full-screen 16" laptop):
   ┌─ Cernio ────────────────────────────────────────────────────────────────────┐
   │ status bar                                                                   │
   ├─────────────────────────────────────────────────────────────────────────────┤
   │ Company  ATS  Loc  Grade  Last  Jobs  Tags  Notes preview         │ ← 8 columns
   │ ▶Anthropic ...                                                              │
   ├─────────────────────────────────────────────────────────────────────────────┤
   │ ...keys...                                                                   │
   └─────────────────────────────────────────────────────────────────────────────┘
\`\`\`

Ratatui has a constraint-based layout system that handles this well:

\`\`\`rust
let chunks = Layout::default()
    .direction(Direction::Vertical)
    .constraints([
        Constraint::Length(1),    // status bar: exactly 1 row
        Constraint::Length(3),    // filter input: exactly 3 rows
        Constraint::Min(0),       // table: fills remaining
        Constraint::Length(1),    // keys hint: exactly 1 row
    ])
    .split(area);
\`\`\`

When the terminal is small, columns drop in priority order:

| Width | Columns visible                                |
|------:|-----------------------------------------------|
| 80    | Company, Grade, Jobs                            |
| 100   | + ATS                                           |
| 120   | + Location                                      |
| 140   | + Last scraped                                  |
| 180   | + Tags                                          |
| 200   | + Notes preview                                 |

The pipeline kanban view goes the other way: at 80 columns it shows 3 columns of the pipeline; at 200 columns it shows all 6. The hidden columns become accessible via horizontal scroll.

---

## State management

The App struct holds the application state. Views are stateless renderers; they take a slice of the state and produce a frame:

\`\`\`rust
struct AppState {
    // domain
    companies: Vec<Company>,
    jobs: Vec<Job>,
    pipeline: PipelineState,
    activity: ActivityHistory,

    // ui
    current_view: ViewId,
    selection: Selection,
    filter: Filter,
    sort: Sort,
    modal: Option<Modal>,
}

trait View {
    fn render(&self, state: &AppState, area: Rect, buf: &mut Buffer);
}
\`\`\`

Input events are routed to a handler that mutates the state. The next frame re-renders from the new state.

> [!note] **Why this matters**
>
> The application is reproducible. The same state always produces the same frame. Bugs in rendering are easy to chase because the state is inspectable. State updates are easy to log; if something weird happens, the state-update log shows what fired.

This is essentially the Elm architecture in Rust, scoped to a TUI. State down, events up.

### Background work

Background work (the pipeline scripts, the database queries) runs in tokio tasks and communicates with the TUI thread via mpsc channels:

\`\`\`rust
let (tx, mut rx) = mpsc::unbounded_channel();

tokio::spawn(async move {
    let result = run_search_pipeline(&companies).await;
    tx.send(BackgroundEvent::SearchComplete(result)).ok();
});

// in TUI main loop, every frame:
while let Ok(event) = rx.try_recv() {
    apply_background_event(&mut state, event);
}
\`\`\`

The TUI's main loop checks for background events on every frame and updates state accordingly. The view re-renders to reflect the new state. The TUI thread itself never blocks.

---

## What ended up in the project notes

A few things I did not anticipate:

| Surprise                                        | What I learned                                                |
|-------------------------------------------------|---------------------------------------------------------------|
| Activity heatmap became most-used view          | Built as a debug tool, became "what have I been doing" check  |
| Status bar is doing a lot                       | Originally just keys; now context, filter, sort, errors        |
| Modal dialogs are tricky in TUIs                | Required teaching the input router about modal scope           |
| Filtering 1184 jobs is essentially free         | A few hundred microseconds for filter + render                  |

### Status bar evolution

\`\`\`
v1 status bar:
  ↑↓ navigate · Enter view · q quit


v5 status bar:
  Anthropic · grade S · 41 jobs · filter: rust · sort: grade desc · pipeline: idle
\`\`\`

Status bars are now contextual: the actions shown change based on what view you are in and what is selected.

### Modal dialog scope

\`\`\`rust
fn handle_input(state: &mut AppState, event: Event) {
    if let Some(modal) = &mut state.modal {
        // events go to the modal first
        let action = modal.handle_input(event);
        if action == Action::Dismiss {
            state.modal = None;
        }
        return; // do NOT bubble to the underlying view
    }

    // no modal — normal view routing
    state.current_view.handle_input(event);
}
\`\`\`

Once that was in place, modals became reusable for any "show me this thing in detail" interaction.

---

## Why I did not build this as a web app

> [!important] **The honest comparison**
>
> | Property                       | Web app          | Cernio TUI    |
> |--------------------------------|------------------|---------------|
> | Build effort                   | 3x more          | as it is      |
> | Cold start                     | 2-4 seconds      | 200 ms        |
> | Filter 1184 jobs               | round-trip JSON  | direct memory |
> | Lines of code                  | ~6,000+          | ~2,000        |
> | Backend layer needed           | yes              | no            |
> | Bundling/deployment            | yes              | no            |
> | Daily UX for me                | worse             | better         |

The terminal application is roughly 2,000 lines of Rust spread across 26 files. A React equivalent with the same interaction model would have been several thousand lines plus a backend layer to bridge the database, plus the development server, plus the bundling, plus the deployment. The terminal app is the database client; there is no separation.

It also would not have run as fast. The Cernio TUI hits 60 frames per second easily on every input event. Filtering 1184 jobs is essentially free (a few hundred microseconds for the filter pass plus the render). The web app would have to round-trip data through a backend or serialise it to a JSON blob the browser reparses on every render. Neither is fast.

For the specific problem (a tool I live in, that needs to be fast, with information-dense displays, used by one person who is comfortable with a terminal), the TUI is the right surface. For other problems, it would not be.

The lesson is not "TUIs are great"; the lesson is "the right surface for an application is the one that fits how the user actually uses the application."

---

## Where this can go next

Cernio's TUI is feature-complete enough that I rarely add views any more. The work that is happening lives at the widget level:

- [ ] Make the heatmap more readable
- [ ] Smooth modal animations
- [ ] Polish the colour palette for both light and dark terminal themes
- [ ] Pipeline flow chart over time (stacked area view)

The pipeline flow view is the one I would still like to add. Number of jobs in each stage, plotted as a stacked area chart, with the cells colour-coded by grade. Ratatui's built-in chart widgets can do this; I have not gotten around to wiring it up.

When I do, it will fit into the same architecture as the other views, drop into the same constraint-based layout, and reuse the same status-bar contract.

---

## The takeaway

The terminal turns out to be enough surface for an application like this. The constraints are real but not crippling. The result is fast, dense, keyboard-driven, and lives in the same window I have open all day.

If you have a tool you use for hours every week and find yourself wishing the UI were faster and denser, a TUI is worth the experiment. The medium is more capable than its reputation, and Ratatui specifically is good enough that the implementation cost is reasonable.

\`\`\`
                    The TUI medium, accurate to scale:

  decorative ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  poor
  noise-cancellation ████████████████████████████████████████████  excellent
  starting velocity ██████████████████████████████████████████████ excellent
  user discovery ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  poor
  density ████████████████████████████████████████████████████████ excellent
  keyboard ergonomics ████████████████████████████████████████████ excellent
  cross-team appeal ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ poor

  if your shape lines up with the strengths, the medium is right
\`\`\`

For Cernio, the shape lined up. For your project, it might or might not. The shape is the question worth asking before the medium.
`,
};
