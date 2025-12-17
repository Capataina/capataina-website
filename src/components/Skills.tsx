import { Accordion } from "@/components/ui/accordion";
import { Skill } from "./Skill";
import { javascript } from "@/skills/javascript";
import { react } from "@/skills/react";
import { rust } from "@/skills/rust";
import { tauri } from "@/skills/tauri";
import { git } from "@/skills/git";

interface SkillsProps {
  field: string;
}

export function Skills({ field }: SkillsProps) {
  const allSkills = [javascript, react, rust, tauri, git];

  // Filter skills based on the field
  const skills = allSkills.filter((skill) => skill.fields.includes(field));

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <h3 className="text-xl font-bold text-white mb-4 text-center">Skills</h3>
      <Accordion type="single" collapsible className="w-full">
        {skills.map((skill) => (
          <Skill
            key={skill.name}
            name={skill.name}
            bulletPoints={skill.bulletPoints}
          />
        ))}
      </Accordion>
    </div>
  );
}
