"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { markdownComponents } from "./markdown-components";
import { remarkCallouts } from "./remark-callouts";

interface MarkdownRendererProps {
  body: string;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  body,
}: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkCallouts]}
      rehypePlugins={[rehypeSlug]}
      components={markdownComponents}
    >
      {body}
    </ReactMarkdown>
  );
});
