export const FIELDS = [
  "Systems & Infrastructure Engineer",
  "Applied AI & ML Infrastructure Engineer",
  "Low Level Financial Systems Engineer",
  "Open Source Engineer",
] as const;

export type Field = (typeof FIELDS)[number];
