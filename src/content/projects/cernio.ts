import type { Project } from "@/types";

export const cernio: Project = {
  title: "Cernio — Local-first job-discovery TUI with Claude-assisted curation",
  date: "2025 – present",
  fields: ["Systems & Infrastructure Engineer"],
  links: {
    github: "https://github.com/Capataina/Cernio",
  },
  description: [
    "Built a local-first, human-AI-collaborative job-discovery and curation engine — a Ratatui terminal UI driving a structured pipeline that combines mechanical ATS scanning with conversational Claude-assisted evaluation against a candidate profile",
    "Currently tracking 456 companies and 1,184+ jobs across 9+ engineering iterations, with vim-style navigation, live filtering, and per-job audit trails",
    "Treats the job search as a systems problem — scripts handle volume (scraping, parsing, deduping), AI handles judgement (alignment with profile, fit reasoning, follow-up actions)",
  ],
  techStack: "Rust, Ratatui, Crossterm, SQLite, Tokio, Claude API",
  technicalDetails: [
    "WAL-mode SQLite as the single source of truth for companies, jobs, evaluations, and notes — schema migrated automatically on startup, no manual DB ops",
    "Ratatui-driven TUI with vim-style modal navigation, live-filtered list views, and structured per-job side panels showing AI reasoning + manual notes side-by-side",
    "Claude-API integration for per-job evaluation against a structured candidate profile; outputs land back in SQLite with reasoning preserved as audit trail",
    "Async Tokio runtime for concurrent ATS scrape + AI evaluation; rate-limited respectfully against upstream ATS endpoints",
  ],
};
