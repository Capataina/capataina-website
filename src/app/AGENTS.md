# Scope

`src/app/`

## Purpose

Single-route App Router shell, metadata/font layout, and global visual system.

## Owns

- Direct files: `globals.css`, `layout.tsx`, `page.tsx`.

## Inherits parent AGENTS.md without duplicating it

- Inherits the nearest parent `AGENTS.md`; this file adds only the local delta.

## Local constraints

- Keep exported types and component/service boundaries explicit; colocate focused tests when behaviour or state transitions change.
- `page.tsx` owns hovered/selected quadrant state and the document-level accent swap; canonical labels must stay aligned with `src/types/field.ts`.

## Update this file when

- Update this file when the responsibility, public boundary, generated/excluded status, or directory structure of `src/app` changes.
