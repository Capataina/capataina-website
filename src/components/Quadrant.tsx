"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, MouseEvent, useCallback, useMemo } from "react";
import { QuadrantInterface } from "./QuadrantInterface";
import { Cpu, Brain, Code, Database, LucideIcon } from "lucide-react";

// Icon mapping for each quadrant label
const labelIconMap: Record<string, LucideIcon> = {
  "Systems & Infrastructure Engineer": Cpu,
  "Applied AI & ML Infrastructure Engineer": Brain,
  "Product & Full Stack Engineer": Code,
  "Low Level Financial Systems Engineer": Database,
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

  // Memoize animation variants and transitions
  const quadrantTransition = useMemo(
    () => ({
      type: "spring" as const,
      stiffness: 500,
      damping: 25,
    }),
    []
  );

  const iconInitialVariants = useMemo(
    () => ({
      scale: 0,
      opacity: 0,
      rotate: -180,
    }),
    []
  );

  const iconAnimateVariants = useMemo(
    () => ({
      scale: 1,
      opacity: 1,
      rotate: 0,
    }),
    []
  );

  const iconExitVariants = useMemo(
    () => ({
      scale: 0,
      opacity: 0,
      rotate: 180,
    }),
    []
  );

  const iconTransition = useMemo(
    () => ({
      type: "spring" as const,
      stiffness: 350,
      damping: 20,
      duration: 0.3,
    }),
    []
  );

  const labelInitialVariants = useMemo(
    () => ({
      opacity: 0,
      scale: 0.9,
    }),
    []
  );

  const labelAnimateVariants = useMemo(
    () => ({
      opacity: 1,
      scale: 1,
    }),
    []
  );

  const labelExitVariants = useMemo(
    () => ({
      opacity: 0,
      scale: 0.9,
    }),
    []
  );

  const labelTransition = useMemo(
    () => ({
      duration: 0.2,
      ease: "easeInOut" as const,
    }),
    []
  );

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
      className="flex items-center justify-center rounded-2xl m-2 border-gradient transition-shadow duration-300 select-none"
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
      transition={quadrantTransition}
      onMouseMove={!isSelected ? handleMouseMove : undefined}
      onMouseEnter={() => !isSelected && onHoverChange(position)}
      onMouseLeave={() => !isSelected && onHoverChange(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(isSelected ? null : position);
      }}
    >
      <AnimatePresence mode="popLayout">
        {isSelected ? (
          <QuadrantInterface
            key="interface"
            quadrantPosition={position}
            field={label}
            onClose={() => onSelect(null)}
          />
        ) : shouldShowIcon && Icon ? (
          <motion.div
            key="icon"
            initial={iconInitialVariants}
            animate={iconAnimateVariants}
            exit={iconExitVariants}
            transition={iconTransition}
          >
            <Icon className="w-10 h-10 icon-gradient" strokeWidth={1.5} />
          </motion.div>
        ) : (
          <motion.h2
            key="label"
            initial={labelInitialVariants}
            animate={labelAnimateVariants}
            exit={labelExitVariants}
            transition={labelTransition}
            className="text-4xl font-bold text-gradient-purple py-2"
          >
            {label}
          </motion.h2>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
