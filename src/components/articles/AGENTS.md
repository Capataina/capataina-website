# Scope

`src/components/articles/`

## Purpose

Article listing/reading surfaces, heading extraction, MDX rendering, and callout transformation.

## Owns

- Direct files: `ArticleView.tsx`, `ArticlesList.tsx`, `ArticlesPanel.tsx`, `TableOfContents.tsx`, `extract-headings.ts`, `markdown-components.tsx`, `remark-callouts.ts`.

## Inherits parent AGENTS.md without duplicating it

- Inherits the nearest parent `AGENTS.md`; this file adds only the local delta.

## Local constraints

- Keep heading extraction, table-of-contents slugs, and rendered heading IDs in one deterministic contract.

## Update this file when

- Update this file when the responsibility, public boundary, generated/excluded status, or directory structure of `src/components/articles` changes.
