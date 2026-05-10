import type { Skill } from "@/types";

export const gameDevelopment: Skill = {
  name: "Game Engines & Simulation",
  fields: [
    "Applied AI & ML Infrastructure Engineer",
    "Systems & Infrastructure Engineer",
  ],
  subskills: [
    "Bevy",
    "Unity",
    "libGDX",
    "ECS Architecture",
    "Deterministic Simulation",
    "Harmony Patching",
    "Forge / SPT-AKI",
  ],
  bulletPoints: [
    "Bevy ECS substrate underneath NeuroDrive — deterministic per-frame physics, raycast sensors, centerline-spline progress reward, designed so brain-inspired learning behaviour is reproducible run-to-run",
    "Led 8-person Java + libGDX simulation game team (University of York Engineering 1, 35% groupwork + 65% major group project) — owned architecture, feature implementation, CI/CD, and automated cross-platform testing",
    "Multithreaded top-down roguelite in Unity using ECS architecture — focused on safe concurrency and per-frame performance budgets across rendering, physics, and AI systems",
    "Game modding across 4 ecosystems (RimWorld + Minecraft + Terraria + Escape from Tarkov) — 18+ released mods, 150,000+ aggregate downloads — runtime patching via Harmony / Forge / SPT-AKI / tModLoader",
    "Deterministic-simulation discipline carries directly into the brain-inspired learning work — same constraints (reproducibility, frame-budget management, observable state) just applied to a research-grade environment instead of a shipped game",
  ],
};
