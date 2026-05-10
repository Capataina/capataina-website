import { memo, useMemo } from "react";
import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Github, GitPullRequest } from "lucide-react";
import type { Contribution as ContributionType } from "@/types";

type ContributionProps = Omit<ContributionType, "fields">;

const STATUS_LABELS: Record<ContributionType["status"], string> = {
  merged: "Merged",
  closed: "Closed",
  open: "Open",
  released: "Released",
};

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toString();
}

export const Contribution = memo(function Contribution({
  title,
  project,
  date,
  status,
  links,
  description,
  techStack,
  technicalDetails,
  metrics,
}: ContributionProps) {
  const linkHoverVariants = useMemo(() => ({ scale: 1.05 }), []);
  const githubIconVariants = useMemo(() => ({ rotate: 360 }), []);
  const websiteIconVariants = useMemo(() => ({ y: -2 }), []);

  const githubIconTransition = useMemo(() => ({ duration: 0.4 }), []);
  const websiteIconTransition = useMemo(
    () => ({ duration: 0.2, type: "spring" as const, stiffness: 300 }),
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
    <div className="space-y-2 p-3 rounded-lg">
      {/* Header: title + links */}
      <div className="flex justify-between items-start gap-3">
        <h4 className="text-lg font-semibold text-white">{title}</h4>
        <div className="flex gap-3 shrink-0">
          {links.pr && (
            <motion.a
              href={links.pr}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white transition-colors group"
              whileHover={linkHoverVariants}
            >
              <motion.div
                whileHover={githubIconVariants}
                transition={githubIconTransition}
              >
                <GitPullRequest className="w-4 h-4" />
              </motion.div>
              <span>PR</span>
            </motion.a>
          )}
          {links.repo && (
            <motion.a
              href={links.repo}
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
              <span>Repo</span>
            </motion.a>
          )}
          {links.external && (
            <motion.a
              href={links.external}
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
              <span>Link</span>
            </motion.a>
          )}
        </div>
      </div>

      {/* Project, status badge, date */}
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400 italic">{project}</span>
          <Badge variant="secondary" className="text-xs accent-badge">
            {STATUS_LABELS[status]}
          </Badge>
        </div>
        <span className="text-sm text-zinc-400 whitespace-nowrap">{date}</span>
      </div>

      {/* Tech stack (optional) */}
      {techStack && (
        <p className="text-xs text-zinc-500 italic">{techStack}</p>
      )}

      {/* Inline metrics */}
      {metrics && (
        <div className="flex gap-4 text-xs text-zinc-400">
          {metrics.linesOfCode !== undefined && (
            <span>
              <span className="text-zinc-200 font-semibold">
                {formatNumber(metrics.linesOfCode)}
              </span>{" "}
              lines
            </span>
          )}
          {metrics.filesChanged !== undefined && (
            <span>
              <span className="text-zinc-200 font-semibold">
                {metrics.filesChanged}
              </span>{" "}
              files
            </span>
          )}
          {metrics.downloads !== undefined && (
            <span>
              <span className="text-zinc-200 font-semibold">
                {formatNumber(metrics.downloads)}
              </span>{" "}
              downloads
            </span>
          )}
        </div>
      )}

      {/* Description bullet points */}
      <ul className="list-disc list-inside text-zinc-300 space-y-0.5 text-sm">
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

      {/* Technical Details accordion */}
      {technicalDetails.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="technical-details">
            <AccordionTrigger className="text-sm text-zinc-300 hover:text-white py-1.5">
              Technical Details
            </AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc list-inside text-zinc-400 space-y-0.5 text-sm">
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
      )}
    </div>
  );
});
