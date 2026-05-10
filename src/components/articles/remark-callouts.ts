import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Blockquote, Paragraph, Text } from "mdast";

/**
 * Remark plugin that detects Obsidian/GitHub-style callout markers in
 * blockquotes and tags them with a `data-callout` attribute on the
 * resulting `<blockquote>` element.
 *
 * Input markdown:
 *
 *   > [!warning] **The title**
 *   >
 *   > Body of the callout.
 *
 * Output HAST: a <blockquote data-callout="warning"> element with the
 * marker stripped from the first paragraph.
 *
 * The markdown-components.tsx `blockquote` override reads the attribute
 * via `node.properties["data-callout"]` and renders a styled panel.
 */
export const remarkCallouts: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const firstChild = node.children[0];
      if (!firstChild || firstChild.type !== "paragraph") return;

      const para = firstChild as Paragraph;
      const firstInline = para.children[0];
      if (!firstInline || firstInline.type !== "text") return;

      const textNode = firstInline as Text;
      const match = /^\[!(\w+)\]\s*/.exec(textNode.value);
      if (!match) return;

      const calloutType = match[1].toLowerCase();

      // Persist the type onto the blockquote node via mdast → hast data hooks.
      const data = (node.data ??= {});
      const hProperties = (data.hProperties ??= {});
      hProperties["data-callout"] = calloutType;

      // Strip the marker from the first text node.
      textNode.value = textNode.value.slice(match[0].length).trimStart();

      // If the first text node is now empty, drop it.
      if (textNode.value === "") {
        para.children.shift();
      }

      // If the first paragraph is now empty, drop it entirely.
      if (para.children.length === 0) {
        node.children.shift();
      }
    });
  };
};
