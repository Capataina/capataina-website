import type { Project } from "@/types";

export const personalWebsite: Project = {
  title: "Personal website — the site you're viewing now",
  date: "2025 – present",
  fields: ["Systems & Infrastructure Engineer"],
  links: {
    github: "https://github.com/Capataina/capataina-website",
    website: "https://capataina.vercel.app",
  },
  description: [
    "The portfolio site you're currently exploring — a 4-quadrant interactive shell with quadrant-driven dynamic accent theming, a canvas-based ParticleNetwork background, and a self-referential project entry that links back to the GitHub repo for transparency",
    "Built as a side-project for portfolio signal and as a sandbox for animation + interaction-design ideas — Framer Motion variants are memoised throughout, mousemove handlers throttled to 32ms, and the typed data layer makes adding new projects/skills/educations a pure-content edit",
    "Deployed to Vercel; the code is open at github.com/Capataina/capataina-website if you want to read the implementation directly",
  ],
  techStack:
    "Next.js 16 (App Router), React 19, TypeScript 5, Tailwind 4, Framer Motion, shadcn/ui, Vercel",
  technicalDetails: [
    "Next.js 16 App Router single-route layout — the 4-quadrant interaction model + the floating PortfolioCard live entirely client-side under one server-rendered shell, which keeps the initial bundle small and the interactivity instantaneous",
    "Quadrant-driven dynamic accent theming — four OKLCH triplets in CSS custom properties on `:root`, swapped by quadrant hover/select via direct documentElement style mutations; theme transitions interpolated via Tailwind 4's accent-transition-duration custom property",
    "Canvas-based ParticleNetwork background with center-attraction physics + per-frame node-vs-mouse force calculation — runs alongside the React tree without contending for the rendering thread",
    "Typed data layer (src/types/) backs every content surface — Project / Skill / Education / Certificate / Contribution shapes are canonical, so adding a new project is a single TypeScript file edit with the editor catching shape drift at compile time",
  ],
};
