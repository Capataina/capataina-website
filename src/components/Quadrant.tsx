"use client";

import { motion } from "motion/react";
import { useState, useRef, MouseEvent } from "react";
import { QuadrantInterface } from "./QuadrantInterface";

interface QuadrantProps {
  position: number;
  hoveredQuadrant: number | null;
  selectedQuadrant: number | null;
  onHoverChange: (position: number | null) => void;
  onSelect: (position: number | null) => void;
  label: string;
}

export function Quadrant({
  position,
  hoveredQuadrant,
  selectedQuadrant,
  onHoverChange,
  onSelect,
  label,
}: QuadrantProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const quadrantRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedQuadrant === position;
  const isHovered = hoveredQuadrant === position && !isSelected;
  const isAnyHovered = hoveredQuadrant !== null && selectedQuadrant === null;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!quadrantRef.current) return;

    const rect = quadrantRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate normalized position relative to center (-1 to 1 range)
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);

    setMousePosition({ x, y });
  };

  // Calculate size based on position and which quadrant is hovered or selected
  const getSize = () => {
    if (isSelected) {
      return { width: "calc(80% - 16px)", height: "calc(80% - 16px)" };
    }

    if (selectedQuadrant !== null) {
      const isTopRow = position <= 2;
      const isLeftColumn = position % 2 === 1;
      const selectedIsTopRow = selectedQuadrant! <= 2;
      const selectedIsLeftColumn = selectedQuadrant! % 2 === 1;

      const width =
        selectedIsLeftColumn === isLeftColumn
          ? "calc(80% - 16px)"
          : "calc(20% - 16px)";
      const height =
        selectedIsTopRow === isTopRow ? "calc(80% - 16px)" : "calc(20% - 16px)";

      return { width, height };
    }

    if (!isAnyHovered) {
      return { width: "calc(50% - 16px)", height: "calc(50% - 16px)" };
    }

    if (isHovered) {
      return { width: "calc(55% - 16px)", height: "calc(55% - 16px)" };
    }

    const isTopRow = position <= 2;
    const isLeftColumn = position % 2 === 1;
    const hoveredIsTopRow = hoveredQuadrant! <= 2;
    const hoveredIsLeftColumn = hoveredQuadrant! % 2 === 1;

    const sharesSameRow = isTopRow === hoveredIsTopRow;
    const sharesSameColumn = isLeftColumn === hoveredIsLeftColumn;

    const width = sharesSameColumn ? "calc(55% - 16px)" : "calc(45% - 16px)";
    const height = sharesSameRow ? "calc(55% - 16px)" : "calc(45% - 16px)";

    return { width, height };
  };

  const size = getSize();

  return (
    <motion.div
      ref={quadrantRef}
      className="flex items-center justify-center rounded-2xl m-2 border-gradient transition-shadow duration-300"
      style={{
        background:
          isHovered || isSelected
            ? "linear-gradient(135deg, oklch(0.19 0.015 285), oklch(0.175 0.01 260))"
            : "linear-gradient(135deg, oklch(0.165 0.01 285), oklch(0.16 0 0))",
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      animate={{
        width: size.width,
        height: size.height,
        rotateX: isHovered ? -mousePosition.y * 3 : 0,
        rotateY: isHovered ? mousePosition.x * 3 : 0,
        boxShadow:
          isHovered || isSelected
            ? "0 0 0 1px oklch(0.45 0.06 285 / 0.2), 0 4px 16px -2px oklch(0 0 0 / 0.4), 0 0 20px -8px oklch(0.55 0.12 285 / 0.25), inset 0 1px 0 0 oklch(1 0 0 / 0.03)"
            : "0 0 0 1px oklch(1 0 0 / 0.05), 0 2px 8px -1px oklch(0 0 0 / 0.3)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onMouseMove={!isSelected ? handleMouseMove : undefined}
      onMouseEnter={() => !isSelected && onHoverChange(position)}
      onMouseLeave={() => !isSelected && onHoverChange(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(isSelected ? null : position);
      }}
    >
      {isSelected ? (
        <QuadrantInterface quadrantPosition={position} field={label} />
      ) : (
        <h2 className="text-2xl font-bold text-gradient-purple">{label}</h2>
      )}
    </motion.div>
  );
}
