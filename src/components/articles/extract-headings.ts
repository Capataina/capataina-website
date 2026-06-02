export interface Heading {
  /** 1-6, matching the markdown heading depth. */
  depth: number;
  /** Visible heading text. */
  text: string;
  /** DOM id for the rendered heading; rehype-slug emits these on the
   *  rendered heading elements. */
  slug: string;
}

/**
 * Walks the rendered DOM and reads every h1-h6 inside the article root,
 * in document order. rehype-slug populates `id` on each heading at compile
 * time, so the DOM ids match what the TOC anchors expect.
 *
 * The post-render walk replaces the prior string-parser approach. MDX
 * bodies are pre-compiled React trees with no markdown source available
 * at runtime, so reading the actual rendered headings is the correct
 * source of truth.
 */
export function extractHeadingsFromDom(root: HTMLElement): Heading[] {
  const elements = root.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6");
  const headings: Heading[] = [];

  elements.forEach((el) => {
    const depth = Number(el.tagName.slice(1));
    if (!Number.isFinite(depth) || depth < 1 || depth > 6) return;
    if (!el.id) return;
    const text = (el.textContent ?? "").trim();
    if (!text) return;
    headings.push({ depth, text, slug: el.id });
  });

  return headings;
}
