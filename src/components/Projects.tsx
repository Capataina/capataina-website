interface ProjectsProps {
  field: string;
}

export function Projects({ field }: ProjectsProps) {
  return (
    <div className="w-full h-full">
      <h3 className="text-xl font-bold text-white mb-4 text-center">
        Projects
      </h3>
      <div className="text-zinc-400">
        <p>Projects content will go here...</p>
      </div>
    </div>
  );
}
