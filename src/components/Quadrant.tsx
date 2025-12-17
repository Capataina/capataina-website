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
      className="flex items-center justify-center bg-zinc-800 dark:bg-zinc-800 rounded-2xl m-2"
      animate={{
        width: size.width,
        height: size.height,
        rotateX: isHovered ? -mousePosition.y * 3 : 0,
        rotateY: isHovered ? mousePosition.x * 3 : 0,
        backgroundColor:
          isHovered || isSelected ? "rgb(63, 63, 70)" : "rgb(39, 39, 42)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onMouseMove={!isSelected ? handleMouseMove : undefined}
      onMouseEnter={() => !isSelected && onHoverChange(position)}
      onMouseLeave={() => !isSelected && onHoverChange(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(isSelected ? null : position);
      }}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
    >
      {isSelected ? (
        <QuadrantInterface quadrantPosition={position} field={label} />
      ) : (
        <h2 className="text-2xl font-bold text-white">{label}</h2>
      )}
    </motion.div>
  );
}
