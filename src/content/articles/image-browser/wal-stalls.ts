import type { Article } from "@/types";

export const imageBrowserWalStalls: Article = {
  slug: "image-browser-wal-stalls",
  title: "From multi-second WAL stalls to batched embeddings: SQLite write-side tuning",
  type: "Dev Log",
  date: "2026-04-25",
  project: "Image Browser",
  description:
    "Image Browser's indexing pipeline writes hundreds of embeddings per second to a WAL-mode SQLite database. The naive per-row autocommit pattern produced multi-second freezes during indexing. The fix was BEGIN IMMEDIATE per ~32-row chunk plus checkpoint_passive between chunks. The investigation, the diagnosis, and the numbers.",
  tags: ["rust", "sqlite", "performance", "wal-mode"],
  body: `# From multi-second WAL stalls to batched embeddings: SQLite write-side tuning

Image Browser indexes a personal image library. Each image gets encoded by three different ML models (CLIP, DINOv2, SigLIP-2) and the resulting embeddings get stored in a SQLite database. With 1000 images that means 3000 embedding rows. With 5000 images, 15000.

The first version of the indexing pipeline used the obvious pattern: encode an image, insert each embedding row immediately, move on. Indexing 1000 images took about 90 seconds, but the user-visible problem was not the throughput. It was the stalls.

Every few seconds, the entire application would freeze for 1 to 3 seconds. The encoder thread would sit there. The TUI rendering would freeze. Nothing visible happened. Then everything would resume.

The problem turned out to be SQLite's WAL (Write-Ahead Log) checkpoint behaviour, and the fix was the kind of change that nobody mentions in tutorials but that every SQLite-backed system eventually needs.

This is the dev log of how it got found and fixed.

---

## The symptoms

| Symptom                                          | Frequency                          |
|--------------------------------------------------|------------------------------------|
| Indexing total time (1000 images)                 | ~90 seconds                        |
| Application freezes during indexing               | Every 4-8 seconds                   |
| Freeze duration                                    | 1-3 seconds                         |
| Database file growth during indexing              | Linear, no plateau                  |
| Memory growth                                      | Linear, no GC pauses               |
| CPU usage on encoder thread                        | 100% during freeze (busy waiting)  |

The freezes were not deadlocks (the encoder thread was doing something). They were not GC pauses (Rust does not have a GC). They were not network calls (everything is local).

\`\`\`
                      Freeze pattern (illustrative)

   wall clock (s)
       0────2────4────6────8────10───12───14───16───18───20
          ───────                    ─────────
                  ←  freeze  →                ←  freeze  →
       │       ▲             │       ▲              │
       │       │             │       │              │
     normal   ~3s           normal  ~2s           normal
\`\`\`

The freezes were correlated with the size of the WAL file. When the WAL file got large (multiple MB), checkpoint operations took longer.

---

## What WAL mode actually does

Quick refresher on SQLite's WAL mode for context.

\`\`\`
                      WAL mode (default for Image Browser)

   ┌────────────────────────────────────────────────────────┐
   │  Writers append to wal file                              │
   │  Readers read from main db AND wal                       │
   │  Periodically: checkpoint copies wal → main db          │
   └────────────────────────────────────────────────────────┘

                   ┌─────┐         ┌──────┐         ┌─────────┐
   transactions ──▶│ wal │ ──...──▶│ wal  │ ───────▶│ main db │
                   │ tail│         │ full │         │  file   │
                   └─────┘         └──────┘         └─────────┘
                      append-only       checkpoint moves data

   Without checkpointing, wal grows indefinitely. With checkpointing
   that runs while a writer is active, the writer must wait.
\`\`\`

WAL mode lets readers and writers coexist without blocking each other (in journal mode they would). The trade-off is that data accumulates in the WAL file until SQLite checkpoints it back into the main database. Checkpoints can take meaningful time, especially when the WAL file is large.

The key fact: **a checkpoint that happens while a writer is active will block the writer until the checkpoint completes.**

---

## The original implementation

The first version of the embedding-write loop:

\`\`\`rust
async fn store_embeddings_naive(
    conn: &mut Connection,
    embeddings: Vec<(ImageId, EncoderId, Vec<f32>)>,
) -> Result<()> {
    for (image_id, encoder_id, embedding) in embeddings {
        let blob = bytes_of_floats(&embedding);
        conn.execute(
            "INSERT INTO embeddings (image_id, encoder_id, embedding) VALUES (?, ?, ?)",
            params![image_id, encoder_id, blob],
        )?;
    }
    Ok(())
}
\`\`\`

What happens when this runs at scale:

\`\`\`
                Per-row autocommit pattern

   for each row:
     1. SQLite begins implicit transaction
     2. SQLite acquires write lock on the database
     3. INSERT row into wal
     4. SQLite commits implicit transaction
     5. SQLite releases write lock
     6. (potentially) SQLite triggers automatic checkpoint
     7. (if checkpoint happens) SQLite blocks here for 1-3 seconds
     8. Move to next row, repeat
\`\`\`

Each \`execute\` is its own transaction. Each transaction commits immediately. The WAL grows by a row, and SQLite considers checkpointing on every commit.

> [!important] **The two costs of per-row autocommit**
>
> 1. Lock acquisition + release per row. With 3000 rows, that is 3000 lock cycles. Each cycle includes fsync calls (depending on \`synchronous\` setting) which on macOS can be very slow.
>
> 2. Implicit checkpointing. SQLite's default checkpoint trigger (1000 frames in WAL) fires roughly every 1000 rows in this workload. Each checkpoint blocks the writer until done.

The combination produces the freeze pattern: 1000 rows of fast inserts, then a 1-3 second checkpoint, then 1000 more rows, etc.

---

## The fix

Two changes, in one commit:

### Change 1: BEGIN IMMEDIATE per chunk

Instead of one transaction per row, batch ~32 rows per transaction:

\`\`\`rust
async fn store_embeddings_batched(
    conn: &mut Connection,
    embeddings: Vec<(ImageId, EncoderId, Vec<f32>)>,
) -> Result<()> {
    let chunk_size = 32;
    for chunk in embeddings.chunks(chunk_size) {
        let tx = conn.transaction_with_behavior(TransactionBehavior::Immediate)?;
        for (image_id, encoder_id, embedding) in chunk {
            let blob = bytes_of_floats(embedding);
            tx.execute(
                "INSERT INTO embeddings (image_id, encoder_id, embedding) VALUES (?, ?, ?)",
                params![image_id, encoder_id, blob],
            )?;
        }
        tx.commit()?;

        // explicit checkpoint between chunks
        conn.query_row("PRAGMA wal_checkpoint(PASSIVE)", [], |_| Ok(()))?;
    }
    Ok(())
}
\`\`\`

\`BEGIN IMMEDIATE\` acquires the write lock at transaction start (rather than at first write inside the transaction). This avoids the case where multiple writers race for the lock at row 1 of their respective batches.

### Change 2: explicit PASSIVE checkpoint between chunks

\`PRAGMA wal_checkpoint(PASSIVE)\` does what it says: passively (without blocking) attempt to copy as much of the WAL into the main file as can be done without conflicting with active readers.

\`\`\`
                The new pattern

   for chunk in image_chunks:
     1. BEGIN IMMEDIATE — acquire write lock once
     2. INSERT × 32 rows
     3. COMMIT — release write lock
     4. PRAGMA wal_checkpoint(PASSIVE) — copy completed wal segment to main db
     5. (no busy-wait; if a reader is active, the checkpoint partially completes
        and we move on)
\`\`\`

The combination eliminates the implicit-checkpoint trigger. SQLite never reaches the threshold (1000 frames) where it would auto-checkpoint mid-write, because the explicit checkpoint runs between every chunk and keeps the WAL small.

---

## What the numbers say

| Metric                          | Before        | After         | Delta                |
|---------------------------------|---------------|---------------|----------------------|
| Indexing time (1000 images)     | ~90 sec       | ~12 sec       | **7.5x faster**       |
| Stalls > 500 ms                  | ~12 per run   | 0             | **eliminated**         |
| WAL file size at peak            | ~80 MB         | ~4 MB         | **20x smaller**        |
| Lock contention with reader      | high           | low           | **reduced**            |
| Application responsiveness       | freezes       | smooth        | qualitatively fixed    |

\`\`\`
                Indexing throughput before/after

   embeddings/second
        │
   500 │                                                    █████ ← after
        │
   400 │
        │
   300 │  ████ ─ before mean
        │
   200 │
        │
   100 │  ▼ before, but with stalls dropping to 0/sec for 1-3s
        │
     0 ┴────────────────────────────────────────────────────────▶
            t=0                                              t=12s
\`\`\`

---

## Why 32 rows per chunk

The chunk size is the most-tuned parameter in this fix. Tested values:

| Chunk size | Throughput | Memory peak | Latency per chunk | Stall risk |
|------------|-----------:|------------:|------------------:|-----------:|
| 1          | low        | low         | < 5 ms             | high       |
| 8          | medium     | low         | ~10 ms             | medium     |
| 32         | **high**   | medium      | ~25 ms             | **low**    |
| 128        | very high  | high        | ~80 ms             | low        |
| 512        | very high  | very high   | ~250 ms            | low        |

> [!note] **The trade-off**
>
> Larger chunks reduce per-row overhead and produce better wall-clock throughput. They also hold the write lock longer, blocking any concurrent reader for the duration of the chunk's transaction.
>
> 32 was the sweet spot for Image Browser: large enough to amortise lock overhead well, small enough that a concurrent UI query (which only reads existing rows) never feels stalled.

---

## What this looks like under contention

Image Browser has a writer thread (the indexing pipeline) and a reader thread (the UI query handler). With per-row autocommit:

\`\`\`
                Per-row autocommit + concurrent reader

   writer  ─W─W─W─W─W─W─W─W─W─W─C─C─C─C─W─W─W─W─W─C─C─...
   reader  ──────────R──────────────────R──────────────...
                     ▲                  ▲
                     │                  │
            blocked during    blocked during
            checkpoint        checkpoint
\`\`\`

With the new pattern:

\`\`\`
                Batched + passive checkpoint

   writer  ─[W×32]─C₁─[W×32]─C₂─[W×32]─C₃─...
   reader  ──R─────R─────R─────R─────R─────R─...
            ▲     ▲     ▲     ▲     ▲     ▲
            │     │     │     │     │     │
          all of these complete in < 5 ms
\`\`\`

The writer holds the lock during each batch but releases it for the checkpoint. The reader gets unbounded access during checkpoints. Reader latency drops from 1-3 second worst-case to consistent < 5 ms.

---

## What else got tuned along the way

A few SQLite settings also got adjusted in the same commit:

\`\`\`rust
pub fn initialize_connection(path: &Path) -> Result<Connection> {
    let conn = Connection::open(path)?;

    // WAL mode for concurrent reader/writer
    conn.pragma_update(None, "journal_mode", "WAL")?;

    // Normal sync — adequate for non-financial workloads
    conn.pragma_update(None, "synchronous", "NORMAL")?;

    // Foreign keys enforced
    conn.pragma_update(None, "foreign_keys", "ON")?;

    // 5-second wait when contended (forgiving for batch writes)
    conn.busy_timeout(Duration::from_secs(5))?;

    // Memory-mapped I/O — speeds up reads dramatically
    conn.pragma_update(None, "mmap_size", 268435456)?; // 256 MB

    // Larger page cache (default 2 MB → 16 MB)
    conn.pragma_update(None, "cache_size", -16384)?;

    Ok(conn)
}
\`\`\`

| Setting                        | Default       | New value     | Why                                |
|--------------------------------|---------------|---------------|------------------------------------|
| \`journal_mode\`                | DELETE        | WAL            | Concurrent reader/writer            |
| \`synchronous\`                 | FULL           | NORMAL         | Adequate for non-financial data    |
| \`foreign_keys\`                | OFF            | ON             | Cascade behaviour matters here     |
| \`busy_timeout\`                | 0              | 5000 ms        | Patient with batch writes           |
| \`mmap_size\`                   | 0              | 256 MB         | Faster reads                       |
| \`cache_size\`                  | 2000 pages    | 16384 pages    | Embedding-heavy workload            |

\`synchronous=NORMAL\` is the only one with a real trade-off. \`FULL\` flushes after every write; \`NORMAL\` flushes only on commit. For Image Browser (where the worst-case data loss is "re-encode the most recent batch of images"), \`NORMAL\` is fine. For a financial system, \`FULL\` would be the right choice.

---

## Two writer threads, one connection

Image Browser's indexing has three encoders running in parallel. Each encoder runs on its own thread. Each thread has its own SQLite connection.

\`\`\`rust
pub struct DbPool {
    writer: Arc<Mutex<Connection>>,
    reader: r2d2::Pool<SqliteConnectionManager>,
}

impl DbPool {
    pub async fn store_chunk(
        &self,
        embeddings: Vec<(ImageId, EncoderId, Vec<f32>)>,
    ) -> Result<()> {
        let mut conn = self.writer.lock().await;
        store_embeddings_batched(&mut conn, embeddings)
    }

    pub async fn query_similar(
        &self,
        query: &[f32],
        encoder: EncoderId,
    ) -> Result<Vec<(ImageId, f32)>> {
        let conn = self.reader.get()?;
        // ... cosine sim scan
    }
}
\`\`\`

> [!important] **Two-connection pattern**
>
> SQLite supports concurrent readers but only one writer at a time. The pattern Image Browser uses:
>
> 1. **Writer connection**: a single mutex-guarded connection used by the indexing pipeline
> 2. **Reader connections**: an r2d2 pool of read-only connections used by the UI
>
> The writer's batched-and-checkpointed pattern keeps the writer's hold time short. The reader pool can serve UI queries with low latency, and the reader connections never block on the writer.

The three encoder threads serialise on the writer mutex. Each encoder builds up a batch in memory (32 rows), takes the writer lock, commits the batch, releases the lock, and continues encoding. The lock is held for ~25 ms per batch; each encoder produces a batch every ~100-200 ms; contention is low.

---

## Why this took a while to find

The fix is straightforward in retrospect. The reason it was not obvious upfront:

| Mental model                                 | Reality                                          |
|----------------------------------------------|--------------------------------------------------|
| "SQLite is fast"                             | True for reads, true for one-off writes; not free for high-frequency writes |
| "Inserts are O(1)"                           | True for the insert; not true for the implicit checkpoint that follows  |
| "WAL mode means no blocking"                 | Readers don't block writers; checkpoints DO block writers |
| "Autocommit is a performance baseline"       | Autocommit is the slow path; explicit transactions are the fast path  |

The diagnosis was: profile the indexing pipeline, see that 60% of wall-clock was inside SQLite, look at SQLite's perf counters, see that wal_checkpoint was the dominant cost. The fix followed naturally once the diagnosis was clear. The diagnosis took about 2 hours of profiling.

---

## What this generalises to

> [!important] **The pattern: batch your writes, checkpoint explicitly**
>
> Any SQLite-backed system that does sustained high-frequency writes will hit this same wall. The fix is consistent across domains:
>
> 1. Wrap groups of writes in \`BEGIN IMMEDIATE\` ... \`COMMIT\`
> 2. Choose a chunk size that balances throughput against lock-hold time
> 3. After each chunk, run \`PRAGMA wal_checkpoint(PASSIVE)\`
> 4. Tune \`synchronous\` to \`NORMAL\` if your data tolerance allows
> 5. Use \`mmap_size\` and \`cache_size\` to bias toward read performance
>
> Examples that hit this pattern:
>
> | Domain                  | Write workload                                |
> |-------------------------|-----------------------------------------------|
> | Embedding indexing       | Image / text / code embeddings                |
> | Telemetry ingestion       | Metrics, traces, events                       |
> | Log aggregation           | Application logs                              |
> | Sensor recording          | IoT data ingest                               |
> | Backtesting               | Simulation events (Aurix has this exact pattern) |

The \`BEGIN IMMEDIATE\` + chunked + explicit-checkpoint pattern is in production for both Image Browser and (partially) Aurix's Tab 2 ingestion. It works.

---

## What this changes about how I write SQLite code

A few habits that shifted after this:

| Before                                           | After                                                 |
|--------------------------------------------------|-------------------------------------------------------|
| Use autocommit; "transactions are for atomicity"  | Use transactions for batching; atomicity is a side benefit |
| Trust SQLite defaults                             | Profile early; defaults assume small databases         |
| WAL mode is "the modern default"                  | WAL mode requires explicit checkpoint discipline       |
| Per-row inserts are "the natural pattern"         | Chunked inserts are the natural pattern; per-row is the slow path |
| Reader connection separate from writer            | Two-connection topology (writer mutex + reader pool)   |

---

## What the project notes say

The full investigation lives at \`context/notes/wal-stalls.md\` in the Image Browser repo. The notes include the SQLite trace output, the strace output that confirmed the fsync cost, the per-chunk-size benchmark table, and the actual commit that landed the fix.

Three takeaways from the notes:

1. The fix is not "specific to Image Browser." It applies to any sustained-write SQLite workload.
2. The default settings ARE wrong for this workload. Knowing about \`synchronous\`, \`wal_autocheckpoint\`, and \`busy_timeout\` matters.
3. Two-connection topology is non-negotiable for a writer-heavy workload with a reading UI. One-connection-with-mutex is the failure mode that produces "the UI freezes during indexing."

---

## Closing

Image Browser's indexing pipeline is now fast and smooth. 1000 images index in ~12 seconds with no visible UI freezes. The encoder threads run at near-100% utilisation. The UI query handler responds in under 5 ms even during peak indexing.

The fix is small (about 30 lines of code change) and the impact is large (7.5x throughput, freezes eliminated). The lesson is the standard one: profile before optimising, and when you find a performance problem in your database layer, the answer is usually transactions, batching, and explicit control over the operations the engine would otherwise do for you implicitly.

SQLite is fast. It is not magic. The defaults assume small databases and infrequent writes. Once your workload exceeds that envelope, you have to do the tuning yourself, and the right tuning has been written down for decades by people who use SQLite for serious work. The community knows. You just have to read the notes.

The 30-line fix landed. The freezes are gone. The pattern is reusable. That is the whole story.
`,
};
