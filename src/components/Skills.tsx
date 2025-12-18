import { Accordion } from "@/components/ui/accordion";
import { Skill } from "./Skill";
import { rust } from "@/skills/rust";
import { cpp } from "@/skills/cpp";
import { python } from "@/skills/python";
import { pytorch } from "@/skills/pytorch";
import { tensorflow } from "@/skills/tensorflow";
import { neuroevolution } from "@/skills/neuroevolution";
import { mlFrameworks } from "@/skills/ml-frameworks";
import { react } from "@/skills/react";
import { nextjs } from "@/skills/nextjs";
import { tauri } from "@/skills/tauri";
import { typescript } from "@/skills/typescript";
import { networking } from "@/skills/networking";
import { linux } from "@/skills/linux";
import { sqlite } from "@/skills/sqlite";
import { dataScience } from "@/skills/data-science";
import { compilerDesign } from "@/skills/compiler-design";
import { llms } from "@/skills/llms";
import { mathematics } from "@/skills/mathematics";
import { gameDev } from "@/skills/game-dev";
import { cybersecurity } from "@/skills/cybersecurity";

interface SkillsProps {
  field: string;
}

export function Skills({ field }: SkillsProps) {
  const allSkills = [
    rust,
    cpp,
    python,
    pytorch,
    tensorflow,
    neuroevolution,
    mlFrameworks,
    react,
    nextjs,
    tauri,
    typescript,
    networking,
    linux,
    sqlite,
    dataScience,
    compilerDesign,
    llms,
    mathematics,
    gameDev,
    cybersecurity,
  ];

  // Filter skills based on the field
  const skills = allSkills.filter((skill) => skill.fields.includes(field));

  return (
    <div className="w-full h-full flex flex-col items-center justify-center overflow-y-auto">
      <h3 className="text-xl font-bold text-white mb-4 text-center sticky top-0 bg-zinc-700 pb-2">
        Skills
      </h3>
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
  );
}
