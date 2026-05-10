import type { Article } from "@/types";

export const cernioTestAudit: Article = {
  slug: "cernio-test-audit",
  title: "From 18 tests to 325: the code-health audit that surfaced two silent data-loss bugs",
  type: "Post-Mortem",
  date: "2026-04-22",
  project: "Cernio",
  description:
    "Cernio's session 9 was a 17x test-suite expansion plus a full code-health audit. 27 findings across 4 HIGH, 14 MEDIUM, 7 LOW severity tiers. Two of those were silent data-loss bugs that had been in production for weeks. This is the post-mortem on what the tests caught, what the audit caught, and what slipped through the gap.",
  tags: ["rust", "testing", "code-quality", "post-mortem"],
  body: `# From 18 tests to 325: the code-health audit that surfaced two silent data-loss bugs

Cernio's first eight sessions were about features. Build the database, the ATS integrations, the grading pipeline, the TUI, the skill ecosystem. By session 7 the project had 408 companies, 1184 graded jobs, and a working pipeline. It also had 18 tests.

Session 9 was the cleanup session. No new features. The goal was to take a working system and make it a maintainable system.

## What landed in session 9

| Workstream                        | Output                                              |
|-----------------------------------|-----------------------------------------------------|
| Test suite expansion              | 18 tests → 325 tests (17x)                          |
| Code-health audit                 | 27 findings across 4 / 14 / 7 / 2 severity tiers    |
| Crate restructure (lib + bin)     | Enables integration tests against \`cernio\` itself |
| Skill migration to native         | 9 skills moved from prompt files to Claude Code     |
| Schema migration v6               | Non-destructive, reversible, tested                  |
| Audit integration tests           | Parity tests for every dashboard SQL                 |

The headline numbers:

\`\`\`
test count over time:

  session 1   ░░░░░░░░░░░░░░░░░░░░░░  0
  session 2   ░░░░░░░░░░░░░░░░░░░░░░  0
  session 3   ░░░░░░░░░░░░░░░░░░░░░░  0
  session 4   ░░░░░░░░░░░░░░░░░░░░░░  0
  session 5   ░░░░░░░░░░░░░░░░░░░░░░  0
  session 6   ░░░░░░░░░░░░░░░░░░░░░░  0
  session 7   █░░░░░░░░░░░░░░░░░░░░░  18
  session 8   █░░░░░░░░░░░░░░░░░░░░░  18    ← location work, no tests
  session 9   ████████████████████████ 325 ← cleanup session
\`\`\`

> [!warning] **The honest framing**
>
> Cernio shipped six sessions of features without tests. That is not the textbook way to build software. The reasons it survived:
>
> 1. SQLite is forgiving (you cannot break the world by mishandling a row)
> 2. The pipeline is deterministic and re-runnable (worst case: re-scrape)
> 3. The TUI is a read-mostly view (write paths are rare)
> 4. Single user, single machine, no concurrency
>
> The reasons it eventually needed tests: I was about to start changing the schema and the grading rubric, and "deterministic and re-runnable" stops being a safety net when you change what "running it again" means.

---

## The two silent data-loss bugs

The integration tests caught two bugs that had been silently destroying data. Both were the kind of bug you would never notice from manual testing because the loss was invisible by design.

### Bug 1: dedupe at the wrong key

\`\`\`rust
// the old version:
fn dedupe_jobs(jobs: Vec<Job>) -> Vec<Job> {
    let mut seen = HashSet::new();
    jobs.into_iter()
        .filter(|j| seen.insert(j.title.clone()))
        .collect()
}
\`\`\`

The dedupe key was just the job title. Every company that had multiple "Senior Software Engineer" listings (most of them) silently lost all but the first one when the dedupe pass ran.

The new version:

\`\`\`rust
fn dedupe_jobs(jobs: Vec<Job>) -> Vec<Job> {
    let mut seen = HashSet::new();
    jobs.into_iter()
        .filter(|j| {
            let key = (j.company_id, j.title.clone(), j.location.clone());
            seen.insert(key)
        })
        .collect()
}
\`\`\`

The integration test that caught this:

\`\`\`rust
#[test]
fn dedupe_preserves_jobs_at_different_companies_with_same_title() {
    let jobs = vec![
        job("Senior Software Engineer", "Anthropic", "Remote"),
        job("Senior Software Engineer", "Cloudflare", "Remote"),
        job("Senior Software Engineer", "Anthropic", "London"),
    ];

    let result = dedupe_jobs(jobs);

    // before fix: result.len() == 1
    // after fix:  result.len() == 3
    assert_eq!(result.len(), 3);
}
\`\`\`

How many jobs were actually lost is unclear. The pipeline runs are deterministic so I can replay them, but the bug had been live for around six weeks before this test caught it.

### Bug 2: ATS pagination terminating early

The Greenhouse and Lever ATS integrations both paginate their job listings. The old version of the loop:

\`\`\`rust
async fn fetch_all(&self, company_id: u64) -> Result<Vec<Job>> {
    let mut all = Vec::new();
    let mut page = 1;

    loop {
        let response = self.fetch_page(page).await?;
        if response.jobs.is_empty() {
            break;
        }
        all.extend(response.jobs);
        page += 1;
    }

    Ok(all)
}
\`\`\`

That looks correct. It is not. The ATSes return non-empty pages until the last one, then return an empty page. Most of the time. **Sometimes** they return a page-of-the-day with zero current matches in the middle of the result set, and the old loop would terminate there, missing every page after.

The fix used the API's actual termination signal:

\`\`\`rust
async fn fetch_all(&self, company_id: u64) -> Result<Vec<Job>> {
    let mut all = Vec::new();
    let mut page = 1;

    loop {
        let response = self.fetch_page(page).await?;
        all.extend(response.jobs);
        if !response.has_next_page {
            break;
        }
        page += 1;
    }

    Ok(all)
}
\`\`\`

The integration test that caught it:

\`\`\`rust
#[tokio::test]
async fn fetch_all_continues_through_empty_intermediate_pages() {
    let server = MockServer::start().await;
    Mock::given(method("GET")).and(path("/jobs?page=1"))
        .respond_with(json(GreenhouseResponse {
            jobs: vec![mock_job("E1")],
            has_next_page: true,
        })).mount(&server).await;
    Mock::given(method("GET")).and(path("/jobs?page=2"))
        .respond_with(json(GreenhouseResponse {
            jobs: vec![],
            has_next_page: true,
        })).mount(&server).await;
    Mock::given(method("GET")).and(path("/jobs?page=3"))
        .respond_with(json(GreenhouseResponse {
            jobs: vec![mock_job("E3")],
            has_next_page: false,
        })).mount(&server).await;

    let provider = Greenhouse::new(server.uri());
    let result = provider.fetch_all(0).await.unwrap();

    // before fix: result.len() == 1 (terminated at page 2)
    // after fix:  result.len() == 2 (continued through to page 3)
    assert_eq!(result.len(), 2);
}
\`\`\`

How many jobs this cost across 408 companies is genuinely unknown. Estimated lower bound: 30 to 50 jobs were missing from the database at any given time. Estimated upper bound: significantly more for companies that had many jobs but inconsistent pagination behaviour.

---

## The 27-finding code-health audit

The audit was a separate workstream from the test expansion. It came after the lib + bin restructure made integration testing possible.

### Severity distribution

\`\`\`
HIGH       ████░░░░░░░░░░░░░░░░░░░░░░░    4
MEDIUM     ██████████████░░░░░░░░░░░░░   14
LOW        ███████░░░░░░░░░░░░░░░░░░░░    7
TRIAGE     ██░░░░░░░░░░░░░░░░░░░░░░░░░    2
\`\`\`

| Severity | Count | What it means                                                |
|----------|------:|--------------------------------------------------------------|
| HIGH     | 4     | Active risk to data correctness or persistence               |
| MEDIUM   | 14    | Code health, maintainability, structural drift                |
| LOW      | 7     | Minor cleanup, naming, dead code                              |
| TRIAGE   | 2     | Could not classify without further investigation              |

### The 4 HIGH-severity findings

| # | Finding                                                | Severity reason                          |
|---|--------------------------------------------------------|------------------------------------------|
| 1 | Dashboard SQL inconsistency across views               | Different views reported different counts|
| 2 | \`strip_html\` has multiple implementations            | Inconsistent normalisation across pipeline|
| 3 | Schema migration order not enforced                    | Migration could run twice or out of order |
| 4 | Backup is not actually backing up the WAL              | Restore would lose recent data           |

#### HIGH-1: dashboard SQL inconsistency

The TUI's company view computed company-level grade distribution one way. The stats view computed it a different way. Both were "correct" by their own definitions but produced different numbers because they handled the "no jobs at this company yet" case differently.

\`\`\`sql
-- view 1 (companies view): excludes ungraded
SELECT grade, COUNT(*)
FROM companies
WHERE grade IS NOT NULL
GROUP BY grade;

-- view 2 (stats view): includes ungraded as a separate bucket
SELECT COALESCE(grade, 'pending'), COUNT(*)
FROM companies
GROUP BY COALESCE(grade, 'pending');
\`\`\`

The fix consolidated these into a single shared SQL function in a \`db/dashboard.rs\` module that both views call. Parity tests verify that the two views produce identical numbers.

#### HIGH-2: \`strip_html\` parity

Three different places in the codebase had their own version of "strip HTML out of a job description":

| Location              | Version           | Behaviour                              |
|-----------------------|-------------------|----------------------------------------|
| \`clean.rs\`          | regex, full strip | Removed all tags including text        |
| \`grade.rs\`          | regex, partial    | Stripped <p>, <div>, kept <a> text    |
| \`tui/preview.rs\`    | tag-aware         | Pretty-printed for the preview pane    |

The fix consolidated these into one \`strip_html\` function with a mode parameter. Parity tests verify that the same input produces the same output across all call sites.

#### HIGH-3: migration order

Cernio's schema is at v6. Each migration runs once and only once, in order. The old code:

\`\`\`rust
fn migrate(conn: &Connection) -> Result<()> {
    conn.execute_batch(MIGRATION_1)?;
    conn.execute_batch(MIGRATION_2)?;
    conn.execute_batch(MIGRATION_3)?;
    // ... etc
}
\`\`\`

This runs every migration every time the application starts. Most migrations are idempotent (\`CREATE TABLE IF NOT EXISTS\`), but a few are not (\`ALTER TABLE ADD COLUMN\` fails on the second run). The error was caught and ignored, which masked the bug.

The fix introduced a \`schema_version\` table:

\`\`\`rust
fn migrate(conn: &Connection) -> Result<()> {
    let current = conn.query_row(
        "SELECT max(version) FROM schema_version",
        [],
        |row| row.get::<_, Option<i32>>(0),
    )?.unwrap_or(0);

    for migration in MIGRATIONS.iter().filter(|m| m.version > current) {
        let tx = conn.transaction()?;
        tx.execute_batch(migration.sql)?;
        tx.execute("INSERT INTO schema_version VALUES (?, ?)",
            params![migration.version, Utc::now()])?;
        tx.commit()?;
    }
    Ok(())
}
\`\`\`

#### HIGH-4: backup did not include the WAL

Cernio uses SQLite in WAL mode. The backup script copied the main \`.db\` file but not the \`-wal\` and \`-shm\` files. A restore would have lost any commits since the last checkpoint.

\`\`\`bash
# old backup
cp ~/.cernio/cernio.db backups/cernio-$(date +%F).db

# new backup
sqlite3 ~/.cernio/cernio.db ".backup backups/cernio-$(date +%F).db"
\`\`\`

The \`.backup\` SQLite command does the right thing: it checkpoints the WAL into the main file before copying, producing a valid restoreable database.

### Findings batch sequence

The 27 findings were not all fixed in one go. They were sequenced into batches based on dependency and risk:

\`\`\`
batch 1  ─▶  HIGH-3 schema migration order        [enables safe schema changes]
batch 2  ─▶  HIGH-1 dashboard SQL consolidation   [needs migration tooling]
batch 3  ─▶  HIGH-2 strip_html parity             [needs test infra to verify]
batch 4  ─▶  HIGH-4 backup includes WAL           [independent]
batch 5  ─▶  MEDIUM-1 ... MEDIUM-7                 [structural]
batch 6  ─▶  MEDIUM-8 ... MEDIUM-14                [naming, dead code]
batch 7  ─▶  LOW + TRIAGE                          [whenever]
\`\`\`

Each batch had its own commit and was followed by a regression test pass.

---

## What the test suite looks like now

\`\`\`
test count by category:

  unit tests (in-source #[cfg(test)])    █████░░░░░░░░░░ 142
  integration tests (tests/)             ██████████░░░░░ 198 (after restructure)
  CLI tests (assert_cmd)                 ███░░░░░░░░░░░░  68
  property tests (proptest)              ██░░░░░░░░░░░░░  41
  parity tests (audit consolidations)    ██░░░░░░░░░░░░░  37
                                         ─────────
                                         325 total (some overlap)
\`\`\`

| Category                | Tool                  | What it tests                                   |
|-------------------------|-----------------------|-------------------------------------------------|
| Unit (\`#[cfg(test)]\`)  | \`cargo test\`         | Functions in isolation                           |
| Integration (\`tests/\`) | \`cargo test\`         | End-to-end pipeline against real SQLite          |
| CLI                     | \`assert_cmd\`         | Spawned process, asserted output                 |
| Property                | \`proptest\`           | Generated inputs, invariants verified             |
| Parity                  | Custom                | "These two SQL queries return the same shape"   |

### What property tests caught

Property tests are the cheapest way to find edge cases. A few that fired during session 9:

\`\`\`rust
proptest! {
    #[test]
    fn dedupe_is_idempotent(jobs in vec(any_job(), 0..100)) {
        let once = dedupe_jobs(jobs.clone());
        let twice = dedupe_jobs(once.clone());
        prop_assert_eq!(once, twice);
    }

    #[test]
    fn grade_assignment_preserves_grade_set(jobs in vec(any_graded_job(), 0..50)) {
        let stored = persist_and_reload(jobs.clone());
        let original_grades: HashSet<_> = jobs.iter().map(|j| (j.id, j.grade)).collect();
        let stored_grades: HashSet<_> = stored.iter().map(|j| (j.id, j.grade)).collect();
        prop_assert_eq!(original_grades, stored_grades);
    }
}
\`\`\`

The first one caught a case where dedupe was non-idempotent due to ordering instability in the HashSet. The second one caught a case where reloading a job from SQLite truncated the \`reasoning\` field at 1023 chars (a varchar limit that did not exist in code but did exist in the schema).

---

## What slipped through the gap

The audit caught 27 findings. The tests caught the two silent data-loss bugs. **There were three issues neither caught:**

| Issue                                          | Why it was missed                            |
|------------------------------------------------|----------------------------------------------|
| \`profile.md\` formatting drift over time      | No structural test of the file format         |
| Skill calibration drift across model versions  | No regression test for grading consistency    |
| Backup integrity (the file is restoreable)     | Test only checks "file produced," not "good"  |

These are the gaps in the audit itself. Adding tests for them is on the post-session-9 backlog.

> [!note] **The audit's blind spot**
>
> The audit was structural. It found things that were inconsistent, broken, or fragile in the code. It did not find things that were correct in the code but degraded over time due to external factors (model behaviour shifts, file format drift, backup file corruption).
>
> Those are a different class of test, and they were not in scope for session 9. They are in scope for session 10.

---

## What this changed about how I work on Cernio

| Before session 9                 | After session 9                            |
|----------------------------------|--------------------------------------------|
| "I'll add a test if it breaks"   | "Schema-touching code gets a test first"   |
| Manual TUI smoke testing         | CLI integration tests run on every commit  |
| Backup script trusted by faith   | Backup verification test runs nightly      |
| One-off fixes, hope nothing else broke | Every fix gets a regression test     |

The 17x test expansion is not the headline. The headline is that the project went from "I'll find out if I break something the next time I look" to "I'll find out if I break something within the same minute I broke it."

The two silent data-loss bugs would have continued silently destroying data forever without the test work. Their cost was already real; the tests just made the cost visible.

---

## What it cost

| Workstream             | Time invested      |
|------------------------|--------------------|
| Test suite expansion   | ~3 days            |
| Lib + bin restructure  | ~half a day        |
| Code-health audit      | ~2 days            |
| Audit batch 1-4 fixes  | ~2 days            |
| Audit batches 5-7      | ~1 day             |
| Skill migration        | ~1 day             |
| **Total session 9**    | **~9-10 days**     |

That is significant. The project went from feature work to maintenance work for the equivalent of two work weeks. No new ATS integrations shipped. No new TUI views. No new skills.

The trade-off was the right one. Sessions 8 and earlier had been accumulating maintenance debt at a rate that would have made every future feature more expensive. Session 9 paid that debt down to a level where session 10's work (which adds the autofill feature) could proceed without dragging the rest of the codebase forward.

---

## The lesson worth keeping

> [!important] **Maintenance sessions are part of the project, not a tax on it.**
>
> Six sessions of features without tests was tolerable. Eight sessions of features without tests was not. The point at which maintenance becomes urgent is the point at which "I will fix it later" stops being honest because later already happened.

If you are running a personal project and feature work feels productive while testing feels like a chore, you are accumulating debt. The fact that nothing has broken yet is not evidence that nothing will break; it is evidence that you have not looked carefully enough.

The two silent data-loss bugs were both six weeks old by the time the test suite found them. The pipeline was deterministic and looked healthy from the outside. From the inside, it was throwing data away every run. That is the failure mode worth being afraid of: silent, slow, invisible to manual inspection.

Tests are how you find that class of failure. There is no other way.

Cernio's 325-test suite is not "thorough." It is the minimum viable safety net for a system that handles a personal job-search database. The fact that it took session 9 to get there is the honest acknowledgement that the previous sessions were riskier than they appeared. The fact that the tests immediately found two real bugs is the honest validation that the work was overdue.

Session 10 onwards builds on a different foundation. That is the reason to do this kind of work.
`,
};
