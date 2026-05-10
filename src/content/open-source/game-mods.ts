import type { Contribution } from "@/types";

export const gameMods: Contribution = {
  title: "Game mods — 18+ released across 4 modding ecosystems",
  project: "RimWorld · Minecraft · Terraria · Escape from Tarkov",
  date: "2020 – 2024",
  fields: ["Open Source Engineer"],
  status: "released",
  links: {
    repo: "https://github.com/Capataina",
  },
  description: [
    "Shipped 18+ gameplay mods spanning rebalancing, content additions, runtime patching, and quality-of-life patches — over 150,000 aggregate downloads with sustained active player bases",
    "Earliest formative engineering experience — the same drive that now produces the Rust + systems projects, applied to extending complex software at the runtime-patching level instead of from-scratch construction",
    "Each ecosystem has its own modding API and conventions (Harmony for RimWorld, SPT-AKI for Tarkov, Forge for Minecraft, tModLoader for Terraria) — works across all four",
  ],
  techStack:
    "C#, Harmony, TypeScript, Node.js, Java, Forge API, tModLoader",
  technicalDetails: [
    "RimWorld: Harmony runtime patching for dynamic pawn skill progression and economy rebalancing — non-destructive method-level intercepts that survive game updates",
    "Escape from Tarkov: Real-time enemy-health scaling via SPT-AKI hooks — the highest-download single mod in the set at ~12,000 downloads with sustained active use",
    "Minecraft: Block-level runtime editing for custom furnace and crafting interactions, working through Forge's lifecycle hooks and tile-entity NBT serialisation",
    "Terraria: Custom homing projectile system with per-frame trajectory recalculation, collision detection against tile colliders, and target-priority logic",
  ],
  metrics: {
    downloads: 150000,
  },
};
