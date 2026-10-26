# Scope

`src/types/`

## Purpose

Canonical Field and portfolio-content TypeScript contracts.

## Owns

- Direct files: `article.ts`, `certificate.ts`, `contribution.ts`, `education.ts`, `field.ts`, `index.ts`, `project.ts`, `skill.ts`.

## Inherits parent AGENTS.md without duplicating it

- Inherits the nearest parent `AGENTS.md`; this file adds only the local delta.

## Local constraints

- Change canonical shapes before their data modules and consumers; retain strict discriminants for field-based filtering.

## Update this file when

- Update this file when the responsibility, public boundary, generated/excluded status, or directory structure of `src/types` changes.
