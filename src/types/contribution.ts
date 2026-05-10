import type { Field } from "./field";

export type ContributionStatus = "merged" | "closed" | "open" | "released";

export interface ContributionLinks {
  pr?: string;
  repo?: string;
  external?: string;
}

export interface ContributionMetrics {
  linesOfCode?: number;
  filesChanged?: number;
  downloads?: number;
}

export interface Contribution {
  title: string;
  project: string;
  date: string;
  fields: Field[];
  status: ContributionStatus;
  links: ContributionLinks;
  description: string[];
  techStack?: string;
  technicalDetails: string[];
  metrics?: ContributionMetrics;
}
