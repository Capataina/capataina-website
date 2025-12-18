import { memo } from "react";
import { motion } from "motion/react";
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
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: index * 0.03,
                  duration: 0.2,
                  type: "spring",
                  stiffness: 200,
                }}
              >
                <motion.div
                  whileHover={{
                    scale: 1.08,
                    rotate: 2,
                    boxShadow: "0 0 8px rgba(168, 150, 200, 0.4)",
                  }}
                  transition={{ duration: 0.15 }}
                >
                  <Badge variant="secondary" className="text-xs">
                    {subskill}
                  </Badge>
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}
        {/* Bullet points */}
        <ul className="list-disc list-inside text-zinc-400 space-y-1">
          {bulletPoints.map((point, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: subskills.length * 0.03 + index * 0.04,
                duration: 0.2,
              }}
              whileHover={{ x: 4, scale: 1.01, transition: { duration: 0.1 } }}
              className="transition-colors hover:text-zinc-200 cursor-default"
            >
              {point}
            </motion.li>
          ))}
        </ul>
      </AccordionContent>
    </AccordionItem>
  );
});
