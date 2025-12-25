import { memo, useMemo } from "react";
import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface CertificateProps {
  title: string;
  company: string;
  degrees: string[];
  skills: string[];
}

export const Certificate = memo(function Certificate({
  title,
  company,
  degrees,
  skills,
}: CertificateProps) {
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
      {/* Title and Company */}
      <div className="flex justify-between items-start gap-4">
        <h4 className="text-lg font-semibold text-white">{title}</h4>
        <p className="text-sm text-zinc-400 italic text-right whitespace-nowrap">
          {company}
        </p>
      </div>

      {/* Accordion for Skills and Degrees */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="details">
          <AccordionTrigger className="text-sm text-zinc-300 hover:text-white py-1.5">
            View Details
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {/* Skills */}
              {skills.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-400 mb-1.5 font-semibold uppercase tracking-wide">
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill, index) => (
                      <motion.div
                        key={skill}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03, duration: 0.2 }}
                      >
                        <Badge
                          variant="secondary"
                          className="text-xs accent-badge"
                        >
                          {skill}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Degrees/Certificates */}
              {degrees.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-400 mb-1.5 font-semibold uppercase tracking-wide">
                    Certificates
                  </p>
                  <ul className="list-disc list-inside text-zinc-400 space-y-0.5 text-sm">
                    {degrees.map((degree, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.2 }}
                        whileHover={listItemHoverVariants}
                        className="transition-colors hover:text-zinc-200 cursor-default"
                      >
                        {degree}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
});
