import { Projects } from "./Projects";
import { Skills } from "./Skills";
import { Educations } from "./Educations";
import { Certificates } from "./Certificates";
import { X, Download } from "lucide-react";

interface QuadrantInterfaceProps {
  quadrantPosition: number;
  field: string;
  onClose: () => void;
}

export function QuadrantInterface({
  quadrantPosition,
  field,
  onClose,
}: QuadrantInterfaceProps) {
  return (
    <div
      className="w-full h-full flex flex-col relative"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b accent-border">
        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-2 rounded-lg accent-button transition-colors group"
          aria-label="Close"
        >
          <X className="w-5 h-5 accent-text accent-text-hover" />
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-gradient-purple">{field}</h2>

        {/* Download CV Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Implement CV download
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg accent-button transition-colors group"
          aria-label="Download CV"
        >
          <Download className="w-4 h-4 accent-text accent-text-hover" />
          <span className="text-sm accent-text accent-text-hover">
            Download CV
          </span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left Column: Education, Projects, and Certificates */}
        <div
          className="w-[70%] h-full rounded-lg p-4 relative card-glow overflow-y-auto"
          style={{
            background: "hsla(285, 8%, 19%, 0.6)",
          }}
        >
          <div className="space-y-4">
            <Educations field={field} />
            <div className="border-t border-zinc-600" />
            <Projects field={field} />
            <div className="border-t border-zinc-600" />
            <Certificates field={field} />
          </div>
        </div>

        {/* Skills Column */}
        <div
          className="w-[30%] h-full rounded-lg p-4 card-glow overflow-y-auto"
          style={{
            background: "hsla(285, 8%, 19%, 0.6)",
          }}
        >
          <Skills field={field} />
        </div>
      </div>
    </div>
  );
}
