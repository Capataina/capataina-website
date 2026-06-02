"use client";

import type { MDXComponents } from "mdx/types";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
// Per-language grammar imports — registered with the highlighter below.
// Using the Async-Light variant means tokenisation runs off the main
// thread and only the grammars we actually use end up in the bundle.
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import rust from "react-syntax-highlighter/dist/esm/languages/prism/rust";
import toml from "react-syntax-highlighter/dist/esm/languages/prism/toml";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";
import {
  AlertTriangle,
  Check,
  Info,
  Lightbulb,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("sh", bash);
SyntaxHighlighter.registerLanguage("shell", bash);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("js", javascript);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("markdown", markdown);
SyntaxHighlighter.registerLanguage("md", markdown);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("py", python);
SyntaxHighlighter.registerLanguage("rust", rust);
SyntaxHighlighter.registerLanguage("rs", rust);
SyntaxHighlighter.registerLanguage("toml", toml);
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("ts", typescript);
SyntaxHighlighter.registerLanguage("yaml", yaml);
SyntaxHighlighter.registerLanguage("yml", yaml);

// Heading slug ids come from rehype-slug. We pull them through to the actual
// DOM `id` so the TOC's anchor links + scroll-spy IntersectionObserver can
// resolve them. The cn-style accent gradient on h1/h2 reuses the live
// --accent-purple custom property so the article styling shifts with the
// active quadrant theme just like the rest of the site.

const codeBlockCustomStyle: CSSProperties = {
  margin: 0,
  padding: "1rem 1.25rem",
  background: "hsla(285, 8%, 14%, 0.7)",
  borderRadius: "0.5rem",
  border: "1px solid rgba(255, 255, 255, 0.06)",
  fontSize: "0.85rem",
  lineHeight: 1.55,
};

// Callout config — Obsidian-style "[!warning]" markers in blockquotes get
// rendered as coloured panels with a header strip, icon, and bordered body.
interface CalloutConfig {
  label: string;
  icon: LucideIcon;
  accent: string;       // base colour (text, icon, border)
  accentSoft: string;   // soft background
  accentBorder: string; // panel border
}

const CALLOUT_CONFIG: Record<string, CalloutConfig> = {
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    accent: "rgb(248, 113, 113)",
    accentSoft: "rgba(239, 68, 68, 0.08)",
    accentBorder: "rgba(239, 68, 68, 0.28)",
  },
  important: {
    label: "Important",
    icon: Sparkles,
    accent: "var(--accent-purple)",
    accentSoft: "color-mix(in srgb, var(--accent-purple) 10%, transparent)",
    accentBorder: "color-mix(in srgb, var(--accent-purple) 30%, transparent)",
  },
  note: {
    label: "Note",
    icon: Info,
    accent: "rgb(96, 165, 250)",
    accentSoft: "rgba(59, 130, 246, 0.08)",
    accentBorder: "rgba(59, 130, 246, 0.28)",
  },
  tip: {
    label: "Tip",
    icon: Lightbulb,
    accent: "rgb(74, 222, 128)",
    accentSoft: "rgba(34, 197, 94, 0.08)",
    accentBorder: "rgba(34, 197, 94, 0.28)",
  },
};


export const markdownComponents: MDXComponents = {
  h1({ children, id }) {
    return (
      <h1
        id={id}
        className="text-3xl font-bold text-gradient-purple mt-2 mb-5 leading-tight scroll-mt-24"
      >
        {children}
      </h1>
    );
  },
  h2({ children, id }) {
    return (
      <h2
        id={id}
        className="text-2xl font-bold text-gradient-purple mt-10 mb-4 leading-tight scroll-mt-24"
      >
        {children}
      </h2>
    );
  },
  h3({ children, id }) {
    return (
      <h3
        id={id}
        className="text-xl font-semibold text-zinc-100 mt-7 mb-3 leading-snug scroll-mt-24"
      >
        {children}
      </h3>
    );
  },
  h4({ children, id }) {
    return (
      <h4
        id={id}
        className="text-lg font-semibold text-zinc-200 mt-5 mb-2 leading-snug scroll-mt-24"
      >
        {children}
      </h4>
    );
  },
  h5({ children, id }) {
    return (
      <h5
        id={id}
        className="text-base font-semibold text-zinc-300 mt-4 mb-2 leading-snug scroll-mt-24"
      >
        {children}
      </h5>
    );
  },
  h6({ children, id }) {
    return (
      <h6
        id={id}
        className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mt-4 mb-2 scroll-mt-24"
      >
        {children}
      </h6>
    );
  },
  p({ children }) {
    return (
      <p className="text-zinc-300 leading-relaxed my-4 text-[0.95rem]">
        {children}
      </p>
    );
  },
  a({ children, href, title }) {
    const isExternal = href?.startsWith("http");
    return (
      <a
        href={href}
        title={title}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="underline decoration-dotted underline-offset-4 transition-colors"
        style={{ color: "var(--accent-purple)" }}
      >
        {children}
      </a>
    );
  },
  strong({ children }) {
    return <strong className="font-bold text-zinc-100">{children}</strong>;
  },
  em({ children }) {
    return <em className="italic text-zinc-200">{children}</em>;
  },
  del({ children }) {
    return (
      <del className="line-through text-zinc-500 decoration-zinc-500">
        {children}
      </del>
    );
  },
  ul({ children }) {
    return (
      <ul className="list-disc pl-6 my-4 space-y-2 text-zinc-300 marker:text-zinc-500 [&_ul]:my-2 [&_ol]:my-2">
        {children}
      </ul>
    );
  },
  ol({ children }) {
    return (
      <ol className="list-decimal pl-6 my-4 space-y-2 text-zinc-300 marker:text-zinc-500 [&_ul]:my-2 [&_ol]:my-2">
        {children}
      </ol>
    );
  },
  li({ children }) {
    return <li className="leading-relaxed">{children}</li>;
  },
  blockquote({ node, children }) {
    // The remark-callouts plugin tags callout blockquotes with a
    // `data-callout` HAST property. The exact key depends on whether
    // hast / react-markdown camelCased it on conversion; check both
    // common forms so the lookup is robust across versions.
    const properties =
      (node as unknown as { properties?: Record<string, unknown> })
        ?.properties ?? {};
    const rawCallout =
      properties["data-callout"] ?? properties["dataCallout"];
    const calloutType =
      typeof rawCallout === "string" ? rawCallout.toLowerCase() : null;

    if (calloutType && CALLOUT_CONFIG[calloutType]) {
      const config = CALLOUT_CONFIG[calloutType];
      const Icon = config.icon;
      return (
        <div
          className="my-6 overflow-hidden rounded-lg border"
          style={{
            background: config.accentSoft,
            borderColor: config.accentBorder,
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2 border-b text-xs font-bold uppercase tracking-wider"
            style={{
              color: config.accent,
              borderColor: config.accentBorder,
              background:
                "color-mix(in srgb, currentColor 8%, transparent)",
            }}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span>{config.label}</span>
          </div>
          <div className="px-5 py-4 text-zinc-200 [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:text-zinc-100">
            {children}
          </div>
        </div>
      );
    }

    return (
      <blockquote
        className="border-l-2 pl-5 my-5 italic text-zinc-300 [&_blockquote]:my-3 [&_p]:my-2"
        style={{ borderColor: "var(--accent-purple-dim)" }}
      >
        {children}
      </blockquote>
    );
  },
  hr() {
    return <hr className="my-10 border-zinc-700/60" />;
  },
  table({ children }) {
    return (
      <div className="my-6 overflow-x-auto rounded-lg border border-zinc-700/60">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    );
  },
  thead({ children }) {
    return (
      <thead
        className="text-zinc-200"
        style={{ background: "hsla(285, 8%, 18%, 0.6)" }}
      >
        {children}
      </thead>
    );
  },
  tbody({ children }) {
    return <tbody className="divide-y divide-zinc-700/60">{children}</tbody>;
  },
  tr({ children }) {
    return <tr className="hover:bg-white/[0.02] transition-colors">{children}</tr>;
  },
  th({ children, style }) {
    return (
      <th
        className="px-4 py-2.5 text-left font-semibold text-zinc-100 border-b border-zinc-700/60"
        style={style}
      >
        {children}
      </th>
    );
  },
  td({ children, style }) {
    return (
      <td className="px-4 py-2.5 text-zinc-300" style={style}>
        {children}
      </td>
    );
  },
  pre({ children }) {
    // SyntaxHighlighter (used inside `code` for language-tagged blocks)
    // provides its own block container via PreTag="div". For untagged
    // fences (ASCII art), the `code` override below renders a styled
    // <pre> directly. Either way, we strip this default wrapper.
    return <>{children}</>;
  },
  code({ className, children, ...rest }) {
    const childString = String(children).replace(/\n$/, "");
    const langMatch = /language-(\w+)/.exec(className || "");

    // Inline code: react-markdown calls `code` with no className and no
    // newlines for `\`backtick spans\``.
    const isInline = !className && !childString.includes("\n");

    if (isInline) {
      return (
        <code
          className="rounded px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-200 border border-white/[0.08]"
          style={{ background: "hsla(285, 8%, 18%, 0.7)" }}
          {...rest}
        >
          {children}
        </code>
      );
    }

    // Fenced block WITH a language → syntax-highlighted code block.
    if (langMatch) {
      return (
        <SyntaxHighlighter
          language={langMatch[1]}
          style={oneDark}
          PreTag="div"
          customStyle={codeBlockCustomStyle}
          codeTagProps={{ style: { fontFamily: "inherit" } }}
        >
          {childString}
        </SyntaxHighlighter>
      );
    }

    // Fenced block WITHOUT a language → ASCII art. Render as a centred
    // monospace block, no card chrome, so diagrams feel like part of the
    // prose rather than a code aside. Horizontal scroll preserves wide
    // diagrams without breaking line alignment.
    return (
      <div className="my-6 flex justify-center overflow-x-auto">
        <pre className="font-mono text-[0.85rem] leading-[1.5] text-zinc-200/90 whitespace-pre">
          {childString}
        </pre>
      </div>
    );
  },
  img({ src, alt }) {
    return (
      <img
        src={src as string}
        alt={alt ?? ""}
        className="my-6 max-w-full rounded-lg border border-zinc-700/60"
      />
    );
  },
  input({ type, checked }) {
    // remark-gfm renders task list checkboxes as <input type="checkbox" disabled />.
    // We swap them for styled spans — task lists in markdown are read-only
    // anyway, so using a non-input element doesn't cost interactivity.
    if (type === "checkbox") {
      if (checked) {
        return (
          <span
            aria-hidden="true"
            className="mr-2 inline-flex h-4 w-4 -mt-0.5 items-center justify-center rounded-[4px] align-middle"
            style={{
              background: "var(--accent-purple)",
              color: "white",
            }}
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        );
      }
      return (
        <span
          aria-hidden="true"
          className="mr-2 inline-block h-4 w-4 -mt-0.5 rounded-[4px] align-middle border-[1.5px]"
          style={{
            borderColor: "var(--accent-purple-dim)",
            background: "hsla(285, 8%, 14%, 0.6)",
          }}
        />
      );
    }
    return null;
  },
};
