import type { Skill } from "@/types";

export const webDevelopment: Skill = {
  name: "Frontend Engineering & TypeScript",
  fields: ["Systems & Infrastructure Engineer"],
  subskills: [
    "React 19",
    "Next.js 16",
    "TypeScript 5",
    "Tailwind 4",
    "Framer Motion",
    "shadcn/ui",
    "Vite",
    "Vercel",
  ],
  bulletPoints: [
    "Built this very portfolio site — Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Framer Motion, shadcn/ui, deployed on Vercel; quadrant-driven dynamic accent theming via CSS custom properties; canvas-based ParticleNetwork background with center-attraction physics",
    "React + TypeScript + Vite stack for the Neuronika dissertation project — three retrieval surfaces (vis.js graph, Fuse.js search, dynamic folder hierarchy) over the same client-side data layer",
    "Tauri 2 React frontends for Image Browser and Aurix — typed IPC envelopes between React UI and Rust backend, asset-protocol image loading, custom hooks for invoke patterns",
    "Disciplined animation + interaction design — motion variants memoised throughout, mousemove handlers throttled, AnimatePresence for state transitions, all wrapped in components that respect accessibility (reduced-motion, keyboard nav)",
    "Type-safe data layers across all frontend work — typed shapes for projects/skills/educations/certificates/contributions on this site so adding new content is a pure-content edit caught at compile time",
  ],
};
