"use client";

import dynamic from "next/dynamic";
import { Quadrant } from "@/components/shell/Quadrant";
import { PortfolioCard } from "@/components/shell/PortfolioCard";
import { useState } from "react";

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

  // Theme is derived synchronously from state and applied via the
  // `data-quadrant-theme` attribute below; the CSS rules in globals.css
  // override the accent vars per theme. This avoids a post-commit
  // useEffect + setProperty call on every hover.
  const activeQuadrant = selectedQuadrant ?? hoveredQuadrant;
  const theme: QuadrantTheme = activeQuadrant
    ? positionToTheme[activeQuadrant]
    : "default";

  const handleBackgroundClick = () => {
    setSelectedQuadrant(null);
  };

  return (
    <div
      data-quadrant-theme={theme}
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
