import type { MDXComponents } from "mdx/types";
import { markdownComponents } from "@/components/articles/markdown-components";

// The MDX provider hook Next.js auto-discovers at this path. We feed it the
// exact same components map the legacy react-markdown pipeline used so
// `.mdx` articles render with identical styling — headings, callouts,
// tables, code fences, ASCII art, task lists, the lot.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...(markdownComponents as MDXComponents),
    ...components,
  };
}
