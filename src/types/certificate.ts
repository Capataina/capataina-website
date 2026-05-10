import type { Field } from "./field";

export interface Certificate {
  title: string;
  company: string;
  fields: Field[];
  degrees: string[];
  skills: string[];
}
