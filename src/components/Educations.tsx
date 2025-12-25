import { memo, useMemo } from "react";
import { Education } from "./Education";
import { universityOfYork } from "@/educations/university-of-york";

interface EducationsProps {
  field: string;
}

export const Educations = memo(function Educations({ field }: EducationsProps) {
  const allEducations = [universityOfYork];

  // Filter educations based on the field - memoized
  const educations = useMemo(
    () =>
      allEducations
        .filter((education) => education.fields.includes(field))
        .sort((a, b) => a.title.localeCompare(b.title)),
    [field]
  );

  // Don't render if there are no educations
  if (educations.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col">
      <h3 className="text-xl font-bold text-white mb-3 text-center">
        Education
      </h3>
      <div className="space-y-3">
        {educations.map((education, index) => (
          <div key={education.title}>
            <Education
              title={education.title}
              location={education.location}
              degree={education.degree}
              date={education.date}
              bullets={education.bullets}
            />
            {/* Divider between educations (except after last one) */}
            {index < educations.length - 1 && (
              <div className="mt-3 border-t border-zinc-600" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
