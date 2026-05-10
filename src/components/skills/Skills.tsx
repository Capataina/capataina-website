import { memo, useMemo } from "react";
import { Accordion } from "@/components/ui/accordion";
import { Skill } from "./Skill";
import { machineLearning } from "@/content/skills/machine-learning";
import { webDevelopment } from "@/content/skills/web-development";
import { desktopDevelopment } from "@/content/skills/desktop-development";
import { systemsProgramming } from "@/content/skills/systems-programming";
import { networkingProtocols } from "@/content/skills/networking-protocols";
import { dataEngineering } from "@/content/skills/data-engineering";
import { compilerGPU } from "@/content/skills/compiler-gpu";
import { largeLanguageModels } from "@/content/skills/large-language-models";
import { linuxDevOps } from "@/content/skills/linux-devops";
import { cybersecurityNetworking } from "@/content/skills/cybersecurity-networking";
import { mathematicsOptimization } from "@/content/skills/mathematics-optimization";
import { gameDevelopment } from "@/content/skills/game-development";

interface SkillsProps {
  field: string;
}

export const Skills = memo(function Skills({ field }: SkillsProps) {
  const allSkills = [
    machineLearning,
    webDevelopment,
    desktopDevelopment,
    systemsProgramming,
    networkingProtocols,
    dataEngineering,
    compilerGPU,
    largeLanguageModels,
    linuxDevOps,
    cybersecurityNetworking,
    mathematicsOptimization,
    gameDevelopment,
  ];

  // Filter skills based on the field - memoized
  const skills = useMemo(
    () =>
      allSkills
        .filter((skill) => skill.fields.includes(field))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [field]
  );

  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-xl font-bold text-white text-center pt-2 pb-4">
        Skills
      </h3>
      <div className="w-full flex-1 overflow-y-auto px-2">
        <div className="min-h-full flex items-center">
          <Accordion type="single" collapsible className="w-full px-2">
            {skills.map((skill) => (
              <Skill
                key={skill.name}
                name={skill.name}
                subskills={skill.subskills}
                bulletPoints={skill.bulletPoints}
              />
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
});
