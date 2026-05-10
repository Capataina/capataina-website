import type { Field } from "./field";

export interface Education {
  title: string;
  location: string;
  degree: string;
  date: string;
  fields: Field[];
  bullets: string[];
}
