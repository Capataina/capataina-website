import type { Skill } from "@/types";

export const linuxDevOps: Skill = {
  name: "Linux & Developer Tooling",
  fields: [
    "Systems & Infrastructure Engineer",
    "Applied AI & ML Infrastructure Engineer",
    "Low Level Financial Systems Engineer",
    "Open Source Engineer",
  ],
  subskills: [
    "Arch Linux",
    "NixOS",
    "Git",
    "GitHub Actions",
    "Shell Scripting",
    "tmux",
    "Performance Profiling",
    "Ratatui / Crossterm",
  ],
  bulletPoints: [
    "Daily-driver Linux setup (Arch / NixOS) for development, with deliberate attention to the toolchain — neovim + tmux + ripgrep + fzf workflows, terminal-multiplexer state preserved across sessions",
    "Ratatui + Crossterm-based TUI engineering across multiple production projects — Cernio (job-discovery), Nyquestro (matching-engine observability dashboard) — vim-style navigation, live filtering, modal panels",
    "Git workflows with structured commit messages, branching discipline, and review etiquette — the OSS contributions have a per-project comms layer (Capataina/OpenSourceContributions umbrella repo) that captures repo-specific conventions",
    "GitHub Actions CI for automated testing + lint + type-check on the website + per-project Rust pipelines (cargo fmt + clippy + cargo test all wired)",
    "Performance profiling + system-monitoring discipline — `perf`, `strace`, `htop`, eBPF-flavoured tools when investigating low-latency systems behaviour",
  ],
};
