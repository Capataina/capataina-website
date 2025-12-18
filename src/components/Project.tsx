import { memo } from "react";
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
  return (
    <div className="space-y-3 p-4 rounded-lg">
      {/* Header with Title and GitHub Link */}
      <div className="flex justify-between items-start">
        <h4 className="text-lg font-semibold text-white">{title}</h4>
        <div className="flex gap-3">
          {links.github && (
            <a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          )}
          {links.website && (
            <a
              href={links.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Website</span>
            </a>
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
          <li key={index}>{point}</li>
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
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
});
