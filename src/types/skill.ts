import type { Field } from "./field";

export interface Skill {
  name: string;
  fields: Field[];
  subskills: string[];
  bulletPoints: string[];
}
