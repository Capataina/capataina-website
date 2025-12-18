"use client";

import { motion, AnimatePresence } from "motion/react";
import { Github, Linkedin, Download } from "lucide-react";
import { Cpu, Brain, Sparkles } from "lucide-react";
import { useState } from "react";

interface HighlightedProject {
  title: string;
  icon: any;
  link: string;
  description: string;
}

const highlightedProjects: HighlightedProject[] = [
  {
    title: "Tectra",
    icon: Cpu,
    link: "https://github.com/Capataina/Tectra",
    description:
      "High-performance all inclusive hybrid trading infrastructure targeting >1M messages/sec with microsecond-level risk checks.",
  },
  {
    title: "Image Browser",
    icon: Brain,
    link: "https://github.com/Capataina/PinterestStyleImageBrowser",
    description:
      "A Pinterest-style image browsing app built using Tauri. Features CLIP powered semantic and image similarity search options as well as local image embedding generation.",
  },
  {
    title: "Vynapse",
    icon: Sparkles,
    link: "https://github.com/Capataina/Vynapse",
    description:
      "A neuroevolution and deep learning framework built from scratch in Rust, inspired by Pytorch, Tensorflow, Deap and NEAT.",
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

  const defaultDescription =
    "I am currently most actively developing Pinterest Style Image Browser. If you want to find out more about my projects, hover over them or click on the quadrants to explore!";
  const displayedDescription =
    hoveredProject !== null
      ? highlightedProjects[hoveredProject].description
      : defaultDescription;

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
        transition={{ layout: { duration: 0.2, ease: "easeOut" } }}
      >
        <motion.div className="p-4 space-y-3">
          {/* Header Row */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.2 }}
            className="flex items-center justify-between gap-3"
          >
            {/* Social Links - Left */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <motion.a
                href="https://github.com/Capataina"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all duration-200"
              >
                <Github className="w-4 h-4" />
              </motion.a>
              <motion.a
                href="https://www.linkedin.com/in/atacanercetinkaya/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.15, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg border border-blue-400/30 transition-all duration-200"
              >
                <Linkedin className="w-4 h-4" />
              </motion.a>
            </motion.div>

            {/* Title - Center */}
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.2 }}
              className="text-xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap absolute left-1/2 -translate-x-1/2"
            >
              Hey, I'm Capataina! 👋
            </motion.h1>

            {/* CV Button - Right */}
            <motion.a
              href="/cv.pdf"
              download
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)",
              }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-lg transition-all duration-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Full Resume</span>
            </motion.a>
          </motion.div>

          {/* Projects - Horizontal */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
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
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + index * 0.05, duration: 0.2 }}
                  whileHover={{
                    scale: 1.1,
                    y: -4,
                    boxShadow: "0 8px 16px rgba(99, 102, 241, 0.3)",
                  }}
                  whileTap={{ scale: 0.95 }}
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

          {/* Dynamic Description */}
          <div className="overflow-hidden h-12 flex items-center justify-center">
            <motion.p
              key={hoveredProject}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="text-gray-300 text-xs leading-relaxed text-center"
            >
              {displayedDescription}
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
