export const tectra = {
  title: "Tectra — High-Performance Hybrid Trading Infrastructure",
  date: "2025 (In Progress)",
  fields: [
    "Low Level Financial Systems Engineer",
    "Systems & Infrastructure Engineer",
  ],
  links: {
    github: "https://github.com/Capataina/Tectra",
  },
  description: [
    "Designing modular trading infrastructure for production-grade finance applications",
    "Includes market data feed handler, pre-trade risk engine, kill-switch, and deterministic replay",
    "Targets >1M messages/second per core with microsecond-level risk checks",
  ],
  techStack: "Rust",
  technicalDetails: [
    "ITCH decoder with zero-copy parsing, gap detection, and L2 book reconstruction",
    "Hot-reloadable risk rules (price bands, size limits, throttles) without downtime",
    "Append-only checksummed journals for post-incident root-cause analysis",
    "Dual-plane architecture: binary fast path for low-latency + structured control plane for management",
  ],
};
