import { Projects } from "@/components/projects/Projects";
import { Skills } from "@/components/skills/Skills";
import { Educations } from "@/components/educations/Educations";
import { Certificates } from "@/components/certificates/Certificates";
import { Contributions } from "@/components/open-source/Contributions";
import { X } from "lucide-react";

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

        {/* Right-side spacer to keep title centred */}
        <div className="w-9" aria-hidden="true" />
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
          <div className="space-y-4 divide-y divide-zinc-700/60 [&>*]:pt-4 [&>*:first-child]:pt-0">
            <Educations field={field} />
            <Projects field={field} />
            <Contributions field={field} />
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
