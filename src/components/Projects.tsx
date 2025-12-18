import { memo, useMemo } from "react";
import { Project } from "./Project";
import { imageBrowser } from "@/projects/image-browser";
import { tectra } from "@/projects/tectra";
import { vynapse } from "@/projects/vynapse";
import { xyntra } from "@/projects/xyntra";
import { zyphos } from "@/projects/zyphos";
import { nyquestro } from "@/projects/nyquestro";
import { multiLlmDebate } from "@/projects/multi-llm-debate";
import { asteroidsAI } from "@/projects/asteroids-ai";
import { fraudDetection } from "@/projects/fraud-detection";
import { gameMods } from "@/projects/game-mods";
import { neuronika } from "@/projects/neuronika";
import { personalWebsite } from "@/projects/personal-website";

interface ProjectsProps {
  field: string;
}

export const Projects = memo(function Projects({ field }: ProjectsProps) {
  const allProjects = [
    imageBrowser,
    tectra,
    vynapse,
    xyntra,
    zyphos,
    nyquestro,
    multiLlmDebate,
    asteroidsAI,
    fraudDetection,
    gameMods,
    neuronika,
    personalWebsite,
  ];

  // Filter projects based on the field - memoized
  const projects = useMemo(
    () => allProjects.filter((project) => project.fields.includes(field)),
    [field]
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <h3 className="text-xl font-bold text-white mb-4 text-center">
        Projects
      </h3>
      <div className="flex-1 overflow-y-auto px-2 space-y-6">
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
              <div className="mt-6 border-t border-zinc-600" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
