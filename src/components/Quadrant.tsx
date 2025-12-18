"use client";

import { motion } from "motion/react";
import { useState, useRef, MouseEvent, useCallback, useMemo } from "react";
import { QuadrantInterface } from "./QuadrantInterface";
import { Cpu, Brain, Code, Database, LucideIcon } from "lucide-react";

// Icon mapping for each quadrant label
const labelIconMap: Record<string, LucideIcon> = {
  "Systems Engineering": Cpu,
  "AI Engineering": Brain,
  "Full Stack Development": Code,
  "Data Engineering": Database,
};

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
  const lastUpdateRef = useRef<number>(0);

  const isSelected = selectedQuadrant === position;
  const isHovered = hoveredQuadrant === position && !isSelected;
  const isAnyHovered = hoveredQuadrant !== null && selectedQuadrant === null;
  const shouldShowIcon = selectedQuadrant !== null && !isSelected;

  const Icon = labelIconMap[label];

  // Throttle mouse movement to ~30fps (32ms) for performance
  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 32) return;
    lastUpdateRef.current = now;

    if (!quadrantRef.current) return;

    const rect = quadrantRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate normalized position relative to center (-1 to 1 range)
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);

    setMousePosition({ x, y });
  }, []);

  // Memoize size calculation
  const size = useMemo(() => {
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
  }, [
    isSelected,
    selectedQuadrant,
    isAnyHovered,
    isHovered,
    position,
    hoveredQuadrant,
  ]);

  return (
    <motion.div
      ref={quadrantRef}
      className="flex items-center justify-center rounded-2xl m-2 border-gradient transition-shadow duration-300"
      style={{
        background:
          isHovered || isSelected ? "hsl(285, 10%, 18%)" : "hsl(285, 8%, 16%)",
      }}
      animate={{
        width: size.width,
        height: size.height,
        boxShadow:
          isHovered || isSelected
            ? "0 4px 16px -2px rgba(0, 0, 0, 0.4)"
            : "0 2px 8px -1px rgba(0, 0, 0, 0.3)",
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
        <QuadrantInterface
          quadrantPosition={position}
          field={label}
          onClose={() => onSelect(null)}
        />
      ) : shouldShowIcon && Icon ? (
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0, opacity: 0, rotate: 180 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
            duration: 1,
          }}
        >
          <Icon
            className="w-10 h-10"
            strokeWidth={1.5}
            style={{
              stroke: "url(#icon-gradient)",
              filter: "drop-shadow(0 0 8px rgba(200, 180, 255, 0.4))",
            }}
          />
          <svg width="0" height="0">
            <defs>
              <linearGradient
                id="icon-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="hsl(285, 60%, 80%)" />
                <stop offset="100%" stopColor="hsl(260, 50%, 70%)" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      ) : (
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-2xl font-bold text-gradient-purple"
        >
          {label}
        </motion.h2>
      )}
    </motion.div>
  );
}
