"use client";

import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Brain,
  Cpu,
  Download,
  Github,
  Image as ImageIcon,
  LineChart,
  Linkedin,
  type LucideIcon,
  Terminal,
} from "lucide-react";
import { useState, useMemo } from "react";

interface HighlightedProject {
  title: string;
  icon: LucideIcon;
  link: string;
  description: string;
}

const highlightedProjects: HighlightedProject[] = [
  {
    title: "Cernio",
    icon: Terminal,
    link: "https://github.com/Capataina/Cernio",
    description:
      "Local-first job-discovery TUI in Rust + Ratatui — combines mechanical ATS scanning across hundreds of companies with conversational Claude-assisted evaluation against a structured candidate profile, all backed by WAL-mode SQLite.",
  },
  {
    title: "Aurix",
    icon: LineChart,
    link: "https://github.com/Capataina/Aurix",
    description:
      "Local-first Tauri 2 DeFi analytics platform — Uniswap V3 LP backtester with Q64.96 fixed-point math, cross-DEX arbitrage detection, hand-crafted ABI encoding, and quantitative risk modelling running entirely on free public RPC endpoints.",
  },
  {
    title: "NeuroDrive",
    icon: Brain,
    link: "https://github.com/Capataina/NeuroDrive",
    description:
      "Brain-inspired continual-learning substrate in Rust + Bevy — Hebbian plasticity, STDP eligibility traces, dopamine-modulated weight updates, and structural plasticity inside a deterministic 2D racing environment, deliberately built without backpropagation or ML frameworks.",
  },
  {
    title: "Nyquestro",
    icon: Cpu,
    link: "https://github.com/Capataina/Nyquestro",
    description:
      "Lock-free limit-order-book matching engine in safe Rust — multi-instrument routing, integrated risk controls (kill-switches, throttles, fat-finger protection), Ratatui observability dashboard with live latency + fill-rate telemetry, and live Coinbase WebSocket market-data integration for BTC, ETH, SOL.",
  },
  {
    title: "Image Browser",
    icon: ImageIcon,
    link: "https://github.com/Capataina/PinterestStyleImageBrowser",
    description:
      "Local-first Pinterest-style image manager built around a 3-encoder semantic-search ensemble (CLIP, DINOv2, SigLIP-2) combined via Reciprocal Rank Fusion, with WAL-mode SQLite background indexing and typed Tauri 2 IPC envelopes — fully offline, privacy-preserving by design.",
  },
];

interface PortfolioCardProps {
  hoveredQuadrant: number | null;
  selectedQuadrant: number | null;
}

export function PortfolioCard({
  hoveredQuadrant,
  selectedQuadrant,
}: PortfolioCardProps) {
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);

  // Respect prefers-reduced-motion. Users who explicitly opt out of motion
  // at the OS level get the still version of the floating card; everyone
  // else sees the original 4s y-bounce loop. Default = unchanged.
  const prefersReducedMotion = useReducedMotion();

  const defaultDescription =
    "Currently shipping NeuroDrive (M6 brain-substrate), Aurix (Vector A V3 LP backtester audited 2026-05), Nyquestro (Phase D matching engine + live Coinbase market data), and Cernio (job-discovery Session 9). Hover over the project chips for more, or click into a quadrant to see everything.";
  const displayedDescription =
    hoveredProject !== null
      ? highlightedProjects[hoveredProject].description
      : defaultDescription;

  // Memoize animation variants and transitions. Floating bounce is
  // skipped when reduced-motion is requested.
  const cardFloatAnimation = useMemo(
    () => (prefersReducedMotion ? { y: 0 } : { y: [0, -8, 0] }),
    [prefersReducedMotion]
  );

  const cardFloatTransition = useMemo(
    () => ({
      y: {
        duration: 4,
        repeat: prefersReducedMotion ? 0 : Infinity,
        ease: "easeInOut" as const,
      },
      layout: { duration: 0.2, ease: "easeOut" as const },
    }),
    [prefersReducedMotion]
  );

  const headerInitialVariants = useMemo(
    () => ({
      opacity: 0,
      y: -10,
    }),
    []
  );

  const headerAnimateVariants = useMemo(
    () => ({
      opacity: 1,
      y: 0,
    }),
    []
  );

  const socialInitialVariants = useMemo(
    () => ({
      opacity: 0,
      scale: 0,
    }),
    []
  );

  const socialAnimateVariants = useMemo(
    () => ({
      opacity: 1,
      scale: 1,
    }),
    []
  );

  const githubHoverVariants = useMemo(
    () => ({
      scale: 1.15,
      rotate: 5,
    }),
    []
  );

  const linkedinHoverVariants = useMemo(
    () => ({
      scale: 1.15,
      rotate: -5,
    }),
    []
  );

  const buttonTapVariants = useMemo(
    () => ({
      scale: 0.95,
    }),
    []
  );

  const buttonTransition = useMemo(
    () => ({
      duration: 0.2,
    }),
    []
  );

  const titleInitialVariants = useMemo(
    () => ({
      opacity: 0,
      y: -10,
    }),
    []
  );

  const cvButtonInitialVariants = useMemo(
    () => ({
      opacity: 0,
      x: 20,
    }),
    []
  );

  const cvButtonAnimateVariants = useMemo(
    () => ({
      opacity: 1,
      x: 0,
    }),
    []
  );

  const cvButtonHoverVariants = useMemo(
    () => ({
      scale: 1.05,
      boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)",
    }),
    []
  );

  const projectsInitialVariants = useMemo(
    () => ({
      opacity: 0,
      y: 10,
    }),
    []
  );

  const projectsAnimateVariants = useMemo(
    () => ({
      opacity: 1,
      y: 0,
    }),
    []
  );

  const projectLinkInitialVariants = useMemo(
    () => ({
      opacity: 0,
      scale: 0,
    }),
    []
  );

  const projectLinkAnimateVariants = useMemo(
    () => ({
      opacity: 1,
      scale: 1,
    }),
    []
  );

  const projectLinkHoverVariants = useMemo(
    () => ({
      scale: 1.1,
      y: -4,
      boxShadow: "0 8px 16px rgba(99, 102, 241, 0.3)",
    }),
    []
  );

  const descriptionInitialVariants = useMemo(
    () => ({
      opacity: 0,
      y: 10,
    }),
    []
  );

  const descriptionAnimateVariants = useMemo(
    () => ({
      opacity: 1,
      y: 0,
    }),
    []
  );

  const descriptionExitVariants = useMemo(
    () => ({
      opacity: 0,
      y: -10,
    }),
    []
  );

  const descriptionTransition = useMemo(
    () => ({
      duration: 0.15,
    }),
    []
  );

  // Calculate offset based on hovered quadrant (move in opposite direction)
  const getOffset = () => {
    const offset = "2.5%"; // 2.5% movement
    switch (hoveredQuadrant) {
      case 1: // Top-left -> move bottom-right
        return { x: offset, y: offset };
      case 2: // Top-right -> move bottom-left
        return { x: `-${offset}`, y: offset };
      case 3: // Bottom-left -> move top-right
        return { x: offset, y: `-${offset}` };
      case 4: // Bottom-right -> move top-left
        return { x: `-${offset}`, y: `-${offset}` };
      default:
        return { x: "0%", y: "0%" };
    }
  };

  const offset = getOffset();
  const isVisible = selectedQuadrant === null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        y: isVisible ? offset.y : -20,
        scale: isVisible ? 1 : 0.96,
        x: offset.x,
      }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{ pointerEvents: isVisible ? "auto" : "none" }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div
        layout="size"
        className="bg-black/15 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl w-[600px]"
        animate={cardFloatAnimation}
        transition={cardFloatTransition}
      >
        <motion.div className="p-4 space-y-3">
          {/* Header Row */}
          <motion.div
            initial={headerInitialVariants}
            animate={headerAnimateVariants}
            transition={{ delay: 0.05, duration: 0.2 }}
            className="flex items-center justify-between gap-3"
          >
            {/* Social Links - Left */}
            <motion.div
              initial={socialInitialVariants}
              animate={socialAnimateVariants}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <motion.a
                href="https://github.com/Capataina"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={githubHoverVariants}
                whileTap={buttonTapVariants}
                transition={buttonTransition}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all duration-200"
              >
                <Github className="w-4 h-4" />
              </motion.a>
              <motion.a
                href="https://www.linkedin.com/in/atacanercetinkaya/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={linkedinHoverVariants}
                whileTap={buttonTapVariants}
                transition={buttonTransition}
                className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg border border-blue-400/30 transition-all duration-200"
              >
                <Linkedin className="w-4 h-4" />
              </motion.a>
            </motion.div>

            {/* Title - Center */}
            <motion.h1
              initial={titleInitialVariants}
              animate={headerAnimateVariants}
              transition={{ delay: 0.08, duration: 0.2 }}
              className="text-xl font-bold text-gradient-purple whitespace-nowrap absolute left-1/2 -translate-x-1/2"
            >
              Hey, I'm Cap! 👋
            </motion.h1>

            {/* Resume Button - Right */}
            <motion.a
              href="/cv/Resume.pdf"
              download="Resume - Ata Caner Cetinkaya.pdf"
              initial={cvButtonInitialVariants}
              animate={cvButtonAnimateVariants}
              transition={{ delay: 0.1, duration: 0.2 }}
              whileHover={cvButtonHoverVariants}
              whileTap={buttonTapVariants}
              className="px-3 py-1.5 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-lg transition-all duration-200 cv-button"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Resume</span>
            </motion.a>
          </motion.div>

          {/* Projects - Horizontal */}
          <motion.div
            initial={projectsInitialVariants}
            animate={projectsAnimateVariants}
            transition={{ delay: 0.12, duration: 0.2 }}
            className="flex items-center gap-2 flex-wrap justify-center"
          >
            {highlightedProjects.map((project, index) => {
              const Icon = project.icon;
              const isHovered = hoveredProject === index;
              return (
                <motion.a
                  key={index}
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => setHoveredProject(index)}
                  onMouseLeave={() => setHoveredProject(null)}
                  initial={projectLinkInitialVariants}
                  animate={projectLinkAnimateVariants}
                  transition={{ delay: 0.15 + index * 0.05, duration: 0.2 }}
                  whileHover={projectLinkHoverVariants}
                  whileTap={buttonTapVariants}
                  title={project.title}
                  className="flex items-center gap-1.5 px-2 py-1.5 bg-white/5 hover:bg-white/15 text-gray-300 hover:text-blue-400 rounded-lg border border-white/10 transition-all duration-200 group"
                  style={{
                    backgroundColor: isHovered
                      ? "rgba(255, 255, 255, 0.15)"
                      : undefined,
                  }}
                >
                  <motion.div
                    animate={{ rotate: isHovered ? 360 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </motion.div>
                  <span className="text-xs font-medium">{project.title}</span>
                </motion.a>
              );
            })}
          </motion.div>

          {/* Dynamic Description — auto-height; the wrapper's `layout`
              prop animates the height change as the description text
              swaps. The outer card has `layout="size"`, so it picks up
              the size delta and the card itself grows / shrinks
              smoothly. AnimatePresence with `mode="wait"` cross-fades
              between descriptions: old fades out, new fades in. */}
          <motion.div
            layout
            transition={{
              layout: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
            }}
            className="flex items-center justify-center min-h-[3rem] overflow-hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={hoveredProject ?? "default"}
                initial={descriptionInitialVariants}
                animate={descriptionAnimateVariants}
                exit={descriptionExitVariants}
                transition={descriptionTransition}
                className="text-gray-300 text-xs leading-relaxed text-center"
              >
                {displayedDescription}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
