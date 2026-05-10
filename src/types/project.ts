import type { Field } from "./field";

export interface ProjectLinks {
  github?: string;
  website?: string;
}

export interface Project {
  title: string;
  date: string;
  fields: Field[];
  links: ProjectLinks;
  description: string[];
  techStack?: string;
  technicalDetails: string[];
  featured?: boolean;
}
