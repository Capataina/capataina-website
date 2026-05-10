"use client";

import { motion, AnimatePresence } from "motion/react";
import { useRef, useMemo } from "react";
import type { CSSProperties } from "react";
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
  /** When true, the quadrant collapses to an L-shape pinned to its corner
   *  via clip-path; the central 80% × 80% area is freed for the articles
   *  panel. Hover and click semantics are also disabled — the L-shapes
   *  are visual chrome that lets the page background show through. */
  articlesMode?: boolean;
}

// L-shape clip-path classes are defined in globals.css — applying them via
// className (rather than an inline `clipPath` style on a motion.div) keeps
// the path applied consistently through layout animations.
const L_SHAPE_CLASS: Record<number, string> = {
  1: "quadrant-l-1",
  2: "quadrant-l-2",
  3: "quadrant-l-3",
  4: "quadrant-l-4",
};

// Corner-icon positions per quadrant. Fixed pixel insets give equal
// physical distance from every viewport corner regardless of quadrant
// aspect ratio (percentages would skew on non-square viewports).
const CORNER_POSITIONS: Record<number, CSSProperties> = {
  1: { top: "1.75rem", left: "1.75rem" },
  2: { top: "1.75rem", right: "1.75rem" },
  3: { bottom: "1.75rem", left: "1.75rem" },
  4: { bottom: "1.75rem", right: "1.75rem" },
};

export function Quadrant({
  position,
  hoveredQuadrant,
  selectedQuadrant,
  onHoverChange,
  onSelect,
  label,
  articlesMode = false,
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

    // Case-studies mode → 50/50 (each quadrant fills its corner; clip-path
    // carves the L-shape inside). Hover during this mode does not change
    // size — the visual response would fight with the central panel.
    if (articlesMode) {
      return { width: "calc(50% - 16px)", height: "calc(50% - 16px)" };
    }

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
  }, [
    position,
    selectedQuadrant,
    hoveredQuadrant,
    isAnyHovered,
    isHovered,
    articlesMode,
  ]);

  const isActive = isHovered || isSelected;

  // Memoize the inline style object so referential equality holds across
  // renders that don't change `isActive`. Saves React's style-prop diff.
  // In articles mode the bg alpha is bumped so the L-shape is clearly
  // visible against the page background; the clip-path itself is applied
  // via the className below.
  const quadrantStyle = useMemo(() => {
    if (articlesMode) {
      return {
        background: "hsla(285, 10%, 18%, 0.22)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        contain: "layout style paint" as const,
      };
    }
    return {
      background: isActive
        ? "hsla(285, 10%, 18%, 0.10)"
        : "hsla(285, 8%, 16%, 0.06)",
      backdropFilter: "blur(2px)",
      WebkitBackdropFilter: "blur(2px)",
      contain: "layout style paint" as const,
    };
  }, [isActive, articlesMode]);

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

  // L-shape class is applied alongside the existing layout classes when
  // articles mode is on. The class lives in globals.css so motion's
  // style merging can't strip it.
  const quadrantClass = articlesMode
    ? `flex items-center justify-center rounded-2xl m-2 border-gradient transition-shadow duration-300 select-none ${L_SHAPE_CLASS[position]}`
    : "flex items-center justify-center rounded-2xl m-2 border-gradient transition-shadow duration-300 select-none";

  return (
    <motion.div
      ref={quadrantRef}
      className={quadrantClass}
      style={quadrantStyle}
      animate={quadrantAnimate}
      transition={quadrantTransition}
      onMouseEnter={() =>
        !isSelected && !articlesMode && onHoverChange(position)
      }
      onMouseLeave={() =>
        !isSelected && !articlesMode && onHoverChange(null)
      }
      onClick={(e) => {
        // In articles mode the L-shape is visual chrome only; let the
        // click bubble to the page background handler so it closes the
        // panel instead of opening this quadrant.
        if (articlesMode) return;
        e.stopPropagation();
        onSelect(isSelected ? null : position);
      }}
    >
      {/* Corner icon — only mounted in articles mode. Sits at the
          inside-the-L corner square (10% × 10% of the viewport), the
          only un-clipped region of the element. */}
      <AnimatePresence>
        {articlesMode && Icon && (
          <motion.div
            key="corner-icon"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="absolute pointer-events-none"
            style={CORNER_POSITIONS[position]}
          >
            <Icon className="w-9 h-9 icon-gradient" strokeWidth={1.5} />
          </motion.div>
        )}
      </AnimatePresence>

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
        ) : articlesMode ? null : (
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
