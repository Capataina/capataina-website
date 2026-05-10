"use client";

import { motion, AnimatePresence } from "motion/react";
import { useRef, useMemo } from "react";
import { QuadrantInterface } from "./QuadrantInterface";
import { Cpu, Brain, GitBranch, Database, LucideIcon } from "lucide-react";

// Icon mapping for each quadrant label
const labelIconMap: Record<string, LucideIcon> = {
  "Systems & Infrastructure Engineer": Cpu,
  "Applied AI & ML Infrastructure Engineer": Brain,
  "Open Source Engineer": GitBranch,
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
  const quadrantRef = useRef<HTMLDivElement>(null);

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

  // Size = a function of the (column, row) partitions L/R and T/B, where
  // L+R = T+B = 100%. The selected quadrant fixes the partitions to 80/20;
  // hover during selection nudges the partitions by 5% toward the hovered
  // pane, so the small panes get a gentle hover response without breaking
  // the L/R/T/B = 100% invariant.
  const size = useMemo(() => {
    const isLeftColumn = position % 2 === 1;
    const isTopRow = position <= 2;

    // No selection → original idle / hover layout.
    if (selectedQuadrant === null) {
      if (!isAnyHovered) {
        return { width: "calc(50% - 16px)", height: "calc(50% - 16px)" };
      }
      if (isHovered) {
        return { width: "calc(55% - 16px)", height: "calc(55% - 16px)" };
      }
      const hoveredIsTopRow = hoveredQuadrant! <= 2;
      const hoveredIsLeftColumn = hoveredQuadrant! % 2 === 1;
      const sharesSameRow = isTopRow === hoveredIsTopRow;
      const sharesSameColumn = isLeftColumn === hoveredIsLeftColumn;
      return {
        width: sharesSameColumn ? "calc(55% - 16px)" : "calc(45% - 16px)",
        height: sharesSameRow ? "calc(55% - 16px)" : "calc(45% - 16px)",
      };
    }

    // Selection mode — base partitions: 80% for the selected row/column,
    // 20% for the other.
    const selectedIsLeftColumn = selectedQuadrant! % 2 === 1;
    const selectedIsTopRow = selectedQuadrant! <= 2;
    let leftColW = selectedIsLeftColumn ? 80 : 20;
    let rightColW = selectedIsLeftColumn ? 20 : 80;
    let topRowH = selectedIsTopRow ? 80 : 20;
    let bottomRowH = selectedIsTopRow ? 20 : 80;

    // Hovering a non-selected pane during selection — nudge the partitions
    // 5% toward the hovered pane. The selected pane shrinks by the same
    // amount so L+R and T+B stay at 100%.
    if (hoveredQuadrant !== null && hoveredQuadrant !== selectedQuadrant) {
      const hoveredIsLeftColumn = hoveredQuadrant % 2 === 1;
      const hoveredIsTopRow = hoveredQuadrant <= 2;
      const NUDGE = 5;

      if (hoveredIsLeftColumn !== selectedIsLeftColumn) {
        if (hoveredIsLeftColumn) {
          leftColW += NUDGE;
          rightColW -= NUDGE;
        } else {
          leftColW -= NUDGE;
          rightColW += NUDGE;
        }
      }
      if (hoveredIsTopRow !== selectedIsTopRow) {
        if (hoveredIsTopRow) {
          topRowH += NUDGE;
          bottomRowH -= NUDGE;
        } else {
          topRowH -= NUDGE;
          bottomRowH += NUDGE;
        }
      }
    }

    const widthPct = isLeftColumn ? leftColW : rightColW;
    const heightPct = isTopRow ? topRowH : bottomRowH;
    return {
      width: `calc(${widthPct}% - 16px)`,
      height: `calc(${heightPct}% - 16px)`,
    };
  }, [position, selectedQuadrant, hoveredQuadrant, isAnyHovered, isHovered]);

  const isActive = isHovered || isSelected;

  // Memoize the inline style object so referential equality holds across
  // renders that don't change `isActive`. Saves React's style-prop diff.
  const quadrantStyle = useMemo(
    () => ({
      background: isActive
        ? "hsla(285, 10%, 18%, 0.10)"
        : "hsla(285, 8%, 16%, 0.06)",
      backdropFilter: "blur(2px)",
      WebkitBackdropFilter: "blur(2px)",
      contain: "layout style paint" as const,
    }),
    [isActive]
  );

  // Memoize the animate target so Motion can short-circuit when the
  // size + shadow tuple is unchanged across renders.
  const quadrantAnimate = useMemo(
    () => ({
      width: size.width,
      height: size.height,
      boxShadow: isActive
        ? "0 4px 16px -2px rgba(0, 0, 0, 0.4)"
        : "0 2px 8px -1px rgba(0, 0, 0, 0.3)",
    }),
    [size.width, size.height, isActive]
  );

  return (
    <motion.div
      ref={quadrantRef}
      className="flex items-center justify-center rounded-2xl m-2 border-gradient transition-shadow duration-300 select-none"
      style={quadrantStyle}
      animate={quadrantAnimate}
      transition={quadrantTransition}
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
            className="text-3xl font-bold text-gradient-purple py-2 px-4 text-center text-balance"
          >
            {label}
          </motion.h2>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
