import { memo, useMemo } from "react";
import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ExternalLink, Github } from "lucide-react";

interface ProjectLink {
  github?: string;
  website?: string;
}

interface ProjectProps {
  title: string;
  date: string;
  links: ProjectLink;
  description: string[];
  techStack?: string;
  technicalDetails: string[];
}

export const Project = memo(function Project({
  title,
  date,
  links,
  description,
  techStack,
  technicalDetails,
}: ProjectProps) {
  // Memoize animation variants
  const linkHoverVariants = useMemo(
    () => ({
      scale: 1.05,
    }),
    []
  );

  const githubIconVariants = useMemo(
    () => ({
      rotate: 360,
    }),
    []
  );

  const websiteIconVariants = useMemo(
    () => ({
      y: -2,
    }),
    []
  );

  const githubIconTransition = useMemo(
    () => ({
      duration: 0.4,
    }),
    []
  );

  const websiteIconTransition = useMemo(
    () => ({
      duration: 0.2,
      type: "spring" as const,
      stiffness: 300,
    }),
    []
  );

  const listItemHoverVariants = useMemo(
    () => ({
      x: 4,
      scale: 1.01,
      transition: { duration: 0.1 },
    }),
    []
  );
  return (
    <div className="space-y-3 p-4 rounded-lg">
      {/* Header with Title and GitHub Link */}
      <div className="flex justify-between items-start">
        <h4 className="text-lg font-semibold text-white">{title}</h4>
        <div className="flex gap-3">
          {links.github && (
            <motion.a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white transition-colors group"
              whileHover={linkHoverVariants}
            >
              <motion.div
                whileHover={githubIconVariants}
                transition={githubIconTransition}
              >
                <Github className="w-4 h-4" />
              </motion.div>
              <span>GitHub</span>
            </motion.a>
          )}
          {links.website && (
            <motion.a
              href={links.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white transition-colors group"
              whileHover={linkHoverVariants}
            >
              <motion.div
                whileHover={websiteIconVariants}
                transition={websiteIconTransition}
              >
                <ExternalLink className="w-4 h-4" />
              </motion.div>
              <span>Website</span>
            </motion.a>
          )}
        </div>
      </div>

      {/* Tech Stack and Date */}
      <div className="flex justify-between items-start">
        {techStack && (
          <p className="text-sm text-zinc-400 italic">{techStack}</p>
        )}
        <span className="text-sm text-zinc-400 whitespace-nowrap ml-4">
          {date}
        </span>
      </div>

      {/* Description Bullet Points */}
      <ul className="list-disc list-inside text-zinc-300 space-y-1 text-sm">
        {description.map((point, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            whileHover={listItemHoverVariants}
            className="transition-colors hover:text-white cursor-default"
          >
            {point}
          </motion.li>
        ))}
      </ul>

      {/* Technical Details Accordion */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="technical-details">
          <AccordionTrigger className="text-sm text-zinc-300 hover:text-white py-2">
            Technical Details
          </AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc list-inside text-zinc-400 space-y-1 text-sm">
              {technicalDetails.map((detail, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.2 }}
                  whileHover={listItemHoverVariants}
                  className="transition-colors hover:text-zinc-200 cursor-default"
                >
                  {detail}
                </motion.li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
});
