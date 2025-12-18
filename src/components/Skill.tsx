import { memo } from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface SkillProps {
  name: string;
  subskills: string[];
  bulletPoints: string[];
}

export const Skill = memo(function Skill({
  name,
  subskills,
  bulletPoints,
}: SkillProps) {
  return (
    <AccordionItem value={name} className="py-1">
      <AccordionTrigger className="text-white hover:text-zinc-300">
        {name}
      </AccordionTrigger>
      <AccordionContent>
        {/* Subskills as badges */}
        {subskills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {subskills.map((subskill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {subskill}
              </Badge>
            ))}
          </div>
        )}
        {/* Bullet points */}
        <ul className="list-disc list-inside text-zinc-400 space-y-1">
          {bulletPoints.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </AccordionContent>
    </AccordionItem>
  );
});
