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
      <div
        className="w-[70%] rounded-lg p-4 relative card-glow"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.19 0.01 285), oklch(0.185 0.005 260))",
          backdropFilter: "blur(8px)",
        }}
      >
        <Projects field={field} />
      </div>

      {/* Skills Column */}
      <div
        className="w-[30%] rounded-lg p-4 card-glow"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.19 0.01 285), oklch(0.185 0.005 260))",
          backdropFilter: "blur(8px)",
        }}
      >
        <Skills field={field} />
      </div>
    </div>
  );
}
