import { memo, useMemo } from "react";
import { Project } from "./Project";
import type { Project as ProjectType } from "@/types";
import { aurix } from "@/content/projects/aurix";
import { cernio } from "@/content/projects/cernio";
import { neurodrive } from "@/content/projects/neurodrive";
import { imageBrowser } from "@/content/projects/image-browser";
import { nyquestro } from "@/content/projects/nyquestro";
import { tectra } from "@/content/projects/tectra";
import { neuronika } from "@/content/projects/neuronika";
import { vynapse } from "@/content/projects/vynapse";
import { xyntra } from "@/content/projects/xyntra";
import { zyphos } from "@/content/projects/zyphos";
import { chrona } from "@/content/projects/chrona";
import { consilium } from "@/content/projects/consilium";
import { asteroidsAI } from "@/content/projects/asteroids-ai";
import { fraudDetection } from "@/content/projects/fraud-detection";
import { personalWebsite } from "@/content/projects/personal-website";

interface ProjectsProps {
  field: string;
}

export const Projects = memo(function Projects({ field }: ProjectsProps) {
  const allProjects: ProjectType[] = [
    aurix,
    cernio,
    neurodrive,
    imageBrowser,
    nyquestro,
    tectra,
    neuronika,
    vynapse,
    xyntra,
    zyphos,
    chrona,
    consilium,
    asteroidsAI,
    fraudDetection,
    personalWebsite,
  ];

  // Filter projects based on the field - memoized.
  // Featured projects float to the top; remaining sorted alphabetically.
  const projects = useMemo(
    () =>
      allProjects
        .filter((project) =>
          project.fields.includes(field as ProjectType["fields"][number])
        )
        .sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return a.title.localeCompare(b.title);
        }),
    [field]
  );

  // Don't render if there are no projects
  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col">
      <h3 className="text-xl font-bold text-white mb-3 text-center">
        Projects
      </h3>
      <div className="space-y-3">
        {projects.map((project, index) => (
          <div key={project.title}>
            <Project
              title={project.title}
              date={project.date}
              links={project.links}
              description={project.description}
              techStack={project.techStack}
              technicalDetails={project.technicalDetails}
            />
            {/* Divider between projects (except after last one) */}
            {index < projects.length - 1 && (
              <div className="mt-3 border-t border-zinc-600" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
