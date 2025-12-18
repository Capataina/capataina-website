"use client";

import { Quadrant } from "@/components/Quadrant";
import { ParticleNetwork } from "@/components/ParticleNetwork";
import { PortfolioCard } from "@/components/PortfolioCard";
import { useState } from "react";

export default function Home() {
  const [hoveredQuadrant, setHoveredQuadrant] = useState<number | null>(null);
  const [selectedQuadrant, setSelectedQuadrant] = useState<number | null>(null);

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
        label="Product & Full Stack Engineer"
      />
    </div>
  );
}
