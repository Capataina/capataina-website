import type { Skill } from "@/types";

export const systemsProgramming: Skill = {
  name: "Systems & Low-Latency Programming",
  fields: [
    "Systems & Infrastructure Engineer",
    "Low Level Financial Systems Engineer",
  ],
  subskills: [
    "Rust",
    "C++20",
    "Lock-Free Data Structures",
    "Wait-Free Algorithms",
    "Async / Tokio",
    "Safe Concurrency",
    "Zero-Copy I/O",
    "FlatBuffers",
  ],
  bulletPoints: [
    "Lock-free limit-order-book matching engine in safe Rust (Nyquestro) — wait-free where possible, lock-free where wait-free isn't realistic, zero `unsafe` blocks throughout",
    "C++20 production-style trading infrastructure (Tectra) with dual-plane architecture — binary fast path for sub-microsecond decision making + structured control plane sharing FlatBuffers schemas with the fast path",
    "Async Tokio runtime patterns across multiple projects (Cernio, Aurix, Nyquestro) — concurrent I/O without blocking, careful lifetime management on shared state",
    "Zero-copy parsing patterns — ITCH decoder reads in place against the wire layout (Tectra), binary protocol decoders avoid allocations on the hot path",
    "Newtype-driven type safety — OrderID, Price (cents), Quantity, nanosecond Timestamp all distinct types so unit-confusion bugs surface at compile time, not at production",
  ],
};
