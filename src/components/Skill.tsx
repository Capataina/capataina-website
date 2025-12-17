import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SkillProps {
  name: string;
  bulletPoints: string[];
}

export function Skill({ name, bulletPoints }: SkillProps) {
  return (
    <AccordionItem value={name}>
      <AccordionTrigger className="text-white hover:text-zinc-300">
        {name}
      </AccordionTrigger>
      <AccordionContent>
        <ul className="list-disc list-inside text-zinc-400 space-y-1">
          {bulletPoints.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </AccordionContent>
    </AccordionItem>
  );
}
