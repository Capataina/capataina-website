import { memo, useMemo } from "react";
import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface EducationProps {
  title: string;
  location: string;
  degree: string;
  date: string;
  bullets: string[];
}

export const Education = memo(function Education({
  title,
  location,
  degree,
  date,
  bullets,
}: EducationProps) {
  // Memoize animation variants
  const listItemHoverVariants = useMemo(
    () => ({
      x: 4,
      scale: 1.01,
      transition: { duration: 0.1 },
    }),
    []
  );

  return (
    <div className="space-y-2 p-3 rounded-lg">
      {/* Title and Degree */}
      <div className="flex justify-between items-start gap-4">
        <h4 className="text-lg font-semibold text-white">{title}</h4>
        <p className="text-sm text-zinc-300 text-right">{degree}</p>
      </div>

      {/* Location and Date */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-zinc-400 italic">{location}</span>
        <span className="text-sm text-zinc-400 whitespace-nowrap ml-4">
          {date}
        </span>
      </div>

      {/* Bullets Accordion */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="bullets">
          <AccordionTrigger className="text-sm text-zinc-300 hover:text-white py-1.5">
            Highlights
          </AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc list-inside text-zinc-400 space-y-0.5 text-sm">
              {bullets.map((bullet, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.2 }}
                  whileHover={listItemHoverVariants}
                  className="transition-colors hover:text-zinc-200 cursor-default"
                >
                  {bullet}
                </motion.li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
});
