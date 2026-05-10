"use client";

import dynamic from "next/dynamic";
import { Quadrant } from "@/components/shell/Quadrant";
import { PortfolioCard } from "@/components/shell/PortfolioCard";
import { useState, useEffect } from "react";

// Code-split the canvas-heavy ParticleNetwork component — its physics +
// rAF loop don't need to be in the initial bundle. ssr:false because the
// canvas API is browser-only; trying to render it server-side produces
// hydration mismatches without changing the visible output.
const ParticleNetwork = dynamic(
  () => import("@/components/shell/ParticleNetwork").then((m) => m.ParticleNetwork),
  { ssr: false }
);

type QuadrantTheme = "default" | "systems" | "ai" | "finance" | "opensource";

// Position to theme mapping
const positionToTheme: Record<number, QuadrantTheme> = {
  1: "systems",
  2: "ai",
  3: "finance",
  4: "opensource",
};

export default function Home() {
  const [hoveredQuadrant, setHoveredQuadrant] = useState<number | null>(null);
  const [selectedQuadrant, setSelectedQuadrant] = useState<number | null>(null);

  // Update CSS variables based on active quadrant
  useEffect(() => {
    const root = document.documentElement;
    const activeQuadrant = selectedQuadrant || hoveredQuadrant;
    const theme = activeQuadrant ? positionToTheme[activeQuadrant] : "default";

    if (theme === "default") {
      root.style.setProperty("--accent-purple", "var(--accent-default)");
      root.style.setProperty(
        "--accent-purple-dim",
        "var(--accent-default-dim)"
      );
      root.style.setProperty(
        "--accent-purple-glow",
        "var(--accent-default-glow)"
      );
    } else {
      root.style.setProperty("--accent-purple", `var(--accent-${theme})`);
      root.style.setProperty(
        "--accent-purple-dim",
        `var(--accent-${theme}-dim)`
      );
      root.style.setProperty(
        "--accent-purple-glow",
        `var(--accent-${theme}-glow)`
      );
    }
  }, [hoveredQuadrant, selectedQuadrant]);

  const handleBackgroundClick = () => {
    setSelectedQuadrant(null);
  };

  return (
    <div
      className="h-screen w-screen flex flex-wrap gradient-bg p-2 relative overflow-hidden"
      style={{ perspective: 1000 }}
      onClick={handleBackgroundClick}
    >
      {/* Interactive particle network background */}
      <ParticleNetwork />

      {/* Portfolio Card */}
      <PortfolioCard
        hoveredQuadrant={hoveredQuadrant}
        selectedQuadrant={selectedQuadrant}
      />

      <Quadrant
        position={1}
        hoveredQuadrant={hoveredQuadrant}
        selectedQuadrant={selectedQuadrant}
        onHoverChange={setHoveredQuadrant}
        onSelect={setSelectedQuadrant}
        label="Systems & Infrastructure Engineer"
      />
      <Quadrant
        position={2}
        hoveredQuadrant={hoveredQuadrant}
        selectedQuadrant={selectedQuadrant}
        onHoverChange={setHoveredQuadrant}
        onSelect={setSelectedQuadrant}
        label="Applied AI & ML Infrastructure Engineer"
      />
      <Quadrant
        position={3}
        hoveredQuadrant={hoveredQuadrant}
        selectedQuadrant={selectedQuadrant}
        onHoverChange={setHoveredQuadrant}
        onSelect={setSelectedQuadrant}
        label="Low Level Financial Systems Engineer"
      />
      <Quadrant
        position={4}
        hoveredQuadrant={hoveredQuadrant}
        selectedQuadrant={selectedQuadrant}
        onHoverChange={setHoveredQuadrant}
        onSelect={setSelectedQuadrant}
        label="Open Source Engineer"
      />
    </div>
  );
}
