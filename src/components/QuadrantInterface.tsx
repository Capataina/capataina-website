import { Projects } from "./Projects";
import { Skills } from "./Skills";

interface QuadrantInterfaceProps {
  quadrantPosition: number;
  field: string;
}

export function QuadrantInterface({
  quadrantPosition,
  field,
}: QuadrantInterfaceProps) {
  return (
    <div
      className="w-full h-full flex gap-4 p-4 relative"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Projects Column */}
      <div className="w-[70%] bg-zinc-700 rounded-lg p-4 relative">
        <Projects field={field} />
      </div>

      {/* Vertical Divider - positioned between columns */}
      <div className="absolute left-[calc(70%-0.5rem)] top-1/2 -translate-y-1/2 h-3/4 w-px bg-gradient-to-b from-transparent via-zinc-400 to-transparent" />

      {/* Skills Column */}
      <div className="w-[30%] bg-zinc-700 rounded-lg p-4">
        <Skills field={field} />
      </div>
    </div>
  );
}
