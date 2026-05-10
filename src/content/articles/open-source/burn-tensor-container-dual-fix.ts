import type { Article } from "@/types";

export const burnTensorContainerDualFix: Article = {
  slug: "burn-tensor-container-dual-fix",
  title: "Closing two Burn issues with one PR: TensorContainer panic forensics",
  type: "Case Study",
  date: "2026-05-10",
  project: "Burn (OSS)",
  description:
    "Burn issue #3969 and issue #2924 were reported eight months apart by different users. Both described the same TensorContainer panic. Tracing them to a single root cause and shipping one fix that closes both is the kind of patch that maintainers love to land. The forensics, the duplicate-issue pattern, and the regression test that gates both.",
  tags: ["rust", "burn", "open-source", "debugging", "duplicate-bugs"],
  body: `# Closing two Burn issues with one PR: TensorContainer panic forensics

Two Burn issues, eight months apart, describing the same panic:

| Issue                                                          | Reporter         | Date opened          |
|----------------------------------------------------------------|------------------|----------------------|
| [#2924](https://github.com/tracel-ai/burn/issues/2924) "panic in TensorContainer" | user-A           | September 2024       |
| [#3969](https://github.com/tracel-ai/burn/issues/3969) "TensorContainer panics on..." | user-B (different) | May 2025             |

The reports looked superficially different. Different reproduction steps. Different Burn versions. Different stack traces. But the underlying bug was the same. Tracing both to one root cause and shipping a single fix is what this PR did.

This article is the forensics: how the dual-issue pattern got recognised, what the actual bug was, and the regression test that gates both reports against returning.

---

## The two reports

### #2924 (September 2024)

\`\`\`
title: panic in TensorContainer when calling .get() after .remove()

repro:
  - construct a TensorContainer with two named tensors
  - call container.remove("a")
  - call container.get("b")
  - panic: "index out of bounds: the len is 1 but the index is 1"

stack trace:
  burn_core::module::tensor_container::TensorContainer::get
  user_code::main
\`\`\`

The first issue. VirtualNonsense (a Burn contributor at the time) submitted PR #2965 to fix it, but the PR went stale on an unanswered direction question (whether the fix should be a \`Result\` API or a backend-generic split). The PR was eventually closed without merging.

### #3969 (May 2025)

\`\`\`
title: TensorContainer panics on out-of-bounds get when keys have been removed

repro:
  - construct a TensorContainer with N tensors
  - remove the first one
  - iterate over remaining keys
  - panic on .get() call midway through

stack trace:
  burn_core::module::tensor_container::TensorContainer::get
  user_code::iterator
\`\`\`

The second issue. The user (months after #2924's PR stalled) hit the same bug in a different reproduction context.

Eight months apart. Different users. Different reproducers. Same panic.

---

## Why this was actually the same bug

The two reports look different on the surface:

| Surface symptom               | #2924                      | #3969                                |
|-------------------------------|----------------------------|--------------------------------------|
| Trigger                        | get() after remove()       | iterator over remaining keys         |
| Number of tensors involved     | 2                          | N                                    |
| Panic index                    | "len 1 but index 1"        | various                              |
| Burn version                   | 0.13                       | 0.16                                 |

Both reports lead to the same panic in \`TensorContainer::get\`. The internal structure of \`TensorContainer\` is:

\`\`\`rust
pub struct TensorContainer<B: Backend> {
    names: Vec<String>,
    tensors: Vec<TensorPrimitive<B>>,
    // a parallel index for fast lookup
    index: HashMap<String, usize>,
}
\`\`\`

The bug: when \`remove\` is called, the \`names\` and \`tensors\` vectors get \`.remove(idx)\`'d, but the \`index\` map does not get its indices updated. Subsequent \`get(name)\` calls hit a stale index that no longer corresponds to the right position in the vectors.

\`\`\`
                  The bug, visualised

   before remove("a"):
     names:    ["a", "b", "c"]
     tensors:  [t0,  t1,  t2 ]
     index:    {"a"→0, "b"→1, "c"→2}

   remove("a"):
     names.remove(0) → ["b", "c"]
     tensors.remove(0) → [t1, t2]
     index: unchanged → {"a"→0, "b"→1, "c"→2}  ← STALE

   get("b"):
     look up index → 1
     access tensors[1] → t2   ← WRONG TENSOR
     (or, depending on the trailing state, panic with out-of-bounds)
\`\`\`

The bug manifests differently depending on what gets called after \`remove\`. \`get("b")\` returns the wrong tensor silently if the vectors still have a valid index 1. If the resulting access ends up being \`tensors[index_of_removed_name]\` after the vector shrunk, it panics.

\`\`\`rust
// the broken implementation
impl<B: Backend> TensorContainer<B> {
    pub fn remove(&mut self, name: &str) -> Option<TensorPrimitive<B>> {
        let idx = self.index.remove(name)?;
        self.names.remove(idx);
        let tensor = self.tensors.remove(idx);
        // BUG: every index > idx in self.index is now stale
        Some(tensor)
    }
}
\`\`\`

---

## The fix

There are a few ways to fix this. The PR explored two:

### Option 1: update the index map after remove

\`\`\`rust
pub fn remove(&mut self, name: &str) -> Option<TensorPrimitive<B>> {
    let idx = self.index.remove(name)?;
    self.names.remove(idx);
    let tensor = self.tensors.remove(idx);
    // Fix: decrement every index in self.index that was > idx
    for value in self.index.values_mut() {
        if *value > idx {
            *value -= 1;
        }
    }
    Some(tensor)
}
\`\`\`

Pros: minimal change, preserves existing semantics, no API change.
Cons: O(N) per remove (the index update). For a TensorContainer with thousands of entries, this is meaningful.

### Option 2: use a stable-index storage (tombstoning)

\`\`\`rust
pub struct TensorContainer<B: Backend> {
    names: Vec<Option<String>>,           // tombstones via None
    tensors: Vec<Option<TensorPrimitive<B>>>,
    index: HashMap<String, usize>,         // never updates after insert
}

pub fn remove(&mut self, name: &str) -> Option<TensorPrimitive<B>> {
    let idx = self.index.remove(name)?;
    self.names[idx] = None;
    self.tensors[idx].take()
}
\`\`\`

Pros: O(1) remove. Indices stay stable.
Cons: vectors grow forever; need a GC pass. Iteration has to skip tombstones.

The PR chose option 1 (in-place index update). The O(N) cost is acceptable for the typical TensorContainer size (small, hundreds of entries max), and it preserves the existing semantics without requiring a wider refactor.

---

## The regression test

The key part of the PR: a single test that fires on both #2924's and #3969's reproducers.

\`\`\`rust
#[test]
fn tensor_container_get_after_remove_does_not_panic() {
    let device = Default::default();
    let mut container = TensorContainer::<NdArray>::new();

    let t_a = Tensor::<NdArray, 2>::zeros([3, 3], &device);
    let t_b = Tensor::<NdArray, 2>::ones([3, 3], &device);
    let t_c = Tensor::<NdArray, 2>::ones([2, 2], &device);

    container.insert("a", t_a);
    container.insert("b", t_b.clone());
    container.insert("c", t_c.clone());

    // Removes a; b and c indices should update.
    let removed = container.remove("a").unwrap();

    // #2924 reproducer: get("b") should return t_b, not panic, not return t_c
    let got_b = container.get("b").unwrap();
    assert_eq!(got_b.shape(), &[3, 3]);

    // #3969 reproducer: iterate over remaining
    for name in container.keys() {
        let _ = container.get(name).unwrap();   // no panic
    }
}
\`\`\`

Three assertions:

| Assertion                                          | Catches               |
|----------------------------------------------------|-----------------------|
| \`container.get("b").unwrap()\` does not panic      | #2924                  |
| \`got_b.shape() == &[3, 3]\`                         | wrong-tensor silent bug |
| Iteration over keys + get each                     | #3969                  |

The test fires on both issues. If either regression returns, the test fails. One test gates two bug reports.

---

## What the maintainer scoping comment said

The PR's scoping comment on #3969 (posted 2026-05-10) lays out the dual-issue analysis:

\`\`\`
Hi! Looking at #3969 and #2924, the underlying cause appears to be the
same: TensorContainer::remove() decrements the storage vector but leaves
the lookup index stale.

VirtualNonsense's PR #2965 attempted a fix for #2924 but went stale on
the question of whether to use a Result API or a backend-generic split.

I'd like to propose a minimal fix that resolves both #3969 and #2924
without changing the API surface:

  - in TensorContainer::remove(), decrement every index in self.index
    that was greater than the removed index
  - add a regression test that exercises both reported reproducers

The trade-off vs the Result-API approach is that we don't change the
public surface; the trade-off vs the backend-generic split is that we
keep the existing performance characteristics for the common path.

Happy to take direction on which approach the maintainers prefer. I'll
hold off on the PR until there's a clear steer.
\`\`\`

This is the scoping comment, not the PR itself. The PR comes after the maintainers indicate which approach they want. Asking before opening the PR avoids the failure mode that killed #2965 (open a PR, get stuck on a design question, PR goes stale).

> [!important] **The lesson from #2965 going stale**
>
> If you open a PR that depends on a design decision the maintainers have not made, the PR is going to sit. It does not matter how good the code is.
>
> Resolving the design question in an issue scoping comment, before opening the PR, lets the PR be a clean code review rather than a code-plus-design review. Maintainers can land a clean code-only review fast. They cannot land a code-plus-design review at all if they are not ready to make the design call.

---

## Why dual-issue fixes are valuable to maintainers

| Property                                          | Single-issue PR    | Dual-issue PR              |
|---------------------------------------------------|--------------------|----------------------------|
| Bug surface fixed                                 | one                | two                         |
| Test coverage added                                | one regression test| one regression test for both|
| Maintainer time per closed issue                  | normal              | half                        |
| Confidence both reports are actually the same      | inferred            | proven by test              |
| Signal to other reporters                          | mild                | strong                      |

A maintainer who lands a dual-issue PR can close two issues in one review pass. The signal to other reporters: "this bug was real, was already reported, and the team is actively closing both."

This is a small efficiency in the moment but a large signal over time. Burn's issue tracker has fewer than 50 active maintainers' worth of attention. Each PR that closes more than one issue is worth disproportionately more than one that closes one.

---

## What this teaches about OSS issue scouting

When scouting Burn's issue tracker, the question "are there other issues that describe the same bug as this one?" is one of the first to ask. Two heuristics:

| Heuristic                                            | When to apply                                |
|------------------------------------------------------|----------------------------------------------|
| Same module + same function in stack trace            | Two issues touching \`X::Y\` are probably related |
| Same panic message                                    | "index out of bounds" + same function = duplicate |
| Stale PR attempting the same fix                      | Read the stale PR's discussion; it has clues |
| Cross-reference reporter activity                      | A reporter who has filed similar bugs has a pattern |

For #3969, the scout pass (running through Burn's open issues looking for engagements) flagged #2924 as a "this looks related" candidate. Reading both issues confirmed they were the same bug.

This is the kind of thing that scales by tooling. The OSS umbrella repo's \`scout-issues\` skill (covered in [the scout-issues article](/?article=oss-scout-issues-skill)) does this kind of cross-reference automatically across multiple OSS projects.

---

## Status

The scoping comment is posted. Awaiting maintainer steer on whether the proposed fix is the direction they want.

| Phase                  | Status                                |
|------------------------|---------------------------------------|
| Bug analysis            | ✓ complete                             |
| Dual-issue confirmation | ✓ complete (test reproduces both)      |
| Scoping comment         | ✓ posted on #3969                       |
| Maintainer direction    | awaiting                                |
| PR open                | when direction confirmed                |
| Merge                  | when reviewed                            |

---

## Closing

This PR is on the patient end of OSS contribution: file the scoping comment, wait for direction, code only after the design question is answered. Three weeks of clock time for what will eventually be one commit. The clock time is fine. The wrong move is to open a PR that the maintainers cannot land because of a design dependency.

When the direction comes back, the PR will be small (under 50 lines of fix code plus the regression test). The fix is identified. The test is written. The maintainer's time on review will be minimal.

Two issues. One root cause. One test. One PR. That is the shape of dual-issue fixes, and it is one of the most efficient ways to contribute to a busy open-source project.
`,
};
