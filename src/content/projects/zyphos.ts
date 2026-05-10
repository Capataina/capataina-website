import type { Project } from "@/types";

export const zyphos: Project = {
  title: "Zyphos — HTTP servers from raw sockets up to QUIC",
  date: "2024 – present",
  fields: ["Systems & Infrastructure Engineer"],
  links: {
    github: "https://github.com/Capataina/Zyphos",
  },
  description: [
    "Network protocol laboratory implementing HTTP servers from scratch in safe Rust — progressing from raw TCP sockets through HTTP/1.1, HTTP/2, WebSockets, and QUIC with a hand-rolled event loop and zero external networking framework dependencies",
    "Goal is the systems-engineering depth that comes from reimplementing each protocol layer instead of leaning on hyper, axum, or tokio's higher-level runtimes",
    "30-milestone roadmap covers the full protocol arc; HTTP/1.0 + thread-per-connection model is shipped, with thread pools, memory pools, and SIMD parser optimisation queued next",
  ],
  techStack: "Rust",
  technicalDetails: [
    "TCP listener with thread-per-connection model + RFC-compliant HTTP/1.0 parser shipped — manually-handled chunked-transfer-encoding, connection-keepalive bookkeeping, and absolute-vs-origin-form URL parsing",
    "RFC-compliant response formatting with routing + per-route error handling — deliberately verbose so the protocol shape is visible in the call sites, not hidden behind a framework abstraction",
    "Planned: thread pools (work-stealing), memory pools (per-connection arena), SIMD parser optimisation (AVX2 header tokenisation), io_uring integration on Linux for kernel-bypass I/O batching",
    "Future arc: epoll/kqueue event loops, zero-copy buffers, kernel bypass with sendfile/splice for static-file fast-paths — each milestone a deliberate study of one networking concern in isolation",
  ],
};
