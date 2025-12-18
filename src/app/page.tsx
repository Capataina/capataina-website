"use client";

import { Quadrant } from "@/components/Quadrant";
import { ParticleNetwork } from "@/components/ParticleNetwork";
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
      <Quadrant
        position={1}
        hoveredQuadrant={hoveredQuadrant}
        selectedQuadrant={selectedQuadrant}
        onHoverChange={setHoveredQuadrant}
        onSelect={setSelectedQuadrant}
        label="Systems Engineering"
      />
      <Quadrant
        position={2}
        hoveredQuadrant={hoveredQuadrant}
        selectedQuadrant={selectedQuadrant}
        onHoverChange={setHoveredQuadrant}
        onSelect={setSelectedQuadrant}
        label="AI Engineering"
      />
      <Quadrant
        position={3}
        hoveredQuadrant={hoveredQuadrant}
        selectedQuadrant={selectedQuadrant}
        onHoverChange={setHoveredQuadrant}
        onSelect={setSelectedQuadrant}
        label="Full Stack Development"
      />
      <Quadrant
        position={4}
        hoveredQuadrant={hoveredQuadrant}
        selectedQuadrant={selectedQuadrant}
        onHoverChange={setHoveredQuadrant}
        onSelect={setSelectedQuadrant}
        label="Data Engineering"
      />
    </div>
  );
}
