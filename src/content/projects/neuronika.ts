import type { Project } from "@/types";

export const neuronika: Project = {
  title: "Neuronika — AI-driven personal-knowledge-management system (dissertation)",
  date: "2024 – 2025",
  fields: ["Applied AI & ML Infrastructure Engineer"],
  links: {
    github: "https://github.com/Capataina/Neuronika",
    website: "https://neuronika.vercel.app",
  },
  description: [
    "Final-year dissertation project at the University of York — an AI-powered PKM application built as the practical answer to a literature-review thesis on personal knowledge management and information retrieval",
    "Single-page React + TypeScript + Vite app, fully client-side (no backend, no persistent storage in the prototype — privacy by construction); LLM-driven adaptive tagging via Mistral Small 3.1 24B",
    "Pilot study (4 participants, controlled comparison vs Obsidian, 3 retrieval tasks): average 355% time saved across all tasks; 433% time saved on context-only retrieval (the hardest condition). Dissertation graded; project still live for ongoing experimentation.",
  ],
  techStack:
    "TypeScript, React, Vite, react-markdown, react-grid-layout, vis.js, Fuse.js, OpenRouter, Mistral Small 3.1 24B",
  technicalDetails: [
    "Multi-layered AI tag generation via Mistral Small 3.1 24B — tags range from generalised (e.g. `Fitness`) to specific (e.g. `Tendon Health`), with adaptive priority on pre-existing tags to prevent fragmentation as the note collection grows",
    "Three retrieval surfaces over the same data: dynamic folder hierarchy from tags (notes appear in multiple folders simultaneously), interactive graph (vis.js, tag → tag → note tree), and typo-tolerant context-aware search (Fuse.js + bidirectional synonym dictionary as the client-side stand-in for a vector database)",
    "Infinitely-scrollable masonry board via react-grid-layout — resizable + draggable note tiles, full markdown rendering with code blocks, callouts, tables, LaTeX maths via remark-gfm + react-syntax-highlighter + remark-math + rehype-katex",
    "Pilot-study results: 300% time-saved on exact-title retrieval, 433% on context-only retrieval, 339% on group retrieval; semantic context-aware search was the most-requested feature pre-experiment (98% of survey respondents) and the most-used during the experiment",
  ],
};
