import { Accordion } from "@/components/ui/accordion";
import { Skill } from "./Skill";
import { machineLearning } from "@/skills/machine-learning";
import { webDevelopment } from "@/skills/web-development";
import { desktopDevelopment } from "@/skills/desktop-development";
import { systemsProgramming } from "@/skills/systems-programming";
import { networkingProtocols } from "@/skills/networking-protocols";
import { dataEngineering } from "@/skills/data-engineering";
import { compilerGPU } from "@/skills/compiler-gpu";
import { largeLanguageModels } from "@/skills/large-language-models";
import { linuxDevOps } from "@/skills/linux-devops";
import { cybersecurityNetworking } from "@/skills/cybersecurity-networking";
import { mathematicsOptimization } from "@/skills/mathematics-optimization";
import { gameDevelopment } from "@/skills/game-development";

interface SkillsProps {
  field: string;
}

export function Skills({ field }: SkillsProps) {
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

  // Filter skills based on the field
  const skills = allSkills.filter((skill) => skill.fields.includes(field));

  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-xl font-bold text-white text-center pt-2 pb-4">
        Skills
      </h3>
      <div className="w-full flex-1 overflow-y-auto">
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
}
