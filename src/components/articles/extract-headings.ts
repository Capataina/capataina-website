import GithubSlugger from "github-slugger";

export interface Heading {
  /** 1-6, matching the markdown heading depth. */
  depth: number;
  /** Visible heading text, with markdown emphasis stripped. */
  text: string;
  /** DOM id for the rendered heading; matches what rehype-slug emits. */
  slug: string;
}

const HEADING_LINE = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const FENCE_LINE = /^\s*(```|~~~)/;

/** Strip the basic markdown emphasis we use in headings so the TOC reads cleanly. */
function stripEmphasis(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
}

/**
 * Walks the markdown body line-by-line, ignores any line inside a fenced code
 * block (`, ~ on either side), and returns the headings in document order.
 *
 * Slug generation uses a fresh GithubSlugger so duplicate headings get the
 * same `-1`, `-2` suffixes that rehype-slug would produce — anchor links
 * stay aligned between the TOC and the rendered body.
 */
export function extractHeadings(body: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];

  let inFence = false;
  for (const line of body.split("\n")) {
    if (FENCE_LINE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = HEADING_LINE.exec(line);
    if (!match) continue;

    const depth = match[1].length;
    const text = stripEmphasis(match[2]);
    headings.push({ depth, text, slug: slugger.slug(text) });
  }

  return headings;
}
