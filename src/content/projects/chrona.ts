import type { Project } from "@/types";

export const chrona: Project = {
  title: "Chrona — Git from first principles in modern C++",
  date: "Dec 2025 – present",
  fields: ["Systems & Infrastructure Engineer"],
  links: {
    github: "https://github.com/Capataina/Chrona",
  },
  description: [
    "Git-inspired version-control system built from first principles in C++20 — content-addressed object storage, immutable snapshots, commit DAGs, and staging semantics implemented without git's source as a reference",
    "Learning project anchored in the same systems-engineering taste as the Rust work — manual memory ownership, careful API surface, deliberate algorithmic choices instead of leaning on a familiar reimplementation",
    "Goal is feature parity with git's plumbing layer (`init`, `hash-object`, `cat-file`, `update-index`, `write-tree`, `commit-tree`) before any porcelain commands land",
  ],
  techStack: "C++20, CMake, SHA-1, zlib",
  technicalDetails: [
    "Content-addressed object store — every blob/tree/commit is hashed (SHA-1, matching git's wire format) and stored under `objects/<first-2>/<rest>` so identical content collapses to a single on-disk entry",
    "Immutable commit DAG — each commit references its parent(s) by content hash; rewrites produce new commits rather than mutating history, so the cost model is deliberately git-shaped",
    "Repository discovery walks parent directories looking for `.chrona/` (mirroring git's `.git/` discovery) so commands work from any sub-directory of a tracked tree",
    "CMake scaffold + repo-discovery shipped; `init` plumbing is the next milestone with `hash-object` and `cat-file` queued behind it",
  ],
};
