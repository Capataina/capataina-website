# Scope

`src/content/articles/open-source/`

## Purpose

Long-form open-source article MDX and its typed metadata.

## Owns

- Direct files: `burn-afine-pr.mdx`, `burn-afine-pr.ts`.

## Inherits parent AGENTS.md without duplicating it

- Inherits the nearest parent `AGENTS.md`; this file adds only the local delta.

## Local constraints

- Keep exported types and component/service boundaries explicit; colocate focused tests when behaviour or state transitions change.

## Update this file when

- Update this file when the responsibility, public boundary, generated/excluded status, or directory structure of `src/content/articles/open-source` changes.
